import { NextResponse } from "next/server";
import { z } from "zod";

import { ask } from "@/lib/rag/ask";

export const runtime = "nodejs";

// House never changes grounding — it only flavors tone (Phase 3).
const askSchema = z.object({
  question: z.string().min(1, "Ask a question.").max(500),
  house: z
    .enum(["neutral", "gryffindor", "slytherin", "ravenclaw", "hufflepuff"])
    .optional(),
});

/**
 * POST /api/ask — the Sorting Hat endpoint.
 *
 * Phase 1: validates input and returns a stubbed, grounded-style answer from
 * lib/rag/ask (no model, no keys). The API key stays server-side here.
 *
 * TODO (Phase 3), in this order, before calling ask():
 *   1. Upstash Redis @upstash/ratelimit — per-IP rate limit; 429 on exceed.
 *   2. Upstash Redis cache — return a cached answer for repeat questions.
 *   3. Stream the Gemini response (Vercel AI SDK) instead of a single JSON blob.
 */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const parsed = askSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 },
    );
  }

  const result = await ask(parsed.data);
  return NextResponse.json(result);
}
