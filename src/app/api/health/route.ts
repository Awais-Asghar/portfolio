import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/** Reports which integrations are configured. Booleans only, never values. */
export async function GET(req: Request) {
  const base = {
    ok: true,
    env: process.env.VERCEL_ENV ?? "local",
    siteUrl,
    chat: Boolean(process.env.GROQ_API_KEY),
    email: Boolean(process.env.RESEND_API_KEY),
    contactTo: Boolean(process.env.CONTACT_TO_EMAIL),
    githubToken: Boolean(process.env.GITHUB_TOKEN),
    model: MODEL,
  };

  // ?probe=1 checks that the Groq key and model actually work.
  const probe = new URL(req.url).searchParams.get("probe");
  if (!probe || !process.env.GROQ_API_KEY) return NextResponse.json(base);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const result: Record<string, unknown> = {};
  try {
    const models = await groq.models.list();
    const ids = models.data.map((m) => m.id).sort();
    result.models = ids;
    result.modelAvailable = ids.includes(MODEL);
  } catch (e) {
    result.modelsError = e instanceof Error ? e.message : String(e);
  }
  try {
    const r = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "Say OK." }],
      max_tokens: 5,
    });
    result.completion = r.choices[0]?.message?.content ?? null;
  } catch (e) {
    result.completionError = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({ ...base, probe: result });
}
