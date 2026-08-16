import { z } from "zod";

import { hasGeminiKey } from "@/lib/rag/config";
import { retrieve } from "@/lib/rag/retrieve";
import { generateAnswer, citationsFromChunks } from "@/lib/rag/ask";
import {
  checkRateLimit,
  reserveDailyCall,
  getCachedAnswer,
  setCachedAnswer,
} from "@/lib/rag/redis";
import type { Citation, RetrievedChunk } from "@/lib/rag/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const askSchema = z.object({
  question: z.string().min(1, "Ask a question.").max(500),
});

/** In-character messages so the visitor never sees a raw error. */
const HAT = {
  notReady:
    "My memory of Phoebe hasn't been woven into the enchantment yet. Once her tale is bound into my brim, I'll answer in full. For now, wander her Projects, About, and Resume.",
  rateLimited:
    "Hmm... a mind far too frantic! You've overwhelmed my ancient magic. Wait one minute for my enchantments to cool down.",
  dailyLimit:
    "Even a Sorting Hat's old magic must rest. Return on the morrow, and I shall gladly tell you more of Phoebe.",
  pondering: "Hmm... my thoughts have wandered a moment too far. Ask me again shortly, and I shall answer.",
};

/**
 * Fixed, complete replies for "list everything" questions. The model doesn't write
 * these — when it detects such a request it emits a sentinel marker (see the system
 * prompt), and we swap in the script here. Same ONE model call, guaranteed-complete
 * list. Plain text (dashes for bullets) to match the Hat's no-markdown style. Keep in
 * sync with content/data.md.
 */
const SCRIPTED = {
  projects:
    "Ah, let me show you what Phoebe has conjured! Seven creations in all:\n\n" +
    "Aura — an AI-powered finance app that turns plain-language expenses into tracked spending and guidance (Java, Spring Boot, Gemini).\n" +
    "CrowdFlow — a crowd-aware itinerary planner that reroutes you to emptier spots (Next.js, Gemini, OpenWeather).\n" +
    "Solar Connect — a real-time dashboard for a solar-powered charging station thesis (Next.js, Supabase).\n" +
    "Balai ni Juan — an event-venue booking site built for a client (JavaScript, HTML, CSS).\n" +
    "Arduino Day PH 2025 — the official event website's UI/UX design (Figma).\n" +
    "Sparkfest — UI/UX design for the GDG PUP hackathon site (Figma).\n" +
    "FairySplit — a fairer shared-expense app, still in the works (React, NestJS).\n\n" +
    "Wander into the Library to see them all in full.",
  experience:
    "Let me trace Phoebe's path so far — three chapters:\n\n" +
    "Junior AI Engineer at SOFI AI Tech Solution (Jan–Mar 2026) — kept 10+ live client chatbots stable, built a document-ingestion system with FAISS, and refined RAG pipelines.\n" +
    "Developer Intern at SOFI AI Tech Solution (Jul–Dec 2025) — launched a client-facing AI agent into production, wired up Google Sheets automations, and extended chatbots through REST APIs.\n" +
    "Software Engineer Intern at Dewise Solutions (Aug–Oct 2024) — built a Next.js progressive web app, completed 10+ Microsoft Learn paths, and shaped UI/UX through wireframing and prototyping.\n\n" +
    "Her Resume holds the finer details.",
} as const;

/** Markers the model emits (instead of answering) for full-list requests. Matched
 *  loosely — the distinctive token is enough, with or without the [[ ]] brackets. */
const SENTINEL = {
  projects: /LIST_PROJECTS/i,
  experience: /LIST_EXPERIENCE/i,
};

/** Stable per-visitor id: client IP + a random id kept in an httpOnly cookie. */
function identify(req: Request): { id: string; cookieId: string; isNew: boolean } {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const match = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)hat_id=([^;]+)/);
  const cookieId = match?.[1] ?? crypto.randomUUID();
  return { id: `${ip}:${cookieId}`, cookieId, isNew: !match };
}

function citationsHeader(citations: Citation[]): string {
  return encodeURIComponent(JSON.stringify(citations));
}

/** Extract a readable detail string from an error (incl. AI SDK API errors). */
function errDetail(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return [
      e.name,
      e.statusCode,
      e.message,
      typeof e.responseBody === "string" ? e.responseBody : undefined,
    ]
      .filter(Boolean)
      .map(String)
      .join(" | ")
      .slice(0, 600);
  }
  return String(err).slice(0, 600);
}

