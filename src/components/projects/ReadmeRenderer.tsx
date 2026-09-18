import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/** GitHub-flavoured README rendering with a sanitiser that still allows the HTML GitHub READMEs rely on. */
const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "picture",
    "source",
    "details",
    "summary",
    "kbd",
    "sub",
    "sup",
    "video",
    "center",
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "align", "width", "height", "style"],
    img: [...(defaultSchema.attributes?.img ?? []), "src", "alt", "width", "height", "align", "loading"],
    source: ["srcset", "media", "type"],
    a: [...(defaultSchema.attributes?.a ?? []), "href", "target", "rel"],
    video: ["src", "controls", "width", "height", "muted", "loop", "autoplay", "poster"],
    input: ["type", "checked", "disabled"],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https"],
    href: ["http", "https", "mailto", "tel"],
  },
};

export function ReadmeRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="readme">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema]]}
        components={{
          a: ({ href, children, ...rest }) => (
            <a href={href} target="_blank" rel="noreferrer" {...rest}>
              {children}
            </a>
          ),
          img: ({ src, alt, width, height }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === "string" ? src : undefined}
              alt={alt ?? ""}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
