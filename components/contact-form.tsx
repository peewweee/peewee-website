"use client";

import * as React from "react";
import Script from "next/script";
import { Mail, Feather, AlertCircle } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = { name?: string; email?: string; message?: string };
type Values = { name: string; email: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HONEYPOT_FIELD = "wand_signature";
const MAX_MESSAGE = 1000;
const MIN_MESSAGE = 10;
const NAME_MAX = 100;

// Cloudflare Turnstile (invisible CAPTCHA). The SITE key is public by design; the
// SECRET is verified server-side only. When the site key is absent, the widget is
// skipped and the form works without it.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TurnstileOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  appearance?: "always" | "execute" | "interaction-only";
};
type TurnstileApi = {
  render: (el: HTMLElement, opts: TurnstileOptions) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const FIELD_CLASS =
  "w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-faint focus-visible:border-accent focus-visible:shadow-focus focus-visible:outline-none";

const LABEL_CLASS = "mb-1.5 block text-xs font-medium text-foreground-muted";

/**
 * The "owl post" contact form (from the Wizarding Design System): an animated owl
 * avatar header, parchment fields, and a gold "Send Owl" pill. Client-side
 * validation + a honeypot; posts to /api/contact (stubbed until Resend is keyed).
 */
export function ContactForm() {
  const [values, setValues] = React.useState<Values>({ name: "", email: "", message: "" });
  const [status, setStatus] = React.useState<Status>("idle");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  // Once the user has tried to submit, keep validation live as they fix fields.
  const [attempted, setAttempted] = React.useState(false);
  // Cloudflare Turnstile token, kept in a ref so onSubmit always reads the latest
  // value (the invisible check can take a few seconds to solve on load).
  // `turnstileReset` bumps to force a fresh token after a failed submit (tokens
  // are single-use).
  const turnstileTokenRef = React.useRef<string | null>(null);
  const [turnstileReset, setTurnstileReset] = React.useState(0);
  const handleTurnstileToken = React.useCallback((token: string | null) => {
    turnstileTokenRef.current = token;
  }, []);

  function validate(v: Values): FieldErrors {
    const next: FieldErrors = {};
    if (!v.name.trim()) next.name = "Your name is required.";
    else if (v.name.trim().length > NAME_MAX) next.name = `Keep it under ${NAME_MAX} characters.`;
    if (!EMAIL_RE.test(v.email.trim())) next.email = "Enter a valid email address.";
    const len = v.message.trim().length;
    if (len < MIN_MESSAGE) next.message = `Tell me a little more (${MIN_MESSAGE}+ characters).`;
    else if (v.message.length > MAX_MESSAGE)
      next.message = `Please keep it under ${MAX_MESSAGE} characters.`;
    return next;
  }

  function update(key: keyof Values, value: string) {
    setValues((prev) => {
      const nextValues = { ...prev, [key]: value };
      if (attempted) setErrors(validate(nextValues));
      return nextValues;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const honeypot = String(new FormData(e.currentTarget).get(HONEYPOT_FIELD) ?? "");

    // Bot caught by honeypot — pretend success, send nothing.
    if (honeypot.trim() !== "") {
      setStatus("success");
      return;
    }

    setAttempted(true);
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    // Wait for the invisible bot-check to produce a token (it can take a few
    // seconds on load). The button shows "Sending…" meanwhile, then submits
    // automatically once the token arrives — no "try again" bounce for the user.
    let token = turnstileTokenRef.current;
    if (TURNSTILE_SITE_KEY && !token) {
      for (let i = 0; i < 48 && !token; i++) {
        await new Promise((r) => setTimeout(r, 250));
        token = turnstileTokenRef.current;
      }
      if (!token) {
        setStatus("idle");
        setServerError("Couldn't complete the security check — please refresh and try again.");
        return;
      }
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, [HONEYPOT_FIELD]: honeypot, turnstileToken: token }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        field?: keyof FieldErrors;
      };
      if (!res.ok || !body.ok) {
        // The single-use Turnstile token may be spent — refresh it for a retry.
        setTurnstileReset((n) => n + 1);
        // A field-specific server error (e.g. the email's domain can't receive
        // mail) maps back onto that field instead of the generic banner.
        if (body.field && body.error) {
          setErrors((prev) => ({ ...prev, [body.field!]: body.error }));
          setStatus("idle");
        } else {
          setServerError(body.error ?? "The owl couldn't deliver your message. Try again.");
          setStatus("error");
        }
        return;
      }
      setValues({ name: "", email: "", message: "" });
      setErrors({});
      setAttempted(false);
      setStatus("success");
    } catch {
      setTurnstileReset((n) => n + 1);
      setServerError("Network trouble — the owl turned back. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[14px] border border-border bg-bg p-6 sm:p-7">
      {/* top accent hairline */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent"
      />

      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      )}

      {/* Header */}
      <div className="mb-5 flex items-center gap-3.5">
        <OwlAvatar />
        <div>
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            Send an Owl
            <Mail className="size-[15px] text-accent-text" aria-hidden />
          </h2>
          <p className="text-xs text-foreground-faint">
            Owl post · replies usually within a day
          </p>
        </div>
      </div>

      {status === "success" ? (
        <div className="space-y-3">
          <p
            role="status"
            className="flex items-center gap-2.5 rounded-[10px] border border-success/35 bg-success/[0.12] px-3.5 py-2.5 text-sm text-success"
          >
            <Feather className="size-4 shrink-0" aria-hidden />
            Your owl is away with the letter — thanks!
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="text-sm font-semibold text-accent-text transition-colors hover:text-gold-hover"
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
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

          <div>
            <label htmlFor="name" className={LABEL_CLASS}>
              Full Name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              maxLength={NAME_MAX}
              placeholder="Harry Potter"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={FIELD_CLASS}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-xs text-danger">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={LABEL_CLASS}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={200}
              placeholder="harrypotter@hogwarts.com"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={FIELD_CLASS}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-danger">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label htmlFor="message" className="text-xs font-medium text-foreground-muted">
                Message
              </label>
              <span
                aria-hidden
                className={`text-[11px] tabular-nums ${
                  values.message.length > MAX_MESSAGE - 100
                    ? "text-warning"
                    : "text-foreground-faint"
                }`}
              >
                {values.message.length}/{MAX_MESSAGE}
              </span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={MAX_MESSAGE}
              placeholder="Write your message here…"
              value={values.message}
              onChange={(e) => update("message", e.target.value)}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
              className={`${FIELD_CLASS} resize-y`}
            />
            {errors.message && (
              <p id="message-error" className="mt-1 text-xs text-danger">
                {errors.message}
              </p>
            )}
          </div>

          {/* Invisible bot check (renders only when the site key is configured). */}
          <TurnstileBox onToken={handleTurnstileToken} resetSignal={turnstileReset} />

          <div className="flex flex-wrap items-center justify-between gap-3">

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center gap-2 rounded-pill bg-gold px-[18px] py-2 text-[13px] font-semibold text-gold-ink shadow-[0_0_14px_rgba(var(--accent-glow),0.35)] transition-all hover:bg-gold-hover hover:shadow-[0_0_24px_rgba(var(--accent-glow),0.55)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail className="size-[15px]" aria-hidden />
              {status === "submitting" ? "Sending…" : "Send Owl"}
            </button>
          </div>

          {serverError && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-[10px] border border-danger/40 bg-danger/[0.08] px-3 py-2 text-sm text-danger"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden />
              {serverError}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

/**
 * Cloudflare Turnstile widget. Explicitly rendered (robust across the form's
 * mount/unmount on success → "Send another"), reports its token up, and refreshes
 * when `resetSignal` changes after a failed submit. Renders nothing until the
 * site key is configured.
 */
function TurnstileBox({
  onToken,
  resetSignal,
}: {
  onToken: (token: string | null) => void;
  resetSignal: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const render = () => {
      if (cancelled || widgetId.current || !ref.current || !window.turnstile) return false;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
        appearance: "interaction-only",
      });
      return true;
    };

    // Poll until the Turnstile script has loaded, then render once.
    if (!render()) {
      interval = setInterval(() => {
        if (render()) clearInterval(interval);
      }, 150);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* already removed */
        }
        widgetId.current = null;
      }
      onToken(null);
    };
  }, [onToken]);

  // Refresh the (single-use) token after a failed submit.
  React.useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetId.current);
      } catch {
        /* ignore */
      }
      onToken(null);
    }
  }, [resetSignal, onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="mt-1 empty:hidden" />;
}

