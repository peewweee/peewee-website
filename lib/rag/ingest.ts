/**
 * Ingestion is a BUILD STEP, not runtime code — it lives in `scripts/ingest.mjs`
 * and is run with `npm run ingest`. It chunks the corpus (project MDX +
 * content/resume.md + content/facts.md), embeds each chunk with Gemini
 * (text-embedding-004), and writes the committed index to `lib/rag/index.json`.
 *
 * Runtime retrieval reads that index in `lib/rag/retrieve.ts`. There is nothing
 * to import here.
 */
export {};
