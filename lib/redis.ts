import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis client (REST) — one instance reused by the Sorting Hat
 * (cache + rate-limit) and the contact form (rate-limit).
 *
 * Returns `null` when UPSTASH_REDIS_REST_URL / _TOKEN aren't configured (e.g.
 * local dev), so every caller degrades gracefully: rate-limiting is skipped and
 * caching becomes a no-op. SERVER-SIDE ONLY — the token never reaches the browser.
 */
let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
