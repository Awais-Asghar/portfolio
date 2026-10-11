# claude.md — Awais Asghar portfolio

Living project document. Read this first before changing anything. Keep it current: every design decision, convention and deployment fact lives here.

## 1. Purpose and audience

Personal portfolio for **Awais Asghar** (BE Electrical Engineering, NUST 2026; AI / edge-AI / FPGA engineer). Readers are recruiters, engineers, professors and collaborators. Goals, in order:

1. Show the range and depth of his projects (41 GitHub repos, categorised, each with a designed thumbnail and its README rendered in place).
2. Make contact effortless: a contact form and an "Ask about Awais" chatbot that answers from site content and can email him.
3. Look like a considered editorial publication, not a template.

Live site: see §9. Source: `github.com/Awais-Asghar/portfolio`.

## 2. Stack and commands

| Piece | Choice |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, `src/` layout), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (tokens defined in `src/app/globals.css`, no tailwind.config) |
| Motion | `motion` (Framer Motion) for reveals, hero and chat panel; all respects `prefers-reduced-motion` |
| Fonts | `next/font/google`: Fraunces (display serif), Inter (body), JetBrains Mono (metadata) |
| Markdown | `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-sanitize` |
| Chat LLM | Groq via `groq-sdk`; default `openai/gpt-oss-120b`, falls back to `openai/gpt-oss-20b` then `qwen/qwen3.8-27b` on model-not-found (override with `GROQ_MODEL`) |
| Email | Resend via `resend` SDK |
| Validation | `zod` v4 |
| Icons | `lucide-react` v1 (brand icons live in `src/components/ui/icons.tsx`) |
| Hosting | Vercel (hobby), auto-deploys from GitHub `main` |

```bash
npm run dev        # local dev, http://localhost:3000
npm run build      # production build (also type-checks)
npm run check      # tsc --noEmit && eslint .
npm run thumbs     # regenerate public/thumbnails/*.svg from src/data/projects.ts
npm run format     # prettier
```

Node 20.9+ required (developed on Node 24 LTS). Next 16 ships its own docs in `node_modules/next/dist/docs/`; read those, not memory, for framework APIs (async `params`, `PageProps` helper, etc.).

## 3. Directory map

```
claude.md                      this file
scripts/generate-thumbnails.ts deterministic SVG thumbnail generator
public/
  thumbnails/<slug>.svg        generated, committed (one per project)
  resume/*.pdf                 two resumes (AI Engineer, Hardware); source for the Hardware one in resume/hardware/
  images/avatar.jpg            portrait (replace with a real headshot any time)
src/
  app/
    layout.tsx                 fonts, metadata, Nav/Footer/ChatWidget, ThemeScript
    page.tsx                   home: Hero → Marquee → Featured → About → Experience → Skills → Recognition → Contact
    projects/page.tsx          filterable grid (client) with ?c=<category>&q=
    projects/[slug]/page.tsx   detail: header, metrics, thumbnail, README (ISR 24h), related
    resume/page.tsx            embedded PDF + downloads
    api/chat/route.ts          Groq streaming + send_message_to_awais tool
    api/contact/route.ts       Resend contact endpoint
    api/health/route.ts        GET: booleans for which env vars production has (never values)
    opengraph-image.tsx, sitemap.ts, robots.ts, icon.svg, not-found.tsx
  components/
    layout/  Nav, Footer, ThemeToggle, ThemeScript
    home/    Hero, Marquee, FeaturedProjects, About, Experience, Skills, Recognition, ContactSection
    projects/ ProjectCard, ProjectGrid, CategoryBadge, ReadmeRenderer
    chat/    ChatWidget (launcher + panel + streaming client)
    ui/      Section, Reveal, Button, Badge, icons
  data/
    profile.ts        everything about Awais that is not a project (single source of truth)
    projects.ts       all projects, typed; drives grid, detail pages, thumbnails, sitemap, chatbot
    categories.ts     8 categories with label, hue, motif
    chat-knowledge.ts builds the chatbot system prompt from profile + projects
  lib/
    github.ts   README fetch (raw, cached 24h) + relative-URL rewriting to raw.githubusercontent.com/HEAD
    email.ts    zod contact schema + Resend send (shared by form and chatbot tool)
    rate-limit.ts in-memory sliding window; site.ts canonical URL; utils.ts cn()
```

