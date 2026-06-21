import type { AskRequest, AskResponse } from "./types";
import { retrieve } from "./retrieve";

/**
 * Ask the Hat — Phase 3 STUB (server-side).
 *
 * Real flow:
 *   1. Rate-limit + cache check (Upstash Redis) — done in the API route.
 *   2. retrieve() the most relevant resume/project chunks.
 *   3. Compose a Gemini Flash-Lite answer grounded ONLY in those chunks, with
 *      a guardrail prompt that refuses off-topic questions.
 *   4. Return the answer + source citations (stream in the route).
 *
 * For Phase 1 this returns a clearly-labelled stubbed, grounded-style answer so
 * the UI and /api/ask contract can be built and demoed without any API keys.
 */
export async function ask(req: AskRequest): Promise<AskResponse> {
  const question = req.question.trim();

  // Exercise the (stubbed) retrieval step so the pipeline shape is real.
  const chunks = await retrieve(question);

  if (chunks.length === 0) {
    return {
      answer:
        "The Sorting Hat is still being enchanted. Once my memory (Phoebe's resume and " +
        "project write-ups) is woven into the vector index, I'll answer your questions " +
        "here — grounded strictly in her real work, with citations. For now, explore the " +
        "Projects, About, and Resume sections directly.",
      citations: [],
      grounded: false,
      stubbed: true,
    };
  }

  // TODO (Phase 3): build the grounded prompt from `chunks` and call Gemini.
  return {
    answer: "Grounded answer would appear here.",
    citations: chunks.map((c) => ({ source: c.source, snippet: c.text, score: c.score })),
    grounded: true,
    stubbed: true,
  };
}
