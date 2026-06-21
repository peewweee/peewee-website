import type { RetrievedChunk } from "./types";

/**
 * Retrieval — Phase 3 STUB.
 *
 * Real flow: embed the query with Gemini, then query Upstash Vector for the
 * top-k most similar chunks and return them with scores.
 *
 * Returns [] for now so the rest of the pipeline can be exercised end-to-end.
 */
export async function retrieve(_query: string, _topK = 5): Promise<RetrievedChunk[]> {
  // TODO (Phase 3):
  //   const [embedding] = await embed([query]);          // Gemini embeddings
  //   const res = await index.query({ vector: embedding, topK, includeMetadata: true });
  //   return res.map(toRetrievedChunk);
  return [];
}