## 4. Design system ("clean editorial light")

**Tokens** (CSS variables on `:root`, dark overrides on `:root[data-theme="dark"]`, exposed to Tailwind through `@theme inline`):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#faf8f3` | `#111113` | page background |
| `--paper-2` / `--paper-3` | `#f2eee6` / `#e9e4d9` | `#18181b` / `#202024` | cards, inputs |
| `--ink` / `--ink-2` | `#141416` / `#3a3a40` | `#f2efe8` / `#cfcbc2` | text |
| `--muted` | `#6b6b70` | `#8f8c85` | secondary text |
| `--rule` / `--rule-strong` | `#e3dfd5` / `#c9c3b6` | `#27272c` / `#3a3a41` | hairlines, borders |
| `--accent` | `#b8412b` (oxide red) | `#e2694f` | one accent only: links, active states, dot marks |
| `--teal` | `#2f5f63` | `#6cb0b5` | secondary tint |

Tailwind classes: `bg-paper`, `text-ink`, `border-rule`, `text-accent`, etc. Utilities: `container-x` (max 76rem, responsive gutters), `eyebrow` (mono uppercase label), `link-underline`.

**Type**: Fraunces for h1–h3 and `.font-serif` (opsz 144, SOFT 30; italic accent words use SOFT 100). Inter body at 16px. JetBrains Mono for dates, tags, metrics labels. Big numerals use Fraunces.

**Layout rules**: sections are `py-20 md:py-28` with a top hairline and a numbered eyebrow (`01 — Selected work`). Cards: 1px `rule` border, 6px radius, thumbnail 16:10, title below the image (magazine style), tech list in mono. Hover: image scales 1.025, title grows an underline. No drop shadows except `shadow-card` on the portrait and chat panel.

**Motion**: `Reveal` fades/rises 18px on scroll (once). Hero staggers 80ms. Skills ticker (`Marquee.tsx`) is two rows: AI/ML/DL (`profile.marquee.ai`, red dots) scrolling left and hardware (`profile.marquee.hardware`, teal dots) scrolling right, 4s per item so both rows move at the same speed, faded edges, pauses on hover/focus, pause button at the LEFT end (WCAG 2.2.2; on the right it hid under the floating chat launcher on laptop screens). Everything disabled under reduced motion.

**Dark mode**: `ThemeScript` sets `data-theme` before paint from `localStorage.theme` or OS preference; `ThemeToggle` flips it. Tailwind `dark:` variant is remapped to `[data-theme="dark"]`. Thumbnails stay paper-coloured in dark mode by design (they read as printed plates).

**Thumbnails** (`npm run thumbs`): 1600×1000 SVG, paper background, hairline frame, mono category label top-left, accent dot top-right, first metric as a large serif numeral bottom-right (only if ≤ 7 characters). Art is drawn by a motif renderer chosen **per project** in `motifBySlug` inside `scripts/generate-thumbnails.ts` (falls back to the category motif), coloured by the category hue (overridable with `accent`), using a PRNG seeded by the slug so output is stable. There are ~40 renderers (galaxy, fabric, roadscene, retina, stereo, traffic, pipeline, datapath, fsm, accelerator, cacheblocks, particles, eggs, ecg, meter, pid, am, linetrack, follow, face, frames, svm, tree, outliers, sequence, matrix, spectrogram, motor, mosaic, lesion, bins, exam, agents, plus the category defaults). Decision 2026-09-18: Awais asked for project-specific imagery after the category-only motifs made same-category cards look identical. When adding a project, add a `motifBySlug` entry or write a new renderer, re-run, and commit the SVGs.

