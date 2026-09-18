"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Loader2, MessageCircle } from "lucide-react";
import { profile } from "@/data/profile";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "sending" | "sent" | "error" | "unavailable";

export function ContactSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 503) return setStatus("unavailable");
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please email me directly.");
        return setStatus("error");
      }
      setStatus("sent");
      setForm({ name: "", email: "", message: "", company: "" });
    } catch {
      setError("Network error. Please email me directly.");
      setStatus("error");
    }
  }

  const mailto = `${profile.links.email}?subject=${encodeURIComponent("Hello from your portfolio")}&body=${encodeURIComponent(form.message)}`;

  return (
    <Section id="contact" index="06" eyebrow="Contact" title="Let's build something.">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="max-w-md text-lg leading-relaxed text-ink-2">
            Roles, research collaborations, or a question about one of the projects. Messages land straight in my inbox.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li>
              <span className="eyebrow block">Email</span>
              <a href={profile.links.email} className="link-underline break-all">
                {profile.email}
              </a>
            </li>
            <li>
              <span className="eyebrow block">LinkedIn</span>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="link-underline">
                in/awais--asghar
              </a>
            </li>
            <li>
              <span className="eyebrow block">GitHub</span>
              <a href={profile.links.github} target="_blank" rel="noreferrer" className="link-underline">
                Awais-Asghar
              </a>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
            className="mt-8 inline-flex items-center gap-2 text-sm text-ink-2 transition hover:text-ink"
          >
            <MessageCircle size={15} /> Prefer to chat? Ask the assistant, it can message me too.
          </button>
        </div>

        <form onSubmit={onSubmit} className="rounded-md border border-rule bg-paper-2 p-6 md:p-8" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" id="name">
              <input
                id="name"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Email" id="email">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Message" id="message" className="mt-5">
            <textarea
              id="message"
              required
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={inputCls + " resize-y"}
            />
          </Field>
          {/* Honeypot: real users never see or fill this. */}
          <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
            <label>
              Company
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button type="submit" disabled={status === "sending" || status === "sent"}>
              {status === "sending" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Sending
                </>
              ) : status === "sent" ? (
                <>
                  <Check size={15} /> Sent
                </>
              ) : (
                "Send message"
              )}
            </Button>
            {status === "sent" && <p className="text-sm text-muted">Thanks. I usually reply within a day.</p>}
            {status === "error" && <p className="text-sm text-accent">{error}</p>}
            {status === "unavailable" && (
              <p className="text-sm text-muted">
                The form is not configured yet.{" "}
                <a href={mailto} className="link-underline inline-flex items-center gap-1 text-ink">
                  Email me instead <ArrowUpRight size={12} />
                </a>
              </p>
            )}
          </div>
        </form>
      </div>
    </Section>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-md border border-rule bg-paper px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink";

function Field({
  label,
  id,
  children,
  className = "",
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow">
        {label}
      </label>
      {children}
    </div>
  );
}
