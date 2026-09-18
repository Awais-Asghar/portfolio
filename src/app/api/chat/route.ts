import Groq from "groq-sdk";
import type { ChatCompletionCreateParamsStreaming } from "groq-sdk/resources/chat/completions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSystemPrompt } from "@/data/chat-knowledge";
import { contactSchema, sendContactEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Model candidates, tried in order. Groq retires models without notice
 * (llama-3.3-70b-versatile disappeared in 2026), so a "model not found"
 * error falls through to the next candidate instead of breaking the chat.
 */
export const MODEL_CANDIDATES = [
  ...new Set(
    [process.env.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter(
      (m): m is string => Boolean(m),
    ),
  ),
];
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_CHARS * 4),
      }),
    )
    .min(1)
    .max(40),
});

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "send_message_to_awais",
      description:
        "Deliver a message from the website visitor to Awais's email inbox. Only call after collecting the visitor's name, email and message, and after they confirm.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Visitor's name" },
          email: { type: "string", description: "Visitor's email address for replies" },
          message: { type: "string", description: "The full message to deliver" },
        },
        required: ["name", "email", "message"],
      },
    },
  },
];

type Msg = Groq.Chat.Completions.ChatCompletionMessageParam;
type StreamParams = Omit<ChatCompletionCreateParamsStreaming, "model">;

function isModelNotFound(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return /model_not_found|does not exist|decommissioned/i.test(msg) || (e as { status?: number })?.status === 404;
}

/** Streams a completion, falling back through MODEL_CANDIDATES on model errors. */
async function createStream(groq: Groq, params: StreamParams, startAt: string) {
  const order = MODEL_CANDIDATES.slice(Math.max(0, MODEL_CANDIDATES.indexOf(startAt)));
  let lastErr: unknown;
  for (const model of order) {
    try {
      const stream = await groq.chat.completions.create({ ...params, model });
      return { stream, model };
    } catch (e) {
      lastErr = e;
      if (!isModelNotFound(e)) throw e;
    }
  }
  throw lastErr ?? new Error("No Groq model available");
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Chat is not configured." }, { status: 503 });
  }

  const ip = clientIp(req);
  const limit = rateLimit(`chat:${ip}`, 30, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const history: Msg[] = parsed.data.messages
    .slice(-MAX_TURNS * 2)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  const messages: Msg[] = [{ role: "system", content: buildSystemPrompt(siteUrl) }, ...history];
  // With the x-debug header the failure text includes the upstream error (never the key).
  const debug = req.headers.get("x-debug") === "1";
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        // Pass 1: stream the answer; watch for a tool call.
        const { stream: first, model } = await createStream(
          groq,
          { messages, tools, tool_choice: "auto", temperature: 0.4, max_completion_tokens: 900, reasoning_effort: "low", include_reasoning: false, stream: true },
          MODEL_CANDIDATES[0],
        );

        const toolCalls = new Map<number, { id: string; name: string; args: string }>();
        for await (const chunk of first) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) write(delta.content);
          for (const tc of delta?.tool_calls ?? []) {
            const cur = toolCalls.get(tc.index) ?? { id: "", name: "", args: "" };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.args += tc.function.arguments;
            toolCalls.set(tc.index, cur);
          }
        }

        if (toolCalls.size === 0) return controller.close();

        // Execute tool(s), then pass 2: stream the confirmation.
        const assistantMsg: Msg = {
          role: "assistant",
          content: "",
          tool_calls: [...toolCalls.values()].map((t) => ({
            id: t.id,
            type: "function" as const,
            function: { name: t.name, arguments: t.args },
          })),
        };
        const toolResults: Msg[] = [];
        for (const t of toolCalls.values()) {
          let result: string;
          if (t.name === "send_message_to_awais") {
            let input: unknown = {};
            try {
              input = JSON.parse(t.args || "{}");
            } catch {}
            const valid = contactSchema.safeParse(input);
            if (!valid.success) {
              result = JSON.stringify({ ok: false, error: valid.error.issues[0]?.message ?? "Invalid input" });
            } else {
              const sent = await sendContactEmail(valid.data, "chat");
              result = JSON.stringify(
                sent.ok
                  ? { ok: true }
                  : {
                      ok: false,
                      error:
                        sent.reason === "unconfigured"
                          ? "Email delivery is not configured on this site yet."
                          : "Delivery failed.",
                    },
              );
            }
          } else {
            result = JSON.stringify({ ok: false, error: "Unknown tool" });
          }
          toolResults.push({ role: "tool", tool_call_id: t.id, content: result });
        }

        const { stream: second } = await createStream(
          groq,
          { messages: [...messages, assistantMsg, ...toolResults], temperature: 0.3, max_completion_tokens: 400, reasoning_effort: "low", include_reasoning: false, stream: true },
          model,
        );
        for await (const chunk of second) {
          const c = chunk.choices[0]?.delta?.content;
          if (c) write(c);
        }
        controller.close();
      } catch (err) {
        console.error("chat error", err);
        write("\n\nSorry, something went wrong on my side. You can email Awais directly instead.");
        if (debug) write(`\n[debug] ${err instanceof Error ? err.message : String(err)}`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