**Custom thumbnails** (added 2026-09-24): 34 projects now use photorealistic images Awais generated, set through the `thumbnail` field. Seven keep the generated SVG: exam-generator-rag, breastnet (no image supplied) and aqi-monitoring, health-tracker, am-superheterodyne, ball-balancing-pid, cache-simulator (his choice). Raw sources are 1536×1024 PNGs in `/Thumbnails/` (gitignored, ~3 MB each); the committed copies in `public/thumbnails/<slug>.jpg` are centre-cropped to 1536×960 (16:10), mozjpeg q84, ~170 KB. Raster thumbnails go through next/image optimisation with `sizes` hints (SVGs stay `unoptimized`). To add or replace one: drop the PNG in `/Thumbnails/`, crop and encode the same way, set `thumbnail` on the project. For sharp detail-page heroes on retina, supply 2400×1500 or larger.

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
| `featured?` | 1..8 order on the home page (exactly 8 featured) |
| `isPrivate?` | private repo: no README render, no source button, "Private repo" badge; summary is limited to what the public CV already states |
| `fork?` | `{ owner, note }` shown as a badge + note |
| `metrics?` | up to 3 `{ value, label }`; first one is drawn on the thumbnail |
| `thumbnail?` | custom 16:10 image, e.g. `/thumbnails/<slug>.jpg`; when absent the generated SVG is used (`thumbnailSrc()` in `projects.ts`) |
| `motif?`, `accent?` | generated-thumbnail overrides |

**To add a project**: 1) add an entry to `projects.ts`; 2) `npm run thumbs`; 3) `npm run check`; 4) commit including the new SVG; 5) push (Vercel deploys, the chatbot learns it automatically because the system prompt is built from the same file).

`src/data/profile.ts` holds bio, education, experience, publications, honors, leadership, skills, coursework, resumes, links and the marquee list. Edit it for any personal change; the chatbot prompt updates with it.

