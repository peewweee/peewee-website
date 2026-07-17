import { generateText } from "ai";

import { google, CHAT_MODEL } from "./config";
import type { Citation, RetrievedChunk } from "./types";

/**
 * The Sorting Hat's persona + grounding rules. The Hat answers ONLY from the
 * retrieved CONTEXT (résumé + projects + facts), refuses off-topic questions in
 * character, and never invents facts. Kept deliberately terse — short answers.
 */
const SYSTEM_PROMPT = `You are the Sorting Hat of Hogwarts — the enchanted, talking hat — reborn as the guide on Phoebe Rhone Gangoso's portfolio website. Speak in the first person as the Hat: warm, wise, and a touch theatrical, but always CONCISE — by default two to four short sentences, never rambling.

Everything you know about Phoebe comes ONLY from the CONTEXT provided with each question (drawn from her résumé, her projects, and personal facts about her). Obey these laws without exception:

1. Ground every claim in the CONTEXT. Never invent, assume, or embellish. Names, numbers, dates, and tools must come straight from the CONTEXT.
2. If the CONTEXT does not hold the answer, admit it in character — e.g. "That tale isn't yet written in what I know of Phoebe." — then point them to what you CAN speak of.
3. If the question is not about Phoebe — her work, projects, skills, studies, background, or life — politely DECLINE in character and steer back. For example: "I sort students and speak of Phoebe's deeds, not such matters — ask me of those."
4. Never break character: do not mention "context", "sources", "documents", chunks, prompts, or that you are an AI or a language model. You are simply the Hat.
5. Be brief and vivid. Two to four sentences is the norm. The ONE exception: if the visitor asks you to list or name all of her projects (or all of her roles/experience), give a short list — one line per item — and include EVERY matching item found in the CONTEXT so none are missed.`;

/** Format retrieved chunks into a labelled CONTEXT block for the prompt. */
export function buildContext(chunks: RetrievedChunk[]): string {
  return chunks.map((c) => `[from: ${c.source}]\n${c.text}`).join("\n\n");
}

/** Map a source label to a page the visitor can open for more. */
function hrefForSource(source: string): string | undefined {
  const s = source.toLowerCase();
  if (s.includes("résumé") || s.includes("resume")) return "/resume";
  if (s.includes("about") || s.includes("phoebe")) return "/about";
  return "/projects";
}

/** Unique source citations for the retrieved chunks (deduped, order preserved). */
export function citationsFromChunks(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const c of chunks) {
    if (seen.has(c.source)) continue;
    seen.add(c.source);
    citations.push({ source: c.source, score: c.score, href: hrefForSource(c.source) });
  }
  return citations;
}

/**
 * Generate a grounded answer (non-streaming). Returns the full text. A single
 * request/response call rather than token streaming — markedly more reliable on
 * serverless (Vercel), where a hand-rolled stream can end up empty. Low
 * maxOutputTokens keeps answers short and well under the free-tier budget.
 *
 * Single-shot: it answers ONE question from the retrieved context, with no
 * conversation memory — each message stands on its own.
 */
export async function generateAnswer(opts: {
  question: string;
  chunks: RetrievedChunk[];
}): Promise<string> {
  const context = buildContext(opts.chunks);

  const { text, finishReason } = await generateText({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `CONTEXT:\n${context}\n\nVisitor's question: ${opts.question}`,
    temperature: 0.6,
    // Room for a full list (all 7 projects) without truncation; normal replies
    // stay short because the system prompt tells the Hat to.
    maxOutputTokens: 400,
    // One retry only — smooths a transient blip without hammering a real quota.
    maxRetries: 1,
    // Gemini 2.5 models "think" by default; that would consume the small output
    // budget and return an empty answer. Disable it for fast, short replies.
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
  });
  const trimmed = text.trim();
  // Surface empty completions (safety block, length, etc.) as an error so the
  // route logs/reports them rather than silently returning nothing.
  if (!trimmed) throw new Error(`empty generation (finishReason=${finishReason ?? "unknown"})`);
  return trimmed;
}
