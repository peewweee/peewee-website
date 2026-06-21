import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Manual email pattern avoids depending on zod version-specific string formats.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactSchema = z.object({
  name: z.string().min(1, "Your name is required.").max(100),
  email: z.string().regex(EMAIL_RE, "Enter a valid email.").max(200),
  message: z.string().min(10, "Message is too short.").max(5000),
});

/** The honeypot field name shared with the client form. Bots fill it; humans
 *  never see it. If present and non-empty, we silently accept and drop. */
const HONEYPOT_FIELD = "wand_signature";

/**
 * POST /api/contact — the "owl post".
 *
 * Phase 1: validates input + honeypot, then STUBS the send (logs server-side)
 * unless RESEND_API_KEY is configured.
 *
 * TODO (Phase 1 finalize): `npm i resend`, then when RESEND_API_KEY is set,
 * send via Resend using CONTACT_FROM_EMAIL → CONTACT_TO_EMAIL. Keep the key
 * server-side only.
 */
export async function POST(req: Request) {
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 422 },
    );
  }

  const { name, email, message } = parsed.data;

  if (!process.env.RESEND_API_KEY) {
    // Stub path — no key configured yet.
    console.info("[owl-post] (stub) message received:", {
      name,
      email,
      length: message.length,
    });
    return NextResponse.json({ ok: true, stubbed: true });
  }

  // TODO (Phase 1 finalize): real send.
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: process.env.CONTACT_FROM_EMAIL!,
  //     to: process.env.CONTACT_TO_EMAIL!,
  //     replyTo: email,
  //     subject: `Owl post from ${name}`,
  //     text: message,
  //   });
  console.info("[owl-post] RESEND_API_KEY present — wire the Resend send (TODO).");
  return NextResponse.json({ ok: true, stubbed: true });
}
