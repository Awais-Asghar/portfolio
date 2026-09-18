"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, MessageCircle, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";
interface Msg {
  id: string;
  role: Role;
  content: string;
}

const suggestions = [
  "What was Awais's final year project?",
  "Which FPGA boards has he worked with?",
  "What LLM or RAG work has he done?",
  "Is he open to roles in Canada?",
  "I'd like to send Awais a message",
];

const greeting: Msg = {
  id: "greet",
  role: "assistant",
  content: `Hi, I'm ${profile.firstName}'s assistant. Ask me about his projects, research, skills or background. I can also pass a message straight to his inbox.`,
};

/** The model likes typographic dashes; plain punctuation reads more naturally. Applied to the accumulated text so streaming chunk boundaries do not matter. */
function humanize(s: string) {
  return s
    .replace(/‑/g, "-")
    .replace(/(\d)\s*–\s*(\d)/g, "$1-$2")
    .replace(/\s*[–—―]\s*/g, ", ")
    .replace(/,\s*,/g, ",");
}

let idCounter = 0;
const nextId = () => `m${Date.now()}_${idCounter++}`;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-chat", onOpen);
    return () => window.removeEventListener("open-chat", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, open, reduce]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const userMsg: Msg = { id: nextId(), role: "user", content };
      const history = [...messages.filter((m) => m.id !== "greet"), userMsg];
      const assistantId = nextId();
      setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
          signal: ctrl.signal,
        });
        if (res.status === 503) {
          setUnavailable(true);
          setMessages((m) =>
            m.map((x) =>
              x.id === assistantId
                ? { ...x, content: `The chat is not switched on yet. You can email Awais at ${profile.email}.` }
                : x,
            ),
          );
          return;
        }
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setMessages((m) =>
            m.map((x) => (x.id === assistantId ? { ...x, content: data.error ?? "Something went wrong. Try again." } : x)),
          );
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const snapshot = acc;
          setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: snapshot } : x)));
        }
        if (!acc.trim()) {
          setMessages((m) =>
            m.map((x) => (x.id === assistantId ? { ...x, content: "I did not get a reply. Please try again." } : x)),
          );
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setMessages((m) =>
            m.map((x) => (x.id === assistantId ? { ...x, content: "Network error. Please try again." } : x)),
          );
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([greeting]);
    setInput("");
    setBusy(false);
  }

  const showSuggestions = messages.length === 1;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={reduce ? { duration: 0 } : { duration: 0.25 }}
            aria-label="Open chat assistant"
            className="fixed bottom-5 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-sm font-medium text-paper shadow-card transition hover:bg-accent hover:text-accent-ink md:bottom-7 md:right-7"
          >
            <MessageCircle size={17} />
            Ask about Awais
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label="Chat with Awais's assistant"
            initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col bg-paper md:inset-auto md:bottom-7 md:right-7 md:h-[min(640px,calc(100vh-56px))] md:w-[400px] md:rounded-xl md:border md:border-rule md:shadow-card"
          >
            <header className="flex items-center justify-between border-b border-rule px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink font-serif text-paper">
                  A
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent" />
                </span>
                <div>
                  <p className="text-sm font-medium leading-none">Ask about Awais</p>
                  <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                    {unavailable ? "Offline" : "Assistant · answers from his portfolio"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={reset}
                  aria-label="Start over"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper-2 hover:text-ink"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper-2 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} streaming={busy && m.role === "assistant" && m === messages[messages.length - 1]} />
              ))}
              {showSuggestions && (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full border border-rule px-3 py-1.5 text-left text-xs text-ink-2 transition hover:border-ink hover:text-ink"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t border-rule p-3">
              <div className="flex items-end gap-2 rounded-lg border border-rule bg-paper-2 p-1.5 focus-within:border-ink">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="Ask anything about Awais…"
                  aria-label="Message"
                  className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-paper transition hover:bg-accent hover:text-accent-ink disabled:opacity-40"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
              <p className="mt-2 text-center font-mono text-[0.6rem] text-muted">
                Answers come from this site&apos;s content. It may still make mistakes.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ msg, streaming }: { msg: Msg; streaming: boolean }) {
  const mine = msg.role === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed",
          mine ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md border border-rule bg-paper-2 text-ink",
        )}
      >
        {msg.content ? <Linkified text={mine ? msg.content : humanize(msg.content)} /> : null}
        {streaming && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-blink bg-current" />}
      </div>
    </div>
  );
}

/** Renders [text](url) links, bare URLs and **bold**; enough markdown for short answers. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\((?:https?:\/\/)?[^\s)]+\)|https?:\/\/[^\s)]+|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const md = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/)?[^\s)]+)\)$/);
        if (md) {
          const href = md[2].startsWith("http") ? md[2] : `https://${md[2]}`;
          const internal = typeof window !== "undefined" && href.startsWith(window.location.origin);
          return (
            <a
              key={i}
              href={href}
              target={internal ? undefined : "_blank"}
              rel={internal ? undefined : "noreferrer"}
              className="underline decoration-1 underline-offset-2 hover:text-accent"
            >
              {md[1]}
            </a>
          );
        }
        if (/^https?:\/\//.test(part)) {
          const clean = part.replace(/[.,;:!?]+$/, "");
          const trail = part.slice(clean.length);
          const internal = typeof window !== "undefined" && clean.startsWith(window.location.origin);
          return (
            <span key={i}>
              <a
                href={clean}
                target={internal ? undefined : "_blank"}
                rel={internal ? undefined : "noreferrer"}
                className="underline decoration-1 underline-offset-2 hover:text-accent"
              >
                {clean.replace(/^https?:\/\//, "")}
              </a>
              {trail}
            </span>
          );
        }
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
