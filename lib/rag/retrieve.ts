import { embed } from "ai";

import { google, EMBED_MODEL } from "./config";
import type { IndexedChunk, RetrievedChunk } from "./types";
import indexData from "./index.json";

/**
 * Retrieval over a LOCAL embedded index (no external vector DB).
 *
 * The index (lib/rag/index.json) is built once by `npm run ingest` — each entry
 * carries its embedding, text, and source. At request time we embed the question
 * with the same Gemini model and rank by cosine similarity in memory.
 *
 * This is intentionally behind a tiny interface: to move to a hosted vector DB
 * later, swap the body of retrieve() — nothing else (the route, ask.ts) changes.
 */
const INDEX = indexData as unknown as IndexedChunk[];

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Embed the query and return the top-K most similar chunks (highest score first). */
export async function retrieve(query: string, topK = 4): Promise<RetrievedChunk[]> {
  // Empty index → the Hat hasn't been "enchanted" yet (run `npm run ingest`).
  if (INDEX.length === 0) return [];

  const { embedding } = await embed({
    model: google.textEmbedding(EMBED_MODEL),
    value: query,
  });

  return INDEX.map((chunk) => ({
    id: chunk.id,
    source: chunk.source,
    text: chunk.text,
    score: cosineSimilarity(embedding, chunk.embedding),
  }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
