"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = { name?: string; email?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HONEYPOT_FIELD = "wand_signature";

/**
 * The "owl post" contact form. Client-side validation + a honeypot field; posts
 * to /api/contact (which stubs the Resend send until a key is configured).
 */
export function ContactForm() {
  const [status, setStatus] = React.useState<Status>("idle");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);

  function validate(name: string, email: string, message: string): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Your name is required.";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (message.trim().length < 10)
      next.message = "Tell me a little more (10+ characters).";
    return next;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const honeypot = String(data.get(HONEYPOT_FIELD) ?? "");

    // Bot caught by honeypot — pretend success, send nothing.
    if (honeypot.trim() !== "") {
      setStatus("success");
      form.reset();
      return;
    }

    const nextErrors = validate(name, email, message);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, [HONEYPOT_FIELD]: honeypot }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setServerError(body.error ?? "The owl couldn't deliver your message. Try again.");
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("success");
    } catch {
      setServerError("Network trouble — the owl turned back. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-card border border-[var(--success)] bg-[rgba(87,190,137,0.08)] p-6 text-center"
      >
        <CheckCircle2 className="mx-auto size-8 text-[var(--success)]" aria-hidden />
        <h2 className="mt-3 font-display text-xl font-bold text-foreground">
          Your owl is on its way
        </h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Thanks for reaching out — I&rsquo;ll reply as soon as it lands.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setStatus("idle")}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Honeypot — hidden from humans, tempting to bots. */}
      <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          placeholder="Your name"
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-[var(--danger)]">
            {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-[var(--danger)]">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          placeholder="Write your message…"
        />
        {errors.message && (
          <p id="message-error" className="text-sm text-[var(--danger)]">
            {errors.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-field border border-[var(--danger)] bg-[rgba(233,122,112,0.08)] px-3 py-2 text-sm text-[var(--danger)]"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {serverError}
        </p>
      )}

      <Button type="submit" loading={status === "submitting"}>
        {status === "submitting" ? "Sending owl…" : "Send owl"}
        {status !== "submitting" && <Send className="size-4" aria-hidden />}
      </Button>
    </form>
  );
}
