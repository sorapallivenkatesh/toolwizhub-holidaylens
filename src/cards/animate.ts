export function animateSvg(svg: string, accent: string): string {
  const m = svg.match(/<svg[^>]*\bwidth="(\d+(?:\.\d+)?)"[^>]*\bheight="(\d+(?:\.\d+)?)"/);
  const w = Number(m?.[1] ?? 540);
  const h = Number(m?.[2] ?? 275);
  const r = 18;
  const from = -(w * 0.6);
  const to = w * 1.35;
  const css = `
    .hl-sheen{animation:hlSheen 4.2s cubic-bezier(.4,0,.2,1) infinite;}
    @keyframes hlSheen{0%{transform:translateX(${from.toFixed(1)}px) skewX(-16deg);}
      55%{transform:translateX(${to.toFixed(1)}px) skewX(-16deg);}
      100%{transform:translateX(${to.toFixed(1)}px) skewX(-16deg);}}
    .hl-glow{animation:hlGlow 3.2s ease-in-out infinite;}
    @keyframes hlGlow{0%,100%{opacity:.22;}50%{opacity:.55;}}
    @media (prefers-reduced-motion:reduce){.hl-sheen,.hl-glow{animation:none;}}
  `.replace(/\s+/g, " ").trim();

  const defs =
    `<clipPath id="hl-clip"><rect x="0" y="0" width="${w}" height="${h}" rx="${r}"/></clipPath>` +
    `<linearGradient id="hl-sheen-grad" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#ffffff" stop-opacity="0"/>` +
    `<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.12"/>` +
    `<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>` +
    `</linearGradient>`;

  const overlays =
    `<g clip-path="url(#hl-clip)"><g class="hl-sheen">` +
    `<rect x="0" y="0" width="${(w * 0.32).toFixed(1)}" height="${h}" fill="url(#hl-sheen-grad)"/>` +
    `</g></g>` +
    `<rect class="hl-glow" x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${r - 1}" ` +
    `fill="none" stroke="${accent}" stroke-width="1.5"/>`;

  let out = svg.replace("</defs>", `${defs}</defs><style>${css}</style>`);
  if (!out.includes("<style>")) {
    out = out.replace(/<svg([^>]*)>/, `<svg$1><defs>${defs}</defs><style>${css}</style>`);
  }
  return out.replace("</svg>", `${overlays}</svg>`);
}
