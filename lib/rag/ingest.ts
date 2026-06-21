import type { SourceChunk } from "./types";

/**
 * Build-time ingestion — Phase 3 STUB.
 *
 * The real pipeline (run once, e.g. via a script or build step):
 *   1. Read the resume + project MDX (contentlayer `allProjects`) and any notes.
 *   2. Chunk into ~200–400 token passages with overlap; attach { source } labels.
 *   3. Embed each chunk with Gemini (text-embedding model) using GEMINI_API_KEY.
 *   4. Upsert vectors + metadata into Upstash Vector (UPSTASH_VECTOR_REST_*).
 *
 * Keep this SERVER-SIDE only. Never expose the API key to the client.
 */

/** Chunk source documents into embeddable passages. (TODO: real chunker.) */
export function chunkDocuments(_docs: { source: string; text: string }[]): SourceChunk[] {
  // TODO (Phase 3): implement token-aware chunking with overlap.
  return [];
}

/** Embed + upsert all chunks into the vector store. (TODO: Gemini + Upstash.) */
export async function ingestContent(): Promise<{ ingested: number }> {
  // TODO (Phase 3):
  //   const index = new Index({ url: env.UPSTASH_VECTOR_REST_URL, token: ... });
  //   for (const batch of chunks) { embed via Gemini; index.upsert(batch); }
  throw new Error("ingestContent() not implemented yet (Phase 3).");
}
