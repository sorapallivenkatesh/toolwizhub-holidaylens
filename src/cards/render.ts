import satori from "satori";
import { getFonts } from "./fonts.js";
import type { SatoriElement } from "../jsx.js";

export async function renderSvg(
  element: SatoriElement,
  width: number,
  height: number,
): Promise<string> {
  const fonts = await getFonts();
  return satori(element as unknown as Parameters<typeof satori>[0], {
    width,
    height,
    fonts,
  });
}

export function fmtRange(from: string, to: string): string {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const left = `${months[a.getUTCMonth()]} ${a.getUTCDate()}`;
  const right = sameYear
    ? `${months[b.getUTCMonth()]} ${b.getUTCDate()}, ${b.getUTCFullYear()}`
    : `${months[b.getUTCMonth()]} ${b.getUTCDate()}, ${b.getUTCFullYear()}`;
  return `${left} – ${right}`;
}
