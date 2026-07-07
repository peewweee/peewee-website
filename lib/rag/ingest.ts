/**
 * Ingestion is a BUILD STEP, not runtime code — it lives in `scripts/ingest.mjs`
 * and is run with `npm run ingest`. It chunks the corpus (project MDX +
 * content/data.md + content/facts.md), embeds each chunk with Gemini
 * (gemini-embedding-001), and writes the committed index to `lib/rag/index.json`.
 *
 * Runtime retrieval reads that index in `lib/rag/retrieve.ts`. There is nothing
 * to import here.
 */
export {};
