import "server-only";
import Groq from "groq-sdk";
import type { ChatCompletionCreateParamsStreaming } from "groq-sdk/resources/chat/completions";

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

/** Per-call upstream timeout. Vercel functions cap at 60s, so fail fast and fall back. */
export const GROQ_TIMEOUT_MS = 20_000;

export const chatTools: Groq.Chat.Completions.ChatCompletionTool[] = [
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

export type Msg = Groq.Chat.Completions.ChatCompletionMessageParam;
export type StreamParams = Omit<ChatCompletionCreateParamsStreaming, "model">;

export function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: GROQ_TIMEOUT_MS, maxRetries: 0 });
}

export function isModelNotFound(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return /model_not_found|does not exist|decommissioned/i.test(msg) || (e as { status?: number })?.status === 404;
}

/** Rate limits are per model on Groq, so a 429 / 413 on one model is worth retrying on the next. */
export function isFallbackWorthy(e: unknown) {
  const status = (e as { status?: number })?.status;
  return isModelNotFound(e) || status === 429 || status === 413 || status === 503;
}

/** Streams a completion, falling back through MODEL_CANDIDATES on model errors and rate limits. */
export async function createStream(groq: Groq, params: StreamParams, startAt: string) {
  const order = MODEL_CANDIDATES.slice(Math.max(0, MODEL_CANDIDATES.indexOf(startAt)));
  let lastErr: unknown;
  for (const model of order) {
    try {
      const stream = await groq.chat.completions.create({ ...params, model });
      return { stream, model };
    } catch (e) {
      lastErr = e;
      if (!isFallbackWorthy(e)) throw e;
    }
  }
  throw lastErr ?? new Error("No Groq model available");
}

export interface ToolCallAcc {
  id: string;
  name: string;
  args: string;
}

/**
 * Drains a streaming completion: forwards content tokens to `onText` and
 * accumulates tool calls. Returns the collected tool calls and finish reason.
 */
export async function drainStream(
  stream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk>,
  onText: (t: string) => void,
) {
  const toolCalls = new Map<number, ToolCallAcc>();
  let finish: string | null = null;
  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    const delta = choice?.delta;
    if (delta?.content) onText(delta.content);
    for (const tc of delta?.tool_calls ?? []) {
      const cur = toolCalls.get(tc.index) ?? { id: "", name: "", args: "" };
      if (tc.id) cur.id = tc.id;
      if (tc.function?.name) cur.name = tc.function.name;
      if (tc.function?.arguments) cur.args += tc.function.arguments;
      toolCalls.set(tc.index, cur);
    }
    if (choice?.finish_reason) finish = choice.finish_reason;
  }
  return { toolCalls: [...toolCalls.values()], finish };
}
