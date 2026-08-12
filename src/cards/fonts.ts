import type { Font } from "satori";

const FONT_SOURCES: Array<{ url: string; weight: Font["weight"]; style: "normal" }> = [
  {
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff",
    weight: 400,
    style: "normal",
  },
  {
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-600-normal.woff",
    weight: 600,
    style: "normal",
  },
  {
    url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff",
    weight: 700,
    style: "normal",
  },
];

let cache: Font[] | null = null;
let inflight: Promise<Font[]> | null = null;

async function loadOne(src: (typeof FONT_SOURCES)[number]): Promise<Font> {
  const res = await fetch(src.url, {
    cf: { cacheTtl: 31536000, cacheEverything: true },
  } as RequestInit);
  if (!res.ok) throw new Error(`Failed to load font: ${src.url} (${res.status})`);
  const data = await res.arrayBuffer();
  return { name: "Inter", data, weight: src.weight, style: src.style };
}

export async function getFonts(): Promise<Font[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = Promise.all(FONT_SOURCES.map(loadOne)).then((fonts) => {
      cache = fonts;
      inflight = null;
      return fonts;
    });
  }
  return inflight;
}