/** Glowing round avatar housing the mail owl. */
function OwlAvatar() {
  return (
    <div
      className="relative flex size-[46px] flex-none items-center justify-center rounded-full border border-accent"
      style={{
        background: "radial-gradient(circle at 50% 38%, #1d2342, #0b1026)",
        boxShadow: "0 0 16px rgba(var(--accent-glow), 0.4)",
      }}
    >
      <span
        className="absolute inset-0 rounded-full animate-hat-glow motion-reduce:animate-none"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-glow), 0.25), transparent 70%)",
        }}
      />
      <OwlIcon />
    </div>
  );
}

/** The mail-owl from the design system — floats, flaps, blinks, bobs its letter. */
function OwlIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 48 48" className="relative overflow-visible" aria-hidden>
      <g className="origin-center animate-owl-float [transform-box:fill-box] motion-reduce:animate-none">
        {/* ear tufts */}
        <path
          d="M15 13 L17.5 6 L20.5 13 Z"
          fill="#6b5535"
          className="origin-bottom animate-tuft-wiggle [transform-box:fill-box] motion-reduce:animate-none"
        />
        <path
          d="M33 13 L30.5 6 L27.5 13 Z"
          fill="#6b5535"
          className="origin-bottom animate-tuft-wiggle [transform-box:fill-box] motion-reduce:animate-none"
          style={{ animationDelay: "0.3s" }}
        />
        {/* body */}
        <ellipse cx="24" cy="25" rx="13" ry="14" fill="#6b5535" />
        <path
          d="M24 16 C18 16 16 22 16 27 C16 32 20 36 24 36 C28 36 32 32 32 27 C32 22 30 16 24 16 Z"
          fill="#b89b6a"
        />
        {/* wings */}
        <path
          d="M12 22 C8 26 9 33 13 36 C14 31 14 26 14 22 Z"
          fill="#5c4a2e"
          className="origin-top animate-wing-flap [transform-box:fill-box] motion-reduce:animate-none"
        />
        <path
          d="M36 22 C40 26 39 33 35 36 C34 31 34 26 34 22 Z"
          fill="#5c4a2e"
          className="origin-top animate-wing-flap [transform-box:fill-box] motion-reduce:animate-none"
          style={{ animationDelay: "0.2s" }}
        />
        {/* eyes */}
        <g className="origin-center animate-hat-blink [transform-box:fill-box] motion-reduce:animate-none">
          <circle cx="19" cy="22" r="6" fill="#fff" />
          <circle cx="29" cy="22" r="6" fill="#fff" />
          <circle cx="19" cy="22" r="3" fill="#1a130a" />
          <circle cx="29" cy="22" r="3" fill="#1a130a" />
          <circle cx="20.2" cy="20.8" r="0.9" fill="#fff" />
          <circle cx="30.2" cy="20.8" r="0.9" fill="#fff" />
        </g>
        {/* beak */}
        <path d="M24 25 l-2.6 3.4 h5.2 Z" fill="#D4AF37" />
        {/* the letter */}
        <g className="origin-center animate-mail-bob [transform-box:fill-box] motion-reduce:animate-none">
          <rect x="17" y="34" width="14" height="9" rx="1.5" fill="#F4ECD8" stroke="#caa84a" strokeWidth="1" />
          <path d="M17.4 35 L24 39.5 L30.6 35" stroke="#caa84a" strokeWidth="1" fill="none" />
          <circle cx="24" cy="38.6" r="1.5" fill="#B11E36" />
        </g>
      </g>
    </svg>
  );
}
