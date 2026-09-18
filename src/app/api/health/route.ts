import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports which integrations are configured. Booleans only, never values. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    env: process.env.VERCEL_ENV ?? "local",
    siteUrl,
    chat: Boolean(process.env.GROQ_API_KEY),
    email: Boolean(process.env.RESEND_API_KEY),
    contactTo: Boolean(process.env.CONTACT_TO_EMAIL),
    githubToken: Boolean(process.env.GITHUB_TOKEN),
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  });
}
