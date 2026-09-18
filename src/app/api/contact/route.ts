import { NextResponse } from "next/server";
import { contactSchema, emailConfigured, sendContactEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!emailConfigured()) {
    return NextResponse.json({ error: "Email delivery is not configured." }, { status: 503 });
  }

  const ip = clientIp(req);
  const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many messages from this network. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill every field. Pretend success so they move on.
  if (typeof body === "object" && body && "company" in body && String((body as { company?: string }).company ?? "")) {
    return NextResponse.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Please check the form.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const result = await sendContactEmail(parsed.data, "form");
  if (!result.ok) {
    console.error("contact email failed", result);
    return NextResponse.json(
      { error: result.reason === "unconfigured" ? "Email delivery is not configured." : "Could not send right now." },
      { status: result.reason === "unconfigured" ? 503 : 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
