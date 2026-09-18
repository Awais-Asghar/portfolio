import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/data/chat-knowledge";
import { chatTools, createStream, drainStream, getGroq, MODEL_CANDIDATES, type Msg } from "@/lib/groq";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = MODEL_CANDIDATES[0];

/**
 * Reports which integrations are configured. Booleans only, never values.
 *   ?probe=1  lists Groq models and runs a one-line completion
 *   ?probe=2  also runs a streaming call with tools
 *   ?probe=3  replays the chatbot's send-message flow (no email is sent) with timings
 */
export async function GET(req: Request) {
  const base = {
    ok: true,
    env: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    siteUrl,
    chat: Boolean(process.env.GROQ_API_KEY),
    email: Boolean(process.env.RESEND_API_KEY),
    contactTo: Boolean(process.env.CONTACT_TO_EMAIL),
    githubToken: Boolean(process.env.GITHUB_TOKEN),
    model: MODEL,
  };

  const probe = new URL(req.url).searchParams.get("probe");
  if (!probe || !process.env.GROQ_API_KEY) return NextResponse.json(base);

  const groq = getGroq();
  const result: Record<string, unknown> = {};
  const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

  try {
    const models = await groq.models.list();
    const ids = models.data.map((m) => m.id).sort();
    result.models = ids;
    result.modelAvailable = ids.includes(MODEL);
  } catch (e) {
    result.modelsError = errText(e);
  }
  try {
    const r = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: "Say OK." }],
      max_completion_tokens: 40,
      reasoning_effort: "low",
      include_reasoning: false,
    });
    result.completion = r.choices[0]?.message?.content ?? null;
  } catch (e) {
    result.completionError = errText(e);
  }

  if (probe === "2") {
    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Reply with the single word OK." },
        ],
        tools: [{ type: "function", function: { name: "noop", description: "Does nothing.", parameters: { type: "object", properties: {} } } }],
        tool_choice: "auto",
        max_completion_tokens: 60,
        reasoning_effort: "low",
        include_reasoning: false,
        stream: true,
      });
      let acc = "";
      for await (const chunk of stream) acc += chunk.choices[0]?.delta?.content ?? "";
      result.streamWithTools = acc;
    } catch (e) {
      result.streamError = errText(e);
    }
  }

  if (probe === "3") {
    const t0 = Date.now();
    const stages: Record<string, unknown> = {};
    try {
      const messages: Msg[] = [
        { role: "system", content: buildSystemPrompt(siteUrl) },
        { role: "user", content: "I want to send Awais a message." },
        { role: "assistant", content: "Sure. What is your name, your email address, and the message you would like to send?" },
        {
          role: "user",
          content:
            "Name: Probe Test. Email: probe@example.com. Message: This is a probe, do not reply. Please send it now, I confirm.",
        },
      ];
      const { stream: first, model } = await createStream(
        groq,
        { messages, tools: chatTools, tool_choice: "auto", temperature: 0.4, max_completion_tokens: 900, reasoning_effort: "low", include_reasoning: false, stream: true },
        MODEL,
      );
      stages.pass1Created = Date.now() - t0;
      let text = "";
      const { toolCalls, finish } = await drainStream(first, (t) => (text += t));
      stages.pass1Done = Date.now() - t0;
      stages.pass1 = { model, text: text.slice(0, 200), finish, toolCalls };
      if (toolCalls.length) {
        const assistantMsg: Msg = {
          role: "assistant",
          content: "",
          tool_calls: toolCalls.map((t) => ({ id: t.id, type: "function" as const, function: { name: t.name, arguments: t.args } })),
        };
        const toolResults: Msg[] = toolCalls.map((t) => ({ role: "tool", tool_call_id: t.id, content: JSON.stringify({ ok: true }) }));
        const { stream: second } = await createStream(
          groq,
          { messages: [...messages, assistantMsg, ...toolResults], temperature: 0.3, max_completion_tokens: 400, reasoning_effort: "low", include_reasoning: false, stream: true },
          model,
        );
        stages.pass2Created = Date.now() - t0;
        let text2 = "";
        const r2 = await drainStream(second, (t) => (text2 += t));
        stages.pass2Done = Date.now() - t0;
        stages.pass2 = { text: text2.slice(0, 300), finish: r2.finish };
      }
    } catch (e) {
      stages.error = errText(e);
      stages.failedAt = Date.now() - t0;
    }
    result.toolFlow = stages;
  }
  return NextResponse.json({ ...base, probe: result });
}
