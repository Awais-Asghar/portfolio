import "server-only";

const OWNER = "Awais-Asghar";
const RAW = (repo: string) => `https://raw.githubusercontent.com/${OWNER}/${repo}/HEAD/`;
const BLOB = (repo: string) => `https://github.com/${OWNER}/${repo}/blob/HEAD/`;

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "awais-portfolio",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/**
 * Fetch a repository README as raw markdown. Cached for a day (ISR).
 * Returns null on any failure so pages still render without it.
 */
export async function fetchReadme(repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/readme`, {
      headers: headers(),
      next: { revalidate: 86400, tags: [`readme:${repo}`] },
    });
    if (!res.ok) return null;
    const md = await res.text();
    return rewriteRelativeUrls(md, repo);
  } catch {
    return null;
  }
}

const isAbsolute = (u: string) => /^(https?:)?\/\//i.test(u) || u.startsWith("#") || u.startsWith("mailto:") || u.startsWith("data:");
const clean = (u: string) => u.replace(/^\.?\//, "");
const isImage = (u: string) => /\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(u);

/**
 * Point relative README links at GitHub so images load and links resolve.
 * Images (and anything under an assets-like path) go to raw.githubusercontent.com;
 * other relative links go to the blob view.
 */
export function rewriteRelativeUrls(md: string, repo: string): string {
  const raw = RAW(repo);
  const blob = BLOB(repo);
  const target = (u: string, image: boolean) => (image || isImage(u) ? raw : blob) + clean(u);

  // Markdown images: ![alt](path)
  let out = md.replace(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(\s+"[^"]*")?\s*\)/g, (m, alt, url, title) =>
    isAbsolute(url) ? m : `![${alt}](${target(url, true)}${title ?? ""})`,
  );
  // Markdown links: [text](path) — skip images already handled (preceded by '!')
  out = out.replace(/(^|[^!])\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(\s+"[^"]*")?\s*\)/g, (m, pre, text, url, title) =>
    isAbsolute(url) ? m : `${pre}[${text}](${target(url, false)}${title ?? ""})`,
  );
  // HTML src / srcset / href attributes
  out = out.replace(/\b(src|href|srcset)=["']([^"']+)["']/gi, (m, attr, url) => {
    if (isAbsolute(url)) return m;
    const image = attr.toLowerCase() !== "href";
    return `${attr}="${target(url, image)}"`;
  });
  return out;
}
