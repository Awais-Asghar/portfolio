# Awais Asghar — portfolio

Personal site for Awais Asghar: electrical engineer building AI at the edge. FPGA accelerators, computer vision, LLM applications and embedded systems, with every project categorised, illustrated and documented in one place.

Built with Next.js 16, React 19, Tailwind CSS v4 and deployed on Vercel.

## Features

- **41 projects** across 8 disciplines, each with a generated editorial thumbnail and its GitHub README rendered in place.
- **Ask about Awais**: a Groq-powered assistant that answers from the site's own content and can deliver a message straight to his inbox.
- **Contact form** delivered through Resend with a honeypot and rate limiting.
- Light and dark themes, reduced-motion support, Open Graph image, sitemap, JSON-LD.

## Develop

```bash
npm install
cp .env.example .env.local   # add GROQ_API_KEY and RESEND_API_KEY
npm run dev
```

Other scripts: `npm run build`, `npm run check` (types + lint), `npm run thumbs` (regenerate thumbnails).

## Project docs

All design decisions, conventions and the content model are documented in [`claude.md`](./claude.md).
