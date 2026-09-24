import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name} - ${profile.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fonts are read from src/app/fonts so the image renders identically at build
// time and at runtime, with no network dependency. next.config.ts traces them.
const fontDir = join(process.cwd(), "src", "app", "fonts");
const loadFont = async (file: string) => {
  const buf = await readFile(join(fontDir, file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};

export default async function OgImage() {
  const [frauncesData, interData] = await Promise.all([
    loadFont("Fraunces-Medium.woff"),
    loadFont("Inter-Regular.woff"),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf8f3",
          color: "#141416",
          padding: "64px 72px",
          fontFamily: "Fraunces",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 24, border: "2px solid rgba(20,20,22,0.35)", display: "flex" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: "#6b6b70", fontFamily: "Inter" }}>
            PORTFOLIO · {new Date().getFullYear()} · NUST
          </div>
          <div style={{ display: "flex", width: 20, height: 20, borderRadius: 999, background: "#b8412b" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1, letterSpacing: -3 }}>{profile.name}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 40, lineHeight: 1.15, color: "#b8412b" }}>
            {profile.headline}.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 24,
              color: "#3a3a40",
              fontFamily: "Inter",
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            FPGA accelerators · Computer vision · LLM applications · Embedded systems
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6b6b70", fontFamily: "Inter" }}>
          <span>github.com/Awais-Asghar</span>
          <span>{profile.email}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: frauncesData, style: "normal", weight: 500 },
        { name: "Inter", data: interData, style: "normal", weight: 400 },
      ],
    },
  );
}