/**
 * True when a generation error looks like Gemini itself being rate-limited or
 * overloaded (429 / RESOURCE_EXHAUSTED / 503 / overloaded) — the same "overwhelmed,
 * wait a minute" situation as a visitor over their own limit, so the Hat replies
 * with the same cooldown message. Any OTHER error keeps the generic fallback.
 */
function isOverloadError(err: unknown): boolean {
  if (err && typeof err === "object") {
    const code = Number((err as Record<string, unknown>).statusCode);
    if (code === 429 || code === 503) return true;
  }
  const s = errDetail(err).toLowerCase();
  return (
    s.includes("resource_exhausted") ||
    s.includes("too many requests") ||
    s.includes("rate limit") ||
    s.includes("overloaded") ||
    s.includes("unavailable") ||
    /\b(429|503)\b/.test(s)
  );
}

/** A non-streamed text reply (cache hits, in-character notices). */
function textReply(
  text: string,
  citations: Citation[],
  init: { status?: number; cookie?: string } = {},
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Citations": citationsHeader(citations),
  };
  if (init.cookie) headers["Set-Cookie"] = init.cookie;
  return new Response(text, { status: init.status ?? 200, headers });
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = askSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }
  const { question } = parsed.data;

  const { id, cookieId, isNew } = identify(req);
  const cookie = isNew
    ? `hat_id=${cookieId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly`
    : undefined;

  // 1) Per-visitor rate limits: 10/minute (burst wall) and 20/day (cost cap).
  //    Different in-character replies: "frantic, wait a minute" vs "come back tomorrow".
  const rl = await checkRateLimit(id);
  if (!rl.ok) {
    const msg = rl.scope === "day" ? HAT.dailyLimit : HAT.rateLimited;
    return textReply(msg, [], { status: 429, cookie });
  }

  // 2) Cache — repeat/common questions never hit Gemini (and skip the budget too).
  const cached = await getCachedAnswer(question);
  if (cached) return textReply(cached.answer, cached.citations, { cookie });

  // 3) No key yet → answer in character rather than erroring.
  if (!hasGeminiKey()) return textReply(HAT.notReady, [], { cookie });

  // 4) Global daily budget — a backstop vs IP-rotating bots that slip past the
  //    per-visitor limit. Cache hits above never reach here, so only Gemini-backed
  //    requests count; when the cap is hit the Hat gives the "come back tomorrow" reply.
  const budget = await reserveDailyCall();
  if (!budget.ok) return textReply(HAT.dailyLimit, [], { status: 429, cookie });

  // 5) Retrieve. Empty index (not ingested) → in-character "not ready".
  let chunks: RetrievedChunk[];
  try {
    chunks = await retrieve(question, 4);
  } catch {
    chunks = [];
  }
  if (chunks.length === 0) return textReply(HAT.notReady, [], { cookie });

  // 6) Generate a grounded answer (non-streaming — reliable on serverless).
  //    One short backoff-retry inside generateAnswer, then an in-character fallback.
  //    Errors are logged so Vercel's runtime logs surface any Gemini issue.
  const citations = citationsFromChunks(chunks);
  let answer = "";
  let overwhelmed = false;
  try {
    answer = await generateAnswer({ question, chunks });
  } catch (err) {
    // Logged to Vercel runtime logs; the visitor sees the in-character fallback.
    console.error("[hat] generation failed:", errDetail(err));
    // Gemini itself rate-limited/overloaded → the same "wait a minute" cooldown.
    overwhelmed = isOverloadError(err);
  }

  if (!answer) {
    return overwhelmed
      ? textReply(HAT.rateLimited, [], { status: 429, cookie })
      : textReply(HAT.pondering, [], { cookie });
  }

  // Sentinel routing: for a "list ALL projects / experience" request the model returns a
  // marker instead of an answer, so we serve the fixed, complete script — in the SAME one
  // call. Cache it so an exact repeat of the question skips the model entirely.
  if (SENTINEL.projects.test(answer)) {
    await setCachedAnswer(question, { answer: SCRIPTED.projects, citations: [] });
    return textReply(SCRIPTED.projects, [], { cookie });
  }
  if (SENTINEL.experience.test(answer)) {
    await setCachedAnswer(question, { answer: SCRIPTED.experience, citations: [] });
    return textReply(SCRIPTED.experience, [], { cookie });
  }

  await setCachedAnswer(question, { answer, citations });
  return textReply(answer, citations, { cookie });
}
