# claude.md — Awais Asghar portfolio

Living project document. Read this first before changing anything. Keep it current: every design decision, convention and deployment fact lives here. Last full review: 2026-10-11.

## 0. Handoff: current state

- **Live:** https://awais-asghar.vercel.app (Vercel project `awais-asghar`). Source: `github.com/Awais-Asghar/portfolio`, branch `main`. Every push to `main` deploys in about 40 seconds.
- **Verify a deploy:** `curl -sL https://awais-asghar.vercel.app/api/health` returns the deployed commit sha plus `chat` / `email` booleans. Wait until `commit` equals `git rev-parse --short HEAD`.
- **Working:** chatbot (Groq) and contact form plus chatbot email tool (Resend), both verified end to end with real sends. Google Search Console verified; sitemap submitted (44 pages, status Success); home page indexed.
- **Open items:**
  - Google still shows the old title ("Electrical engineer building AI at the edge"), site name "Vercel" and the triangle icon. All three are fixed on the site; waiting for Google to recrawl. Awais was asked to Request indexing on the home page. Expect title in days, site name and icon in 1-3 weeks.
  - Awais's Overleaf copy of the AI Engineer resume is behind the repo source on four points: Gmail address, HamsanTech dates 2023, SkinSense 2023, Portfolio link in the header. The repo `.tex` is the reference.
  - Contact mail is delivered to the NUST inbox, not Gmail (see §7). Suggested to Awais: forward NUST mail to Gmail.
  - Two open Vercel-bot PRs on the repo: #1 Speed Insights, #2 Web Analytics. Not merged; Awais has not decided.
  - TNO detection and FPGA U-Net accelerator are featured but private repos (no README render).
- **Working with Awais:** writes casually ("bro"), wants polished results, reviews by screenshot. He is positioning himself as an **AI Engineer** (applying to AI roles). Use plain hyphens, never em or en dashes, in titles, UI copy and chatbot output. Public email is `awaisasghara786@gmail.com`. He is the **sole founder** of CashFlow; he was a trainer (not a founder) at the robotics/AI bootcamp. No phone number on the site. Resumes carry only the Canadian number (+1 250 507 9045) plus a Portfolio link (2026-10-11). After each deploy, check the change in Chrome (Chrome DevTools MCP) before reporting.
- **Commits:** `git -c user.name="Awais Asghar" -c user.email="aasghar.bee22seecs@seecs.edu.pk" commit ...` with the Co-Authored-By trailer from the session's attribution reminder. `gh` was re-authenticated 2026-10-10 via the device flow (`gh auth login -h github.com -p https -w`); git pushes use it.
- **Local environment quirks (Windows):** Node.js 24 is installed but not on PATH in Git Bash: run `export PATH="/c/Program Files/nodejs:$PATH"` first. The session scratchpad gets cleared between sessions, so Tectonic (LaTeX) and Playwright must be re-downloaded there when needed (§10b). Python is `python` (3.14) with `pymupdf` installed. Use `python -I` for scripts.

## 1. Purpose and audience

Personal portfolio for **Awais Asghar** (BE Electrical Engineering, NUST 2026; AI Engineer: ML, deep learning, computer vision, LLMs, agents, edge AI / FPGA). Readers are recruiters, engineers, professors and collaborators. Goals, in order:

1. Show the range and depth of his projects (41 GitHub repos, categorised, each with a thumbnail and its README rendered in place), led by AI work.
2. Make contact effortless: a contact form and an "Ask about Awais" chatbot that answers from site content and can email him.
3. Look like a considered editorial publication, not a template.

## 2. Stack and commands

