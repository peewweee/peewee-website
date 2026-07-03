"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AskResponse, Citation } from "@/lib/rag/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: number;
  role: "hat" | "visitor";
  text: string;
  citations?: Citation[];
};

const GREETING: Message = {
  id: 0,
  role: "hat",
  text:
    "Ah, a curious mind! I'm the Sorting Hat. Ask me anything about Phoebe's work — her " +
    "projects, skills, or experience — and I'll answer from her resume and write-ups. " +
    "(I'm still being enchanted: my answers are stubbed until the RAG pipeline is wired in Phase 3.)",
};

/**
 * SortingHat — Phase 3 STUB (chat-panel UI, no real model).
 *
 * Implements the flagship "Ask the Hat" surface: a thinking state, citation
 * chips, and a real call to POST /api/ask (which returns a stubbed grounded
 * answer). The "Get Sorted" and "Behind the Magic" modes are placeholders.
 *
 * TODO (Phase 3): stream tokens from Gemini; render live citations; add the
 * Get Sorted (classification → data-house swap) and Behind the Magic panels.
 */
export function SortingHat() {
  const [messages, setMessages] = React.useState<Message[]>([GREETING]);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const nextId = React.useRef(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, thinking]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || thinking) return;

    const visitorMsg: Message = { id: nextId.current++, role: "visitor", text: question };
    setMessages((m) => [...m, visitorMsg]);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as AskResponse & { error?: string };
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: "hat",
          text: data.error ?? data.answer,
          citations: data.citations,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId.current++,
          role: "hat",
          text: "My magic faltered — please try asking again.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="mx-auto flex h-[min(70vh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-card border border-border bg-surface">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <span aria-hidden className="text-xl">
            🎩
          </span>
          The Sorting Hat
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge size="sm" variant="solid">
            Ask the Hat
          </Badge>
          <Badge size="sm" variant="muted" title="Coming in Phase 3">
            Get Sorted · soon
          </Badge>
          <Badge size="sm" variant="muted" title="Coming in Phase 3">
            Behind the Magic · soon
          </Badge>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {thinking && <ThinkingBubble />}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <label htmlFor="hat-input" className="sr-only">
          Ask the Sorting Hat a question
        </label>
        <input
          id="hat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Phoebe's work…"
          maxLength={500}
          autoComplete="off"
          className="flex-1 rounded-field border border-border bg-bg-sunken px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-faint focus-visible:border-accent focus-visible:shadow-focus focus-visible:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={!input.trim() || thinking}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isHat = message.role === "hat";
  return (
    <div className={cn("flex", isHat ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] rounded-card px-4 py-3 text-sm leading-relaxed",
          isHat
            ? "border border-border bg-surface text-foreground"
            : "bg-gold text-gold-ink",
        )}
      >
        <p>{message.text}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((c, i) => (
              <Badge key={i} size="sm" variant="default">
                from: {c.source}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start" aria-label="The Hat is thinking">
      <div className="flex items-center gap-1 rounded-card border border-border bg-surface px-4 py-3">
        <span className="sr-only">The Hat is thinking…</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-think rounded-pill bg-accent-text"
            style={{ animationDelay: `${i * 0.18}s` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