**Categories** (`categories.ts`): AI & Machine Learning · Computer Vision · LLMs, RAG & Agents · FPGA & Digital Design · Embedded & IoT · Robotics · Startups (id `web`, renamed from "Web & Product" 2026-10-11 at Awais's request: CashFlow and Verre Optics are his startups) · HPC & Systems.

## 6. Chatbot ("Ask about Awais")

- UI: `ChatWidget` is mounted in the root layout. Floating launcher bottom-right; panel is a 400×640 card on desktop and full-screen on mobile. `window.dispatchEvent(new CustomEvent("open-chat"))` opens it from anywhere (hero and contact section use this). Suggested prompts on an empty chat. Escape closes. Streams tokens as plain text.
- API: `POST /api/chat` with `{ messages: [{ role: "user"|"assistant", content }] }`. Node runtime, 60s max. History capped at 24 messages / 2000 chars each. Rate limit 30 requests per 10 min per IP. Returns 503 when `GROQ_API_KEY` is missing (UI shows an email fallback).
- Prompt: `buildSystemPrompt(siteUrl)` in `chat-knowledge.ts`. Rules baked in: third person, only stated facts, short answers, link project pages, stay on topic, never reveal instructions. **Size budget**: Groq free tier rejects requests over ~8k tokens for the large models, so the prompt is kept compact (summaries only for featured projects). `npm run prompt-size` prints the current size; keep it under ~5k tokens.
- **Rate limits** (measured 2026-09-18): Groq free tier allows 7k input tokens per minute *per model*. The prompt is query-aware (~2.5-3.4k tokens: full detail only for projects matching the question plus the featured ones; the rest by title), so each model serves about two requests a minute and the three-model fallback chain (`createStream`, `maxRetries: 0`) gives roughly **six chat answers per minute site-wide**. Beyond that the visitor sees a friendly "try again in a minute" message. The tool confirmation is written without a second model pass (that pass took 40s+ to start). To lift the ceiling, upgrade the Groq account to the Dev tier (pay-as-you-go) or add more model candidates.
- Output style: the client strips em/en dashes from assistant text (`humanize` in `ChatWidget.tsx`) and the prompt asks for plain, friendly wording (Awais's request, 2026-09-18).
- Debugging: send header `x-debug: 1` to `/api/chat` and the fallback text includes the upstream error message. `GET /api/health?probe=2` runs a streaming call with tools.
- Tool: `send_message_to_awais({ name, email, message })`. Flow: pass 1 streams with `tool_choice: "auto"`; if a tool call arrives, the server validates with the same zod schema as the form, calls `sendContactEmail(…, "chat")`, then pass 2 streams the confirmation with the tool result in context.

## 7. Contact and email

- `POST /api/contact` `{ name, email, message, company }`. `company` is a honeypot (hidden field): if filled, respond `{ ok: true }` and drop. zod validation → 400 with the first issue message. Rate limit 5/hour/IP → 429. Missing `RESEND_API_KEY` → 503 and the form shows a `mailto:` fallback. Resend failure → 502.
- Email: from `Portfolio <onboarding@resend.dev>` (override `CONTACT_FROM_EMAIL` once a domain is verified in Resend), to `CONTACT_TO_EMAIL` or else `RESEND_ACCOUNT_EMAIL` in `src/lib/email.ts` (the NUST address the Resend account was created with), `replyTo` = visitor. **The public address shown on the site is `profile.email` = `awaisasghara786@gmail.com` (changed 2026-10-11) and is deliberately not the delivery address**: Resend's free tier rejects any recipient other than the account owner until a domain is verified. To deliver to Gmail: forward the NUST inbox to Gmail, or verify a domain in Resend and set `CONTACT_TO_EMAIL`. Branded HTML + plain-text body. Subject `Portfolio message from <name>` (+ " (via chatbot)").
- Resend's free tier only delivers to the account owner's own address until a domain is verified. Sign up with `aasghar.bee22seecs@seecs.edu.pk` so that matches.

## 8. Environment variables

| Var | Required | Where |
|---|---|---|
| `GROQ_API_KEY` | for chat | console.groq.com → API Keys |
| `RESEND_API_KEY` | for email | resend.com → API Keys |
| `CONTACT_TO_EMAIL` | optional | delivery inbox; unset in production, falls back to `RESEND_ACCOUNT_EMAIL` (the NUST address) |
| `CONTACT_FROM_EMAIL` | optional | after verifying a domain in Resend |
| `GITHUB_TOKEN` | optional | raises README fetch limit (60/h unauthenticated is enough for 37 public repos + daily ISR) |
| `GROQ_MODEL` | optional | defaults to `openai/gpt-oss-120b`; see `MODEL_CANDIDATES` in `api/chat/route.ts` |
| `NEXT_PUBLIC_SITE_URL` | optional | falls back to Vercel's production URL |

Local: copy `.env.example` → `.env.local`. Production: Vercel → Project → Settings → Environment Variables → add → **Redeploy** (env changes need a new deployment).

## 9. Deployment

- GitHub: `Awais-Asghar/portfolio`, branch `main` = production. Commit and push; Vercel builds automatically once the project is linked. Preview deployments for other branches.
- Vercel team `awais-asghar-s-projects` (`team_Ese4jZpHuBuArx5kzf9qsmOy`).
- **Linking (one-time, manual)**: the Vercel API could not link the repo from the agent session (the Vercel GitHub App did not have access to the new repository; two API-created projects never materialised). Do it in the dashboard: vercel.com/new → Import Git Repository → pick `Awais-Asghar/portfolio` (click "Adjust GitHub App Permissions" and grant the repo if it is not listed) → Framework: Next.js (auto) → add env vars from §8 → Deploy. Name the project `awais-portfolio` (`awais-asghar` was reported as taken by the API).
- **Live**: https://awais-asghar.vercel.app (Vercel project `awais-asghar`, team `awais-asghar-s-projects`). Env vars `GROQ_API_KEY` and `RESEND_API_KEY` are set there; chat and email are verified working.
- **Domain history**: two projects were briefly linked to this repo on 2026-09-18; the spare was deleted, the survivor renamed to `awais-asghar` and the `awais-asghar.vercel.app` alias attached by hand. Because Vercel's `VERCEL_PROJECT_PRODUCTION_URL` lagged behind that change, `src/lib/site.ts` now hardcodes the canonical production URL instead of trusting it; previews still use their own URL and local dev uses localhost.
- The Vercel MCP connector cannot see this project (`list_projects` returns only verre-optics and techstore-chatbot), so verify deploys with `GET /api/health`, which returns the deployed commit sha.
- Env vars only apply to deployments created after they were added: after adding a key, push a commit or click Redeploy. Verify with `GET /api/health` (`chat`, `email` must be `true`).
- Build: `next build` (Turbopack). Project pages are prerendered for all slugs (`generateStaticParams`, `dynamicParams=false`) and READMEs revalidate every 24h.
- Custom domain: add in Vercel → Domains, then set `NEXT_PUBLIC_SITE_URL` and redeploy.
- **Google Search Console** (2026-10-10): URL-prefix property for `https://awais-asghar.vercel.app`, verified by the `verification.google` meta tag in `src/app/layout.tsx`. Keep that tag in place or Search Console loses ownership. Sitemap to submit: `sitemap.xml`. If the site moves to a custom domain, add a new property for it (a Domain property via DNS works there).

## 10. Decision log

- **2026-09-18** Visual direction: *clean editorial light* (user choice over dark circuit / neon). Dark mode kept as a toggle.
- **2026-09-18** Chat LLM: Groq, free tier (user choice over Anthropic / Gemini). Llama 3.3 70B was the plan, but Groq had already retired it; the account exposes `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`, `groq/compound`. Default is gpt-oss-120b with fallbacks. Check `GET /api/health?probe=1` (lists live models) when chat breaks.
- **2026-09-18** Email: Resend (user choice over Web3Forms / Gmail SMTP). Sender stays `onboarding@resend.dev` until a domain exists.
- **2026-09-18** Thumbnails: designed generative SVG per project (user choice over AI images / screenshots). Deterministic so diffs stay clean.
- **2026-09-18** Four repos are private (`FPGA-U-Net-Accelerator`, `FYP-AI-Accelerator`, `tno_detection`, `cashflow`). They are listed with a "Private repo" badge, no README render and no source link; their summaries only restate what the public CV already says. Make them public to enable README rendering with no code change.
- **2026-09-18** No phone number on the site (privacy). Email, GitHub, LinkedIn only.
- **2026-09-18** AI Engineer resume is primary; Hardware/EE resume offered second.
- **2026-09-18** Portrait uses the GitHub avatar; drop a real photo at `public/images/avatar.jpg` to replace.
- **2026-09-18** Next.js 16 (latest at scaffold time) instead of the planned 15; conventions checked against bundled docs.
- **2026-09-18** Motion: never use `initial={false}` under reduced motion. The server renders the hidden initial style and the client then skips the animation, leaving sections invisible. Always animate; set `transition.duration = 0` when `useReducedMotion()` is true.
- **2026-09-18** OG image fonts are bundled as WOFF in `src/app/fonts/` and read with `fs` (traced via `outputFileTracingIncludes`); fetching from Google Fonts at build time was unreliable.
- **2026-10-11** Google listed the site as "Vercel" with Vercel's triangle icon. Cause: the create-next-app `src/app/favicon.ico` (the Vercel logo) was never replaced and is listed first in `<head>`, and there was no WebSite structured data. Fix: `favicon.ico` regenerated from `icon.svg` (16/32/48 PNG-in-ICO), `apple-icon.png` (180, full bleed) added, and the home page JSON-LD is now an `@graph` of WebSite (`name` = site name Google shows) + ProfilePage + Person. Never reintroduce the starter favicon. Google picks up icon and site-name changes on its next crawl (days to a few weeks); Request indexing on the home page speeds it up.
- **2026-10-11** Search/preview title is `profile.seoTitle` ("Awais Asghar - AI Engineer | AI | ML | DL | LLMs | AI Agents", Awais's wording, matching his LinkedIn headline) and description `profile.seoDescription`; used by the home `<title>`, Open Graph, Twitter, the OG image alt and the ProfilePage name. Other pages keep the `%s - Awais Asghar` template. Same day, Awais chose to reposition the page itself as AI Engineer: `profile.headline` = "AI engineer working on ML, LLMs and AI agents" (hero h1 hardcodes the split, italic accent on "ML, LLMs and AI agents"), hero eyebrow "AI Engineer, NUST", and `profile.tagline` rewritten to match (also used by the footer, chatbot prompt and Person JSON-LD).
- **2026-10-11** Content and UI fixes from Awais: HamsanTech ML internship is June-Aug **2023** (moved to the bottom of the timeline); leadership drops "Co-founder, Robotics & AI training startup" (he was a trainer, not a founder) and adds "Founder, CashFlow" (sole founder); experience dates never wrap (`whitespace-nowrap`, 200px column); publication status badge never wraps; toolkit items render as outlined chips; chat header subtitle is just "Assistant"; the chat message box auto-grows to 200px before scrolling.
- **2026-10-11** Corrections from Awais: sole founder of CashFlow; SkinSense dated 2023 (built during the 2023 HamsanTech internship) on the site and the AI Engineer resume; Dean's Honor List four times everywhere (site and both resumes).
- **2026-10-11** Hero ticker split into two rows at Awais's request. Direction chosen: **opposite**. Reddit could not be checked (it blocks automated access); evidence used was design-component defaults (Framer's marquee defaults to opposite rows, shadcnblocks ships "double-row alternating marquees") and their own caveat that alternating rows need generous spacing to stay legible, plus WCAG 2.2.2 (moving content >5s must be pausable; hover-pause alone is not enough). Hence: slow speed, 16px row gap, edge fade, pause button, reduced-motion = static. Next.js dropped from the ticker (neither AI nor hardware).
- **2026-10-11** Home page featured set refocused on AI for Awais's AI job applications. Order (revised same day at Awais's request, fabric defect detection replaces the AI agents workshop): tno-detection (large card), driving-scene-segmentation, exam-generator-rag, fpga-unet-accelerator, fabric-defect-detection, skinsense, recyclevision, vehicle-detection (added to keep eight cards; it covers object detection). Dropped from featured: pipelined-risc-v, smart-energy-monitor, cashflow, ai-agents-workshop (still in the grid; CashFlow also in Leadership). Section title "Eight AI projects, from research to deployment." To retarget for hardware roles, move the `featured` numbers back.
- **2026-09-18** README images render through plain `<img>` (not `next/image`) because GitHub asset URLs are unbounded; sanitiser allows `img`, `picture`, `details`, `video`, `align`/`width` attributes.

## 10b. Resumes

- `public/resume/Awais_Asghar_AI_Engineer.pdf` and `public/resume/Awais_Asghar_Hardware.pdf`, both built from LaTeX source in this repo: `resume/ai-engineer/` and `resume/hardware/`.
- The AI Engineer source was recreated 2026-10-11 from Awais's Overleaf PDF (text-diffed: identical except the Gmail address and the HamsanTech dates moved to 2023; margins set to 0.4in sides / -0.7in top to match his Overleaf layout). His Overleaf copy still has the old values; the repo source is now the reference.
- The Hardware resume source is `resume/hardware/Awais_Asghar_Hardware.tex`, Jake's Resume template (pdfTeX-only lines `glyphtounicode` removed so it also builds with Tectonic/XeTeX). Build with `tectonic Awais_Asghar_Hardware.tex` or upload to Overleaf, then copy the PDF to `public/resume/`.
- `profile.resumes` in `src/data/profile.ts` lists both; the resume page previews whichever is selected (`ResumeViewer`).

## 11. Backlog / ideas

- Per-project OG images (render the SVG thumbnail through `ImageResponse`).
- Verify a custom domain in Resend and switch `CONTACT_FROM_EMAIL`.
- Blog / notes section (MDX) for the two papers in progress.
- Vercel Web Analytics (`@vercel/analytics`) once traffic matters.
- Replace GitHub avatar with a real portrait; add a short intro video on the hero.
- Make the four private repos public (or add public write-ups) so READMEs render.