| Piece | Choice |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, `src/` layout), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (tokens in `src/app/globals.css`, no tailwind.config) |
| Motion | `motion` (Framer Motion) for reveals, hero and chat panel; all respects `prefers-reduced-motion` |
| Fonts | `next/font/google`: Fraunces (display serif), Inter (body), JetBrains Mono (metadata) |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-sanitize` |
| Chat LLM | Groq via `groq-sdk`; `MODEL_CANDIDATES` in `src/lib/groq.ts`: `GROQ_MODEL` env, then `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`. Falls through on model-not-found and on 429 / 413 / 503 |
| Email | Resend via `resend` SDK |
| Validation | `zod` v4 |
| Icons | `lucide-react` v1 (brand icons in `src/components/ui/icons.tsx`) |
| Hosting | Vercel (hobby), auto-deploys from GitHub `main` |

```bash
npm run dev          # local dev, http://localhost:3000
npm run build        # production build (also type-checks)
npm run check        # tsc --noEmit && eslint .
npm run thumbs       # regenerate public/thumbnails/*.svg from src/data/projects.ts
npm run prompt-size  # chatbot system prompt size for three sample questions
npm run format       # prettier
```

Node 20.9+ required (developed on Node 24 LTS). Next 16 ships its own docs in `node_modules/next/dist/docs/` (see `AGENTS.md`); read those, not memory, for framework APIs (async `params`, `PageProps`, metadata `verification`, etc.).

## 3. Directory map

```
claude.md / CLAUDE.md          this file (Windows: same file)
AGENTS.md                      Next.js agent rules (points at bundled docs)
scripts/generate-thumbnails.ts deterministic SVG thumbnail generator (~40 motif renderers)
Thumbnails/                    raw 1536x1024 PNG thumbnail sources from Awais (gitignored)
docs/                          README screenshots (home, projects, featured, chat, project-dark)
resume/ai-engineer/            AI Engineer resume: .tex source + built PDF
resume/hardware/               Hardware resume: .tex source + built PDF
public/
  thumbnails/<slug>.svg        generated art, one per project (41)
  thumbnails/<slug>.jpg        custom photo thumbnails (34), used when `thumbnail` is set
  resume/*.pdf                 the two resumes the site serves (copied from resume/*)
  images/avatar.jpg            real portrait, 1122x1402 (4:5), stone backdrop
src/
  app/
    layout.tsx                 fonts, metadata (seoTitle, verification), Nav/Footer/ChatWidget, ThemeScript
    page.tsx                   home + JSON-LD @graph (WebSite, ProfilePage, Person)
                               order: Hero → Marquee → Featured → About → Experience → Skills → Recognition → Contact
    projects/page.tsx          filterable grid (client) with ?c=<category>&q=
    projects/[slug]/page.tsx   detail: header, metrics, thumbnail, README (ISR 24h), related
    resume/page.tsx            resume switcher + embedded PDF (ResumeViewer)
    api/chat/route.ts          Groq streaming + send_message_to_awais tool
    api/contact/route.ts       Resend contact endpoint
    api/health/route.ts        commit sha + env booleans; ?probe=1|2|3 for Groq diagnostics
    fonts/                     WOFF fonts for the OG image
    favicon.ico, icon.svg, apple-icon.png, opengraph-image.tsx, sitemap.ts, robots.ts, not-found.tsx
  components/
    layout/  Nav, Footer, ThemeToggle, ThemeScript
    home/    Hero, Marquee, FeaturedProjects, About, Experience, Skills, Recognition, ContactSection, ResumeViewer
    projects/ ProjectCard, ProjectGrid, CategoryBadge, ReadmeRenderer
    chat/    ChatWidget (launcher + panel + streaming client + dash humanizer + auto-growing input)
    ui/      Section, Reveal, Button, Badge, icons
  data/
    profile.ts        everything about Awais that is not a project (single source of truth)
    projects.ts       all projects, typed; drives grid, detail pages, thumbnails, sitemap, chatbot
    categories.ts     8 categories with label, hue, motif
    chat-knowledge.ts builds the query-aware chatbot system prompt from profile + projects
  lib/
    groq.ts     Groq client (20s timeout, no retries), MODEL_CANDIDATES, createStream fallback, drainStream, chat tool schema
    email.ts    zod contact schema + Resend send (shared by form and chatbot tool); RESEND_ACCOUNT_EMAIL
    github.ts   README fetch (raw, cached 24h) + relative-URL rewriting to raw.githubusercontent.com/HEAD
    site.ts     canonical site URL (hardcoded production URL, see §9)
    rate-limit.ts in-memory sliding window; utils.ts cn()
```

## 4. Design system ("clean editorial light")

**Tokens** (CSS variables on `:root`, dark overrides on `:root[data-theme="dark"]`, exposed to Tailwind through `@theme inline`):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#faf8f3` | `#111113` | page background |
| `--paper-2` / `--paper-3` | `#f2eee6` / `#e9e4d9` | `#18181b` / `#202024` | cards, inputs, chips |
| `--ink` / `--ink-2` | `#141416` / `#3a3a40` | `#f2efe8` / `#cfcbc2` | text |
| `--muted` | `#6b6b70` | `#8f8c85` | secondary text |
| `--rule` / `--rule-strong` | `#e3dfd5` / `#c9c3b6` | `#27272c` / `#3a3a41` | hairlines, borders |
| `--accent` | `#b8412b` (oxide red) | `#e2694f` | one accent only: links, active states, dot marks |
| `--teal` | `#2f5f63` | `#6cb0b5` | secondary tint (hardware ticker dots) |

Tailwind classes: `bg-paper`, `text-ink`, `border-rule`, `text-accent`, `bg-teal`, etc. Utilities: `container-x` (max 76rem, responsive gutters), `eyebrow` (mono uppercase label), `link-underline`.

**Type**: Fraunces for h1–h3 and `.font-serif` (opsz 144, SOFT 30; italic accent words use SOFT 100). Inter body at 16px. JetBrains Mono for dates, tags, metrics labels. Big numerals use Fraunces.

**Layout rules**: sections are `py-20 md:py-28` with a top hairline and a numbered eyebrow. Cards: 1px `rule` border, 6px radius, thumbnail 16:10, title below the image, tech list in mono. Hover: image scales 1.025, title grows an underline. No drop shadows except `shadow-card` on the portrait and chat panel. Toolkit items are outlined pill chips. Experience dates and status badges never wrap (`whitespace-nowrap`; experience date column 200px).

**Hero**: eyebrow "Portfolio · {year} · AI Engineer, NUST"; h1 "AI engineer working on *ML, LLMs and AI agents*." (italic accent part is hardcoded in `Hero.tsx`, with a non-breaking space in "AI agents"); tagline from `profile.tagline`. Portrait card overlay shows only the name and a GitHub button (location removed at Awais's request).

**Motion**: `Reveal` fades/rises 18px on scroll (once). Hero staggers 80ms. Skills ticker (`Marquee.tsx`) has two rows: AI/ML/DL (`profile.marquee.ai`, red dots) scrolling left and hardware (`profile.marquee.hardware`, teal dots) scrolling right, 4s per item so both rows move at the same speed, faded edges, pauses on hover/focus, pause button at the LEFT end (on the right it hid under the chat launcher on laptop screens). Everything is static under reduced motion. Never use `initial={false}` with reduced motion (see decision log).

**Dark mode**: `ThemeScript` sets `data-theme` before paint from `localStorage.theme` or OS preference; `ThemeToggle` flips it. Tailwind `dark:` variant is remapped to `[data-theme="dark"]`. Generated SVG thumbnails stay paper-coloured in dark mode by design.

**Thumbnails**:
- **Custom photos (34 projects)** via the `thumbnail` field: Awais's generated 1536x1024 PNGs from `/Thumbnails/`, centre-cropped to 1536x960 (16:10), mozjpeg q84 (~170 KB), at `public/thumbnails/<slug>.jpg`. Served through next/image with `sizes` hints (cards fetch ~640w). For sharp detail-page heroes on retina, sources should be 2400x1500 or larger.
- **Generated SVG (7 projects)**: exam-generator-rag, breastnet (no image supplied) and aqi-monitoring, health-tracker, am-superheterodyne, ball-balancing-pid, cache-simulator (Awais's choice). `npm run thumbs` writes 1600x1000 SVGs for every project: paper background, hairline frame, mono category label, first metric as a serif numeral, art from a per-project motif renderer (`motifBySlug`), PRNG seeded by slug. SVGs render `unoptimized`.
- **Rendered size**: grid card max 356x223 CSS px; detail hero 1135x709 CSS px.

## 5. Content model

`src/data/projects.ts` — `Project`:

| Field | Notes |
|---|---|
| `slug` | URL + thumbnail filename. kebab-case, short. |
| `repo` | exact GitHub repo name (README fetch, source link). |
| `title`, `tagline` (one line), `summary` (2–3 sentences) | written for a reader, not copied from README |
| `category` | one of 8 `CategoryId`s; `tags` and `tech` are free text |
| `year`, `period?` | period shown when set (e.g. "2025 – 2026") |
| `live?` | deployed URL |
| `featured?` | 1..8 order on the home page (exactly 8 featured; #1 gets the large card) |
| `isPrivate?` | private repo: no README render, no source button, "Private repo" badge |
| `fork?` | `{ owner, note }` shown as a badge + note |
| `metrics?` | up to 3 `{ value, label }`; first one is drawn on the SVG thumbnail |
| `thumbnail?` | custom 16:10 image, e.g. `/thumbnails/<slug>.jpg`; when absent the generated SVG is used (`thumbnailSrc()`) |
| `motif?`, `accent?` | generated-thumbnail overrides |

**Featured (home page) now**: 1 tno-detection, 2 driving-scene-segmentation, 3 exam-generator-rag, 4 fpga-unet-accelerator, 5 fabric-defect-detection, 6 skinsense, 7 recyclevision, 8 vehicle-detection. Section title "Eight AI projects, from research to deployment." To retarget for hardware roles, move the `featured` numbers (candidates: pipelined-risc-v, single-cycle-risc-v, smart-energy-monitor, car-security-system).

**To add a project**: 1) add an entry to `projects.ts`; 2) either set `thumbnail` (crop the image as in §4) or add a `motifBySlug` entry and run `npm run thumbs`; 3) `npm run check`; 4) commit including the image; 5) push. The chatbot learns it automatically because its prompt is built from the same file.

`src/data/profile.ts` holds name, `headline`, `seoTitle`, `seoDescription`, `tagline`, email, links, resumes, `openTo`, about, education, experience, publications, honors, leadership, skills, coursework and the two-row `marquee`. Edit it for any personal change; the chatbot prompt updates with it.

**Key profile facts (confirmed by Awais)**: public email `awaisasghara786@gmail.com`; NCDC Chip Design Trainee Feb 2025 – May 2026; HamsanTech ML internship June – Aug **2023** (bottom of the timeline); SkinSense 2023; Dean's Honor List **four** times; leadership = Millennium Fellow (BreatheSafe), Director Outreach (GDSC NUST), **Founder, CashFlow**.

**Categories** (`categories.ts`): AI & Machine Learning · Computer Vision · LLMs, RAG & Agents · FPGA & Digital Design · Embedded & IoT · Robotics · Startups (id `web`, short "Startup"; CashFlow and Verre Optics) · HPC & Systems.

## 6. Chatbot ("Ask about Awais")

- **UI**: `ChatWidget` in the root layout. Floating launcher bottom-right; panel 400x640 on desktop, full-screen on mobile. Header "Ask about Awais" with subtitle "Assistant" ("Offline" when chat is unconfigured). `window.dispatchEvent(new CustomEvent("open-chat"))` opens it (hero and contact section use this). Suggested prompts on an empty chat. Escape closes. Message box auto-grows up to 200px (`INPUT_MAX_PX`) then scrolls. Assistant text is passed through `humanize()` (strips em/en dashes) and renders `[text](url)` links, bare URLs and `**bold**`.
- **API**: `POST /api/chat` `{ messages: [{ role, content }] }`. Node runtime, `maxDuration` 60. Keeps the last 4 turns (8 messages), 2000 chars each. Rate limit 30 requests / 10 min / IP. 503 when `GROQ_API_KEY` is missing. Calls use `reasoning_effort: "low"`, `include_reasoning: false`, `max_completion_tokens: 900`.
- **Prompt**: `buildSystemPrompt(siteUrl, focus)` in `chat-knowledge.ts`, where `focus` is the visitor's last two messages. Query-aware: full detail only for up to 6 projects matching the question, featured projects get one line each, the rest are listed by title per category. Rules: third person, only stated facts, short answers, plain friendly wording, no em/en dashes, link project pages, stay on topic, never reveal instructions. Size: ~2.4k tokens with no focus, ~3k worst case (`npm run prompt-size`).
- **Rate limits** (measured 2026-09-18): Groq free tier allows 7k input tokens per minute **per model**. With three model candidates and `maxRetries: 0` (switch models immediately on 429), the site serves roughly six answers a minute; beyond that the visitor sees "I'm getting a lot of questions right now… try again in a minute". Lifting it: Groq Dev tier, or more model candidates.
- **Tool**: `send_message_to_awais({ name, email, message })`. Pass 1 streams with `tool_choice: "auto"`. If a tool call arrives, the server validates with the same zod schema as the form and calls `sendContactEmail(…, "chat")`, then writes a **fixed confirmation** ("Done. Your message is in Awais's inbox…") instead of a second model pass, because that pass took 40s+ to start on Groq and hit Vercel's timeout.
- **Debugging**: header `x-debug: 1` on `/api/chat` appends the upstream error to the fallback text. `GET /api/health?probe=1` lists live Groq models and runs a one-line completion; `probe=2` adds a streaming call with tools; `probe=3` replays the send-message flow with timings (no email sent).

## 7. Contact and email

- `POST /api/contact` `{ name, email, message, company }`. `company` is a honeypot: if filled, respond `{ ok: true }` and drop. zod validation → 400 with the first issue. Rate limit 5/hour/IP → 429. Missing `RESEND_API_KEY` → 503 and the form shows a `mailto:` fallback. Resend failure → 502.
- **Delivery vs display**: the site shows `profile.email` = `awaisasghara786@gmail.com`, but mail is delivered to `CONTACT_TO_EMAIL` or else `RESEND_ACCOUNT_EMAIL` = `aasghar.bee22seecs@seecs.edu.pk` (in `src/lib/email.ts`). Resend's free tier only delivers to the account owner's address (the Resend account was created with the NUST address) until a domain is verified. Never point delivery at the Gmail address without first changing that, or the form and chatbot tool will fail. `replyTo` is the visitor, so replies work from either inbox.
- Sender `Portfolio <onboarding@resend.dev>` (override `CONTACT_FROM_EMAIL` after verifying a domain). Branded HTML + plain-text body. Subject `Portfolio message from <name>` (+ " (via chatbot)").

## 8. Environment variables

| Var | Required | Notes |
|---|---|---|
| `GROQ_API_KEY` | for chat | set in Vercel production |
| `RESEND_API_KEY` | for email | set in Vercel production |
| `CONTACT_TO_EMAIL` | optional | delivery inbox; unset in production → `RESEND_ACCOUNT_EMAIL` (NUST) |
| `CONTACT_FROM_EMAIL` | optional | after verifying a domain in Resend |
| `GITHUB_TOKEN` | optional | raises the README fetch limit (unauthenticated is enough for ISR) |
| `GROQ_MODEL` | optional | prepended to `MODEL_CANDIDATES` in `src/lib/groq.ts` |
| `NEXT_PUBLIC_SITE_URL` | optional | overrides the canonical URL; otherwise `site.ts` uses the hardcoded production URL in production, the preview URL on previews, localhost locally |

Local: copy `.env.example` → `.env.local` (none exists on this machine). Production: Vercel → Project → Settings → Environment Variables → add → **Redeploy** (env changes only apply to new deployments). Confirm with `/api/health`.

## 9. Deployment and search

- GitHub `Awais-Asghar/portfolio`, branch `main` = production; other branches get preview deployments. Vercel team `awais-asghar-s-projects` (`team_Ese4jZpHuBuArx5kzf9qsmOy`), project `awais-asghar`.
- The **Vercel MCP connector cannot see this project** (its `list_projects` shows only verre-optics and techstore-chatbot), and `create_git_project` reported projects that never existed. Use `/api/health` and `gh api repos/Awais-Asghar/portfolio/deployments` to check deploys. If a push does not deploy (happened once on 2026-10-11), the next push re-triggers it.
- **Domain history**: Awais linked the repo in the dashboard; two projects briefly coexisted; the spare was deleted, the survivor renamed `awais-asghar`, and the `awais-asghar.vercel.app` alias attached by hand. `VERCEL_PROJECT_PRODUCTION_URL` lagged behind, so `src/lib/site.ts` hardcodes `PRODUCTION_URL = "https://awais-asghar.vercel.app"`. If a custom domain is bought, change that constant (or set `NEXT_PUBLIC_SITE_URL`), and update the README and both resume `.tex` files.
- Build: `next build` (Turbopack). Project pages are prerendered for all slugs (`generateStaticParams`, `dynamicParams=false`); READMEs revalidate every 24h.
- **Google Search Console** (2026-10-10): URL-prefix property for `https://awais-asghar.vercel.app`, verified by `verification.google` in `src/app/layout.tsx` (keep it, or ownership is lost). Sitemap `sitemap.xml` submitted 2026-10-10: Success, 44 pages. Home page indexed.
- **What Google reads**: `<title>` = `profile.seoTitle` ("Awais Asghar - AI Engineer | AI | ML | DL | LLMs | AI Agents"), description `profile.seoDescription`, other pages `%s - Awais Asghar`; site name from WebSite JSON-LD `name` "Awais Asghar"; favicon `src/app/favicon.ico` (16/32/48, built from `icon.svg`).

## 10. Decision log

- **2026-09-18** Visual direction: *clean editorial light* (Awais's choice over dark circuit / neon). Dark mode kept as a toggle.
- **2026-09-18** Chat LLM: Groq free tier (Awais's choice over Anthropic / Gemini). Llama 3.3 70B was planned, but Groq had retired it; default is `openai/gpt-oss-120b` with fallbacks.
- **2026-09-18** Email: Resend (Awais's choice over Web3Forms / Gmail SMTP).
- **2026-09-18** Thumbnails: generative SVG per project (Awais's choice). Superseded on 2026-09-24 for 34 projects by his own photo images (§4).
- **2026-09-18** Four repos are private (`FPGA-U-Net-Accelerator`, `FYP-AI-Accelerator`, `tno_detection`, `cashflow`): "Private repo" badge, no README, no source link; summaries only restate the public CV. Making them public enables README rendering with no code change.
- **2026-09-18** No phone number on the site (privacy).
- **2026-09-18** Next.js 16 (latest at scaffold time); conventions checked against the bundled docs.
- **2026-09-18** Motion: never use `initial={false}` under reduced motion. The server renders the hidden initial style and the client skips the animation, leaving sections invisible. Always animate; set `transition.duration = 0` when `useReducedMotion()` is true.
- **2026-09-18** OG image fonts are bundled as WOFF in `src/app/fonts/` and read with `fs` (traced via `outputFileTracingIncludes`); fetching Google Fonts at build time was unreliable.
- **2026-09-18** README images render through plain `<img>` (not `next/image`) because GitHub asset URLs are unbounded; the sanitiser allows `img`, `picture`, `details`, `video`, `align`/`width`.
- **2026-09-18** Groq removed `llama-3.3-70b`; the chat moved to gpt-oss models with a fallback chain, a compact query-aware prompt (free-tier token limits) and a fixed tool confirmation (second pass too slow).
- **2026-09-24** Tab and preview titles use a plain hyphen (" - "), not an em dash (Awais's request).
- **2026-09-24** 34 custom photo thumbnails added via the new `thumbnail` field; raw PNGs gitignored in `/Thumbnails/`.
- **2026-10-10** Google Search Console verification tag added; sitemap submitted.
- **2026-10-11** Real portrait replaces the GitHub avatar: 1122x1402 (4:5), warm stone gradient backdrop (`#D2CABB` → `#9A9083`) chosen to sit well in both themes.
- **2026-10-11** Google listed the site as "Vercel" with Vercel's triangle. Cause: the create-next-app `favicon.ico` (Vercel logo) was never replaced and is listed first in `<head>`, and there was no WebSite structured data. Fix: new `favicon.ico` from `icon.svg`, `apple-icon.png` (180, full bleed), and JSON-LD `@graph` of WebSite + ProfilePage + Person. Never reintroduce the starter favicon.
- **2026-10-11** Repositioned as **AI Engineer**: `seoTitle` matches his LinkedIn headline; hero headline, eyebrow and tagline rewritten (§4).
- **2026-10-11** Public email changed to Gmail; delivery stays on the Resend account address (§7). HamsanTech internship moved to 2023 and to the bottom of the timeline. Leadership: "Co-founder, Robotics & AI training startup" removed (he was a trainer), "Founder, CashFlow" added (sole founder). SkinSense dated 2023. Dean's Honor List four times everywhere. "Web & Product" category renamed Startups. UI fixes: outlined toolkit chips, non-wrapping dates and badges, chat subtitle "Assistant", auto-growing chat input.
- **2026-10-11** Hero ticker split into two rows, **opposite directions**. Reddit was unreachable (blocks automated access); evidence used: design-component defaults (Framer's marquee defaults to opposite rows; shadcnblocks ships "double-row alternating marquees") and their caveat that alternating rows need spacing to stay legible, plus WCAG 2.2.2 (moving content over 5s must be pausable; hover-pause alone is not enough). Hence slow speed, 16px row gap, edge fade, pause button, static under reduced motion. Next.js dropped from the ticker.
- **2026-10-11** Featured set refocused on AI for job applications (§5). Pipelined RISC-V, smart energy monitor, CashFlow and the AI agents workshop are off the home page but remain in the grid.
- **2026-10-11** Portrait overlay: location line removed; ticker pause button moved left so the chat launcher cannot cover it.

## 10b. Resumes

- The site serves `public/resume/Awais_Asghar_AI_Engineer.pdf` (primary) and `public/resume/Awais_Asghar_Hardware.pdf`. Both are built from LaTeX source in this repo, in Jake's Resume template: `resume/ai-engineer/Awais_Asghar_AI_Engineer.tex` and `resume/hardware/Awais_Asghar_Hardware.tex`.
- **AI Engineer**: recreated 2026-10-11 from Awais's Overleaf PDF and text-diffed against it: identical except the Gmail address and the 2023 dates; Portfolio link added to the header afterwards. Margins match his Overleaf layout (0.4in sides, `\topmargin -.7in`, `\textheight +1.4in`). Header: Canadian phone, Gmail, LinkedIn, GitHub, Portfolio.
- **Hardware**: written 2026-09-18 for FPGA / RTL / embedded roles. Header: Canadian phone only (Pakistani number removed 2026-10-11), Gmail, LinkedIn, GitHub, Portfolio. Experience: NCDC, ESDAC, Mitacs, SINES (no HamsanTech). `glyphtounicode` lines removed so it builds with Tectonic.
- **Build**: Tectonic is not installed system-wide. Download the latest `x86_64-pc-windows-msvc.zip` from `tectonic-typesetting/tectonic` releases into the scratchpad, then `tectonic -o resume/<dir> resume/<dir>/<file>.tex` and copy the PDF to `public/resume/`. Check for "Overfull" warnings; verify text with `pymupdf`.
- `profile.resumes` lists both; `/resume` previews whichever is selected (`ResumeViewer`).

## 11. Backlog / ideas

- Merge or close the Vercel-bot PRs (#1 Speed Insights, #2 Web Analytics) once Awais decides.
- Buy a custom domain (e.g. `awaisasghar.com`): better on resumes, lets Resend deliver to Gmail and send from his own address. Then update `PRODUCTION_URL`, Search Console (Domain property), README and resumes.
- Groq Dev tier if chat traffic exceeds ~6 answers/minute.
- Make the private featured repos (TNO detection, FPGA U-Net accelerator) public, or add public write-ups, so READMEs render.
- Detail-page heroes are slightly soft on retina (1536px sources); higher-resolution thumbnails would fix it.
- Per-project OG images; blog / notes (MDX) for the two papers in progress; short intro video on the hero.
