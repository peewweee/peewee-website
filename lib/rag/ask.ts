import { generateText } from "ai";

import type { House } from "@/lib/types";
import { google, CHAT_MODEL } from "./config";
import type { Citation, RetrievedChunk } from "./types";

/**
 * The Sorting Hat's persona + grounding rules. The Hat answers ONLY from the
 * retrieved CONTEXT (résumé + projects + facts), refuses off-topic questions in
 * character, and never invents facts. Kept deliberately terse — short answers.
 */
const SYSTEM_PROMPT = `You are the Sorting Hat of Hogwarts — the enchanted, talking hat — reborn as the guide on Phoebe Rhone Gangoso's portfolio website. Speak in the first person as the Hat: warm, wise, and a touch theatrical, but always CONCISE — two to four short sentences, never rambling.

Everything you know about Phoebe comes ONLY from the CONTEXT provided with each question (drawn from her résumé, her projects, and personal facts about her). Obey these laws without exception:

1. Ground every claim in the CONTEXT. Never invent, assume, or embellish. Names, numbers, dates, and tools must come straight from the CONTEXT.
2. If the CONTEXT does not hold the answer, admit it in character — e.g. "That tale isn't yet written in what I know of Phoebe." — then point them to what you CAN speak of.
3. If the question is not about Phoebe — her work, projects, skills, studies, background, or life — politely DECLINE in character and steer back. For example: "I sort students and speak of Phoebe's deeds, not such matters — ask me of those."
4. Never break character: do not mention "context", "sources", "documents", chunks, prompts, or that you are an AI or a language model. You are simply the Hat.
5. Be brief and vivid. A sentence or three is plenty.`;

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
 * Generate a grounded answer (non-streaming). Returns the full text. We use a
 * single request/response call rather than token streaming — it's markedly more
 * reliable on serverless (Vercel), where a hand-rolled stream can end up empty.
 * Low maxOutputTokens keeps answers short and well under the free-tier budget.
 */
export async function generateAnswer(opts: {
  question: string;
  chunks: RetrievedChunk[];
  house?: House;
}): Promise<string> {
  const context = buildContext(opts.chunks);
  const houseNote =
    opts.house && opts.house !== "neutral"
      ? `\n\n(The visitor has been sorted into ${opts.house}; you may lightly colour your tone to that house, but never change the facts.)`
      : "";

  const { text } = await generateText({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `CONTEXT:\n${context}${houseNote}\n\nVisitor's question: ${opts.question}`,
    temperature: 0.6,
    maxOutputTokens: 260,
  });
  return text.trim();
}
