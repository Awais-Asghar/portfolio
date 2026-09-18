import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { profile } from "@/data/profile";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl">
            Awais Asghar<span className="text-accent">.</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted">{profile.tagline}</p>
          <div className="mt-5 flex gap-3">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-2 transition hover:border-rule-strong hover:text-ink"
            >
              <GithubIcon size={16} />
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-2 transition hover:border-rule-strong hover:text-ink"
            >
              <LinkedinIcon size={16} />
            </a>
            <a
              href={profile.links.email}
              aria-label="Email"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink-2 transition hover:border-rule-strong hover:text-ink"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>
        <div>
          <p className="eyebrow">Site</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/projects" className="link-underline">
                All projects
              </Link>
            </li>
            <li>
              <Link href="/#experience" className="link-underline">
                Experience
              </Link>
            </li>
            <li>
              <Link href="/resume" className="link-underline">
                Resume
              </Link>
            </li>
            <li>
              <Link href="/#contact" className="link-underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Elsewhere</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={profile.links.github} target="_blank" rel="noreferrer" className="link-underline">
                github.com/Awais-Asghar
              </a>
            </li>
            <li>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="link-underline">
                linkedin.com/in/awais--asghar
              </a>
            </li>
            <li>
              <a href={profile.links.email} className="link-underline break-all">
                {profile.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {profile.name}. {profile.location}.
          </p>
          <p className="font-mono">Next.js · Vercel · Typeset in Fraunces & Inter</p>
        </div>
      </div>
    </footer>
  );
}
