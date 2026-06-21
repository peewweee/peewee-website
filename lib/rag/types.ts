import type { House } from "@/lib/types";

/** A chunk of source material (resume / project notes) prepared for embedding. */
export interface SourceChunk {
  /** Stable id, e.g. "aura#3". */
  id: string;
  /** Human-readable origin used for citations, e.g. "Aura" or "Resume". */
  source: string;
  /** The text content of the chunk. */
  text: string;
  /** Optional metadata stored alongside the vector. */
  metadata?: Record<string, string | number | boolean>;
}

/** A chunk returned from vector search, with its similarity score. */
export interface RetrievedChunk extends SourceChunk {
  score: number;
}

/** A citation shown to the user under an answer. */
export interface Citation {
  /** Origin label, e.g. "Aura". */
  source: string;
  /** Optional short supporting snippet. */
  snippet?: string;
  /** Optional similarity score (0–1). */
  score?: number;
  /** Optional deep link to the source page. */
  href?: string;
}

/** Request body for POST /api/ask. */
export interface AskRequest {
  question: string;
  /** Optional house context to flavor tone (never changes grounding). */
  house?: House;
}

/** Response from the Sorting Hat. */
export interface AskResponse {
  answer: string;
  citations: Citation[];
  /** True when the answer is grounded in retrieved sources. */
  grounded: boolean;
  /** True when this came from the Phase-1 stub (no real model/retrieval). */
  stubbed?: boolean;
}
