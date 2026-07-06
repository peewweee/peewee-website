"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AskResponse, Citation } from "@/lib/rag/types";
import { HatAvatar } from "./hat-icon";

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
    "projects, skills, or experience.",
};

/**
 * SortingHat — the "Ask the Sorting Hat" chat panel, styled to the Wizarding
 * Design System (glowing animated hat avatar, tailed bubbles, citation chips).
 * Answers come from POST /api/ask (a stubbed grounded response for now).
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
    <div
      className="flex h-[min(60vh,560px)] w-full flex-col overflow-hidden rounded-[18px] border border-accent shadow-[0_0_40px_rgba(var(--accent-glow),0.14)]"
      style={{ background: "linear-gradient(180deg, var(--surface), var(--bg))" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3.5 border-b border-border bg-bg-sunken/50 px-5 py-4 sm:px-6">
        <HatAvatar size={46} />
        <div className="mr-auto min-w-0">
          <p className="font-display text-[17px] font-semibold text-foreground">
            The Sorting Hat
          </p>
        </div>
        <span className="inline-flex flex-none items-center gap-1.5 rounded-pill border border-success/35 bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
          <span className="size-1.5 rounded-full bg-success" />
          online
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-5 sm:px-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {thinking && <ThinkingBubble />}
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2.5 border-t border-border bg-bg-sunken/50 px-5 py-4 sm:px-6"
      >
        <label htmlFor="hat-input" className="sr-only">
          Ask the Sorting Hat a question
        </label>
        <input
          id="hat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about Phoebe's work, projects, or stack…"
          maxLength={500}
          autoComplete="off"
          className="flex-1 rounded-pill border border-border-strong bg-bg px-[18px] py-2.5 text-sm text-foreground placeholder:text-foreground-faint focus-visible:border-accent focus-visible:shadow-focus focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="inline-flex flex-none items-center gap-1.5 rounded-pill bg-gold px-4 py-2.5 text-sm font-semibold text-gold-ink transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden />
          Ask
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isHat = message.role === "hat";
  return (
    <div className={cn("flex items-end gap-2.5", isHat ? "flex-row" : "flex-row-reverse")}>
      {isHat ? <HatAvatar size={40} /> : <YouAvatar />}
      <div className={cn("min-w-0 max-w-[80%]", !isHat && "flex flex-col items-end")}>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            isHat
              ? "rounded-[14px_14px_14px_4px] border border-border bg-surface text-foreground"
              : "rounded-[14px_14px_4px_14px] bg-accent font-medium text-accent-ink",
          )}
        >
          {message.text}
        </div>
        {isHat && message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.citations.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-pill border border-accent bg-[rgba(var(--accent-glow),0.1)] px-2.5 py-1 text-[11px] font-medium text-accent-text"
              >
                <FileGlyph />
                from: {c.source}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function YouAvatar() {
  return (
    <div className="flex size-[34px] flex-none items-center justify-center rounded-full border border-border-strong bg-surface-2 font-sans text-[11px] font-semibold text-foreground-muted">
      You
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2.5" aria-label="The Hat is thinking">
      <HatAvatar size={40} />
      <div className="flex items-center gap-1.5 rounded-[14px_14px_14px_4px] border border-border bg-surface px-4 py-3.5">
        <span className="sr-only">The Hat is thinking…</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-think rounded-pill bg-accent-text"
            style={{ animationDelay: `${i * 0.18}s` }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

/** Small parchment/file glyph used on citation chips. */
function FileGlyph() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M5 4h11l3 3v13H8a3 3 0 0 1-3-3Z" />
    </svg>
  );
}
