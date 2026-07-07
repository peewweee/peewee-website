import { promises as dns } from "node:dns";

import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Resend } from "resend";
import { z } from "zod";

import { getRedis } from "@/lib/redis";

export const runtime = "nodejs";

/** Where messages are delivered, and the verified sender they come from. */
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "phoeberhonegangoso@gmail.com";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "Owl Post <onboarding@resend.dev>";

/** Escape user input before it lands in the email's HTML body. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Manual email pattern avoids depending on zod version-specific string formats.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 1000;
const MIN_MESSAGE = 10;
const NAME_MAX = 100;

const contactSchema = z.object({
  name: z.string().trim().min(1, "Your name is required.").max(NAME_MAX),
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email address.").max(200),
  message: z
    .string()
    .trim()
    .min(MIN_MESSAGE, `Tell me a little more (${MIN_MESSAGE}+ characters).`)
    .max(MAX_MESSAGE, `Please keep it under ${MAX_MESSAGE} characters.`),
});

/** The honeypot field name shared with the client form. Bots fill it; humans
 *  never see it. If present and non-empty, we silently accept and drop. */
const HONEYPOT_FIELD = "wand_signature";

/**
 * Does the email's DOMAIN actually accept mail? An MX-record lookup catches real
 * typos (e.g. `gmail.con`) without any third-party service. We only REJECT when
 * the domain definitively can't receive mail — on transient DNS errors we allow,
 * so a flaky lookup never blocks a real visitor. (True mailbox-level existence
 * would need a paid verification API; MX is the correct free layer.)
 */
async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND") return false; // domain doesn't exist
    return true; // ENODATA / timeout / SERVFAIL → don't hard-block a real user
  }
}

function fieldError(message: string, field: "name" | "email" | "message") {
  return NextResponse.json({ error: message, field }, { status: 422 });
}

// ── per-IP rate limit (~4 submissions/hour) — reuses the shared Upstash Redis ──
let limiter: Ratelimit | null | undefined;
function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const redis = getRedis();
  limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(4, "1 h"),
        prefix: "contact:rl",
        analytics: false,
      })
    : null;
  return limiter;
}
async function withinRateLimit(ip: string): Promise<boolean> {
  const l = getLimiter();
  if (!l) return true; // no Redis configured → skip
  try {
    const { success } = await l.limit(ip);
    return success;
  } catch {
    return true; // a Redis hiccup shouldn't take the form down
  }
}

/**
 * Cloudflare Turnstile (invisible CAPTCHA) — verify the client token server-side.
 * Skipped when TURNSTILE_SECRET_KEY isn't set (degrades gracefully). The secret
 * never leaves the server.
 */
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip the check
  if (!token) return false; // configured but the client sent no token → reject
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Cloudflare unreachable — don't hard-block real visitors; the honeypot,
    // rate-limit, and MX check still guard the endpoint.
    return true;
  }
}

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

/**
 * POST /api/contact — the "owl post".
 *
 * Hardened pipeline: per-IP rate limit → honeypot → schema → MX check →
 * Cloudflare Turnstile → send via Resend (stubbed until RESEND_API_KEY is set).
 * Rate-limit (Upstash) and Turnstile both degrade gracefully when unconfigured.
 * All secrets stay server-side.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);

  // 1) Rate limit per IP — a professional 429, never a raw error.
  if (!(await withinRateLimit(ip))) {
    return NextResponse.json(
      {
        error:
          "You've sent a few messages already. Please wait a little while before sending another.",
      },
      { status: 429 },
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  // Honeypot: pretend success so bots get no signal.
  const honeypot = raw[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = (issue?.path[0] as "name" | "email" | "message") ?? "message";
    return fieldError(issue?.message ?? "Invalid submission.", field);
  }

  const { name, email, message } = parsed.data;

  // Email existence — domain must be able to receive mail. Uses the same
  // friendly message as format validation so the visitor sees one consistent
  // "check your email" cue rather than jargon about mail domains.
  if (!(await domainAcceptsMail(email))) {
    return fieldError("Enter a valid email address.", "email");
  }

  // Bot check — Cloudflare Turnstile, verified last so a fixed typo above doesn't
  // waste the single-use token. Skipped until TURNSTILE_SECRET_KEY is set.
  const turnstileToken = typeof raw.turnstileToken === "string" ? raw.turnstileToken : "";
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return NextResponse.json(
      { error: "We couldn't confirm you're human. Please try again." },
      { status: 403 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    // Stub path — no key configured yet. The message validated fine; log it so
    // nothing is lost during local dev, and report success to the visitor.
    console.info("[owl-post] (stub — no RESEND_API_KEY) validated message:", {
      name,
      email,
      length: message.length,
    });
    return NextResponse.json({ ok: true, stubbed: true });
  }

  // Real delivery. replyTo = the visitor's address so you can reply directly.
  const received = new Date().toUTCString();
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `Owl post from ${name}`,
      text: `New owl post from your portfolio contact form.\n\nName: ${name}\nEmail: ${email}\nReceived: ${received}\n\nMessage:\n${message}`,
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#1a1a1a">
  <h2 style="margin:0 0 12px">New owl post 🦉</h2>
  <p style="margin:2px 0"><strong>Name:</strong> ${escapeHtml(name)}</p>
  <p style="margin:2px 0"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
  <p style="margin:2px 0"><strong>Received:</strong> ${received}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:14px 0">
  <p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p>
</div>`,
    });

    if (error) {
      console.error("[owl-post] Resend error:", error);
      return NextResponse.json(
        { error: "The owl couldn't deliver your message. Please try again shortly." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[owl-post] send failed:", err);
    return NextResponse.json(
      { error: "The owl couldn't deliver your message. Please try again shortly." },
      { status: 502 },
    );
  }
}
