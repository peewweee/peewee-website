import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Central Gemini config for the Sorting Hat (RAG). SERVER-SIDE ONLY — the key is
 * read from GEMINI_API_KEY and never exposed to the browser.
 *
 * One free Google AI Studio key powers both generation (Flash-Lite) and
 * embeddings (gemini-embedding-001). Model ids are overridable via env so you can
 * swap them without touching code. Keep EMBED_MODEL in sync with the ingest
 * script (scripts/ingest.mjs) — the index must be built with the same model the
 * query is embedded with.
 */
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

/** Generation model — grounded answers. Override with GEMINI_CHAT_MODEL. */
export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash-lite";

/** Embedding model — retrieval. Override with GEMINI_EMBED_MODEL. */
export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

/** True when a Gemini key is configured (else the Hat replies in-character). */
export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}
