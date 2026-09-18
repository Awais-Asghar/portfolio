import "server-only";
import { Resend } from "resend";
import { z } from "zod";
import { profile } from "@/data/profile";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please add your name.").max(100),
  email: z.string().trim().email("Please use a valid email address.").max(200),
  message: z.string().trim().min(10, "Tell me a little more (at least 10 characters).").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type SendResult = { ok: true; id?: string } | { ok: false; reason: "unconfigured" | "failed"; detail?: string };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Shared by the contact form and the chatbot's send_message tool. */
export async function sendContactEmail(input: ContactInput, source: "form" | "chat"): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, reason: "unconfigured" };
  const to = process.env.CONTACT_TO_EMAIL || profile.email;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi", hour12: false });
  const via = source === "chat" ? "the Ask Awais chatbot" : "the contact form";

  const text = `New message via ${via}

From: ${input.name} <${input.email}>
When: ${when} (PKT)

${input.message}

Reply to this email to answer ${input.name} directly.`;

  const html = `<!doctype html><html><body style="margin:0;background:#f2eee6;padding:32px 16px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#141416">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#faf8f3;border:1px solid #e3dfd5;border-radius:8px">
    <tr><td style="padding:28px 32px 8px;border-bottom:1px solid #e3dfd5">
      <div style="font-family:Menlo,Consolas,monospace;font-size:11px;letter-spacing:2px;color:#6b6b70;text-transform:uppercase">Portfolio · ${esc(via)}</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;margin-top:8px">New message from ${esc(input.name)}</div>
    </td></tr>
    <tr><td style="padding:20px 32px">
      <table role="presentation" cellspacing="0" cellpadding="0" style="font-size:14px;color:#3a3a40">
        <tr><td style="padding:4px 16px 4px 0;color:#6b6b70">From</td><td style="padding:4px 0">${esc(input.name)} &lt;<a href="mailto:${esc(input.email)}" style="color:#b8412b">${esc(input.email)}</a>&gt;</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#6b6b70">When</td><td style="padding:4px 0">${esc(when)} PKT</td></tr>
      </table>
      <div style="margin-top:20px;padding:18px 20px;background:#ffffff;border:1px solid #e3dfd5;border-radius:6px;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(input.message)}</div>
      <p style="margin:22px 0 0;font-size:13px;color:#6b6b70">Reply to this email to answer ${esc(input.name)} directly.</p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: [to],
      replyTo: input.email,
      subject: `Portfolio message from ${input.name}${source === "chat" ? " (via chatbot)" : ""}`,
      text,
      html,
    });
    if (error) return { ok: false, reason: "failed", detail: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, reason: "failed", detail: e instanceof Error ? e.message : String(e) };
  }
}
