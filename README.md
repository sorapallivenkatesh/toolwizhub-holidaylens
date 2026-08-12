# HolidayLens

> Indian **state-aware** holidays + leave bridge optimizer.
> Classic hook: **4 leaves → 9-day break**. Shareable SVG plan cards + dashboard.
> Part of **ToolWizHub** — Cloudflare Workers (~$0/mo). No AI keys.

## Quick start

```bash
cd holidaylens
npm install
npm run ui:install
npm run validate:data
npm start              # API :8791 + UI :5174
```

Or separately:

```bash
npm run dev            # Worker http://127.0.0.1:8791
npm run ui             # Vite  http://127.0.0.1:5174
```

Try:

```text
http://127.0.0.1:8791/api/holidays?state=KA&year=2027
http://127.0.0.1:8791/api/optimize?state=KA&year=2027&leaves=4
http://127.0.0.1:8791/api/card/plan?state=KA&year=2027&leaves=4&theme=toolwiz
http://127.0.0.1:8791/p?state=KA&year=2027&leaves=4
```

Preview cards locally (writes `scripts/out/*.svg`):

```bash
npm run preview:cards
```

## API

| Endpoint | Params |
| --- | --- |
| `GET /api/states` | — |
| `GET /api/holidays` | `state`, `year`, `include_restricted` |
| `GET /api/optimize` | `state`, `year`, `leaves`, `weekend`, `max_plans`, `include_restricted` |
| `GET /api/card/plan` | optimize params + `plan`, `theme`, `animate` |
| `GET /api/card/year` | optimize params + `theme`, `animate` |
| `GET /api/og` | optimize params + `plan`, `theme` |
| `GET /api/ics` | optimize params + `plan` |
| `GET /p` | shareable HTML page (OG tags) |
| `GET /healthz` | — |

Themes: `toolwiz` (default), `dark`, `light`.

## Deploy

```bash
npm run deploy         # Cloudflare Worker
npm run deploy:ui      # Pages project toolwizhub-holidaylens
```

Set Pages env `VITE_API_BASE` to your Worker URL (e.g. `https://api-holidaylens.toolwizhub.com`) before `ui:build`, or bake it into `web/.env.production`.

## Data notes

Holiday lists are **curated** composites (DoPT / gazette / public calendars).
Lunar festivals may be marked `confidence: provisional` until a state circular confirms them.
Private-sector calendars can differ — optimizer defaults to **gazetted** only.

## Status

| Piece | Status |
| --- | --- |
| Holiday JSON (national + KA/MH/DL/TN/TS · 2026–2027) | ✅ |
| Optimize + ICS + share page | ✅ |
| SVG plan / year / OG cards | ✅ |
| Vite dashboard | ✅ |
