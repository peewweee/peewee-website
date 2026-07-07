import { z } from "zod";

import { hasGeminiKey } from "@/lib/rag/config";
import { retrieve } from "@/lib/rag/retrieve";
import { generateAnswer, citationsFromChunks } from "@/lib/rag/ask";
import {
  checkRateLimit,
  getCachedAnswer,
  setCachedAnswer,
} from "@/lib/rag/redis";
import type { Citation, RetrievedChunk } from "@/lib/rag/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const askSchema = z.object({
  question: z.string().min(1, "Ask a question.").max(500),
  // House never changes grounding — it only lightly flavours tone.
  house: z
    .enum(["neutral", "gryffindor", "slytherin", "ravenclaw", "hufflepuff"])
    .optional(),
});

/** In-character messages so the visitor never sees a raw error. */
const HAT = {
  notReady:
    "My memory of Phoebe hasn't been woven into the enchantment yet. Once her tale is bound into my brim, I'll answer in full. For now, wander her Projects, About, and Resume.",
  rateLimited:
    "Even a Sorting Hat must rest... Return on the morrow, and we shall talk again.",
  pondering: "The Hat is pondering... try again in a moment.",
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
  const { question, house } = parsed.data;

  const { id, cookieId, isNew } = identify(req);
  const cookie = isNew
    ? `hat_id=${cookieId}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; HttpOnly`
    : undefined;

  // 1) Rate limit (stops bots burning the free quota; no-op without Redis).
  const rl = await checkRateLimit(id);
  if (!rl.ok) return textReply(HAT.rateLimited, [], { status: 429, cookie });

  // 2) Cache — repeat/common questions never hit Gemini.
  const cached = await getCachedAnswer(question);
  if (cached) return textReply(cached.answer, cached.citations, { cookie });

  // 3) No key yet → answer in character rather than erroring.
  if (!hasGeminiKey()) return textReply(HAT.notReady, [], { cookie });

  // 4) Retrieve. Empty index (not ingested) → in-character "not ready".
  let chunks: RetrievedChunk[];
  try {
    chunks = await retrieve(question, 4);
  } catch {
    chunks = [];
  }
  if (chunks.length === 0) return textReply(HAT.notReady, [], { cookie });

  // 5) Generate a grounded answer (non-streaming — reliable on serverless).
  //    One short backoff-retry, then a friendly in-character fallback. Errors
  //    are logged so Vercel's runtime logs surface any Gemini issue.
  const citations = citationsFromChunks(chunks);
  let answer = "";
  try {
    answer = await generateAnswer({ question, chunks, house });
  } catch (err) {
    // Logged to Vercel runtime logs; the visitor sees the in-character fallback.
    console.error("[hat] generation failed:", errDetail(err));
  }

  if (!answer) return textReply(HAT.pondering, [], { cookie });

  await setCachedAnswer(question, { answer, citations });
  return textReply(answer, citations, { cookie });
}
