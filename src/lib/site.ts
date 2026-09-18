/** Canonical production URL. Override per-environment with NEXT_PUBLIC_SITE_URL. */
const PRODUCTION_URL = "https://awais-asghar.vercel.app";

/**
 * Site URL without a trailing slash, used for canonical tags, Open Graph,
 * the sitemap and the links the chatbot hands out.
 * Production always uses the canonical domain, previews use their own URL.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production"
    ? PRODUCTION_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
).replace(/\/$/, "");
