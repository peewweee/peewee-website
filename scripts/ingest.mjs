// @ts-nocheck
/**
 * Build the Sorting Hat's local vector index.
 *
 *   npm run ingest
 *
 * Reads the corpus (project MDX + content/data.md + content/facts.md), chunks
 * it, embeds each chunk with Gemini (gemini-embedding-001), and writes the committed
 * index to lib/rag/index.json. Re-run this whenever you edit any corpus file.
 *
 * Needs GEMINI_API_KEY in .env.local (free Google AI Studio key). Server-side only.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany } from "ai";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal .env.local loader (no dependency) — existing env vars win. */
function loadEnv(root) {
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;
    for (const raw of readFileSync(file, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadEnv(ROOT); // reads .env.local

// `npm run ingest -- --dry` gathers + chunks the corpus and prints a plan,
// WITHOUT embedding — useful for checking coverage with no API key.
const DRY = process.argv.includes("--dry");

// ── helpers ──────────────────────────────────────────────────────────────────
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Short citation label from a project title ("Aura: …" → "Aura"). */
const shortSource = (title) => title.split(/[:—–-]/)[0].trim() || title;

/** Drop HTML comments, MDX comments, and unfilled "(placeholder …)" lines. */
function clean(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .split("\n")
    .filter((line) => !/\(placeholder/i.test(line))
    .join("\n")
    .trim();
}

/** Split a doc into ~maxChars chunks on paragraph boundaries, with a little overlap. */
function chunkText(text, maxChars = 1100, overlap = 150) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > maxChars) {
      chunks.push(cur.trim());
      cur = cur.slice(Math.max(0, cur.length - overlap));
    }
    cur += (cur ? "\n\n" : "") + p;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks;
}

// ── gather corpus ────────────────────────────────────────────────────────────
function loadProjects() {
  const dir = join(ROOT, "content", "projects");
  const docs = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    if (data.published === false) continue;
    const stack = Array.isArray(data.stack) ? data.stack.join(", ") : "";
    const text = [
      `Project: ${data.title}`,
      data.category && `Category: ${data.category}`,
      data.summary && `Summary: ${data.summary}`,
      stack && `Tech stack: ${stack}`,
      data.status && `Status: ${data.status}`,
      data.link && `Live link: ${data.link}`,
      clean(content),
    ]
      .filter(Boolean)
      .join("\n");
    docs.push({ source: shortSource(data.title), text });
  }
  return docs;
}

function loadMarkdown(relPath, fallbackSource) {
  const { data, content } = matter(readFileSync(join(ROOT, relPath), "utf8"));
  return { source: data.source ?? fallbackSource, text: clean(content) };
}

const docs = [
  ...loadProjects(),
  loadMarkdown("content/data.md", "Profile"),
  loadMarkdown("content/facts.md", "About Phoebe"),
].filter((d) => d.text);

// ── chunk ────────────────────────────────────────────────────────────────────
const records = [];
for (const doc of docs) {
  chunkText(doc.text).forEach((text, i) => {
    records.push({ id: `${slug(doc.source)}#${i}`, source: doc.source, text });
  });
}

if (records.length === 0) {
  console.error("✖ No content to ingest — check content/ files.");
  process.exit(1);
}

// ── dry run — show the plan, no embedding, no key needed ─────────────────────
if (DRY) {
  const bySource = {};
  for (const r of records) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  console.log(`\nDry run — ${records.length} chunks from ${docs.length} sources:`);
  for (const [src, n] of Object.entries(bySource)) {
    console.log(`  ${String(n).padStart(3)}  ${src}`);
  }
  console.log(`\nSample chunk (${records[0].id}):\n${records[0].text.slice(0, 220)}…\n`);
  process.exit(0);
}

// ── embed (batched) ──────────────────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error(
    "\n✖ GEMINI_API_KEY is not set.\n  Add it to .env.local (free key: https://aistudio.google.com/apikey),\n  then run `npm run ingest` again.\n",
  );
  process.exit(1);
}
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
const google = createGoogleGenerativeAI({ apiKey: API_KEY });

console.log(`Embedding ${records.length} chunks from ${docs.length} sources with ${EMBED_MODEL}…`);
const model = google.textEmbedding(EMBED_MODEL);
const BATCH = 96;
const index = [];
for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const { embeddings } = await embedMany({ model, values: batch.map((r) => r.text) });
  batch.forEach((r, j) =>
    index.push({ id: r.id, source: r.source, text: r.text, embedding: embeddings[j] }),
  );
  console.log(`  embedded ${Math.min(i + BATCH, records.length)}/${records.length}`);
}

// ── write index (one record per line for readable git diffs) ─────────────────
const out = `[\n${index.map((r) => JSON.stringify(r)).join(",\n")}\n]\n`;
writeFileSync(join(ROOT, "lib", "rag", "index.json"), out, "utf8");

console.log(
  `\n✔ Wrote ${index.length} vectors (dim ${index[0].embedding.length}) to lib/rag/index.json`,
);
console.log("  Restart the dev server (or rebuild) to pick up the new index.\n");
