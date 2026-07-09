import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/lib/redis";
import type { Citation } from "./types";

/**
 * Optional Upstash Redis layer for the Sorting Hat: a per-visitor rate limit and a
 * global daily circuit-breaker (both stop scripts/bots burning the free Gemini
 * quota), plus an answer cache (the corpus is static, so repeat questions never hit
 * Gemini). Uses the shared client in `@/lib/redis`.
 *
 * ALL are best-effort: if UPSTASH_REDIS_REST_URL / _TOKEN aren't set (e.g. local
 * dev), rate-limiting + the daily cap are skipped and caching is a no-op — the Hat
 * still works.
 */
let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const r = getRedis();
  limiter = r
    ? new Ratelimit({
        redis: r,
        // 10 requests per visitor per MINUTE — generous for any real visitor, a
        // wall for rapid bot/spam bursts. Per-minute so the "wait one minute"
        // cooldown message is literally accurate. Sliding window smooths bursts.
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        prefix: "hat:rl",
        analytics: false,
      })
    : null;
  return limiter;
}

/** Returns { ok:false } only when a configured limiter says the visitor is over. */
export async function checkRateLimit(identifier: string): Promise<{ ok: boolean }> {
  const l = getLimiter();
  if (!l) return { ok: true }; // no Redis configured → never block
  try {
    const { success } = await l.limit(identifier);
    return { ok: success };
  } catch {
    return { ok: true }; // Redis hiccup shouldn't take the Hat down
  }
}

/**
 * Global daily circuit-breaker — a shared Redis counter capping TOTAL Gemini-backed
 * requests per day, as a backstop against IP-rotating bots that slip past the
 * per-visitor limit. Counts one per call; the key rotates by UTC day and self-
 * expires. Best-effort: returns { ok:true } (no cap) when Redis isn't configured.
 * Call it only after the cache miss so cached answers never count.
 */
const DAILY_CALL_CAP = 200;

export async function reserveDailyCall(): Promise<{ ok: boolean }> {
  const r = getRedis();
  if (!r) return { ok: true }; // no Redis → no global cap
  try {
    const day = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    const key = `hat:daily:${day}`;
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, 60 * 60 * 24 + 60); // self-reset after a day
    return { ok: n <= DAILY_CALL_CAP };
  } catch {
    return { ok: true }; // Redis hiccup shouldn't take the Hat down
  }
}

export interface CachedAnswer {
  answer: string;
  citations: Citation[];
}

/** Normalise a question so trivial variants share a cache entry. */
function cacheKey(question: string): string {
  const norm = question
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?.!]+$/, "");
  return `hat:ans:${norm}`;
}

export async function getCachedAnswer(question: string): Promise<CachedAnswer | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return (await r.get<CachedAnswer>(cacheKey(question))) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedAnswer(question: string, value: CachedAnswer): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    // 30-day TTL — the corpus is static, but re-ingesting content should
    // eventually refresh answers.
    await r.set(cacheKey(question), value, { ex: 60 * 60 * 24 * 30 });
  } catch {
    // best-effort cache; ignore failures
  }
}
