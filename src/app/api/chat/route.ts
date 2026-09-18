import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSystemPrompt } from "@/data/chat-knowledge";
import { contactSchema, sendContactEmail } from "@/lib/email";
import { chatTools, createStream, drainStream, getGroq, MODEL_CANDIDATES, type Msg } from "@/lib/groq";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const groq = getGroq();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        // Pass 1: stream the answer; watch for a tool call.
        const { stream: first, model } = await createStream(
          groq,
          {
            messages,
            tools: chatTools,
            tool_choice: "auto",
            temperature: 0.4,
            max_completion_tokens: 900,
            reasoning_effort: "low",
            include_reasoning: false,
            stream: true,
          },
          MODEL_CANDIDATES[0],
        );
        const { toolCalls } = await drainStream(first, write);
        if (toolCalls.length === 0) return controller.close();

        // Execute tool(s), then pass 2: stream the confirmation.
        const assistantMsg: Msg = {
          role: "assistant",
          content: "",
          tool_calls: toolCalls.map((t) => ({
            id: t.id,
            type: "function" as const,
            function: { name: t.name, arguments: t.args },
          })),
        };
        const toolResults: Msg[] = [];
        for (const t of toolCalls) {
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
          {
            messages: [...messages, assistantMsg, ...toolResults],
            temperature: 0.3,
            max_completion_tokens: 400,
            reasoning_effort: "low",
            include_reasoning: false,
            stream: true,
          },
          model,
        );
        await drainStream(second, write);
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
