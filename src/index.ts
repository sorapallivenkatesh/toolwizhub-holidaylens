import { Hono } from "hono";
import { cors } from "hono/cors";
import { HolidayLensError, type Env, type LeavePlan, type WeekendMode } from "./types.js";
import { STATES } from "./holidays/states.js";
import { getHolidays, SUPPORTED_YEARS } from "./holidays/load.js";
import { optimizeLeaves } from "./optimize/bridge.js";
import { resolveTheme } from "./cards/theme.js";
import { renderSvg } from "./cards/render.js";
import { animateSvg } from "./cards/animate.js";
import { PlanCard, PLAN_HEIGHT, PLAN_WIDTH } from "./cards/Plan.js";
import { YearCard, YEAR_HEIGHT, YEAR_WIDTH } from "./cards/Year.js";
import { OgCard, OG_HEIGHT, OG_WIDTH } from "./cards/Og.js";
import { ErrorCard, ERROR_HEIGHT, ERROR_WIDTH } from "./cards/ErrorCard.js";
import { buildIcs } from "./ics.js";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.onError((err, c) => {
  if (err instanceof HolidayLensError) {
    return c.json({ error: err.message }, err.status as 400);
  }
  console.error("[holidaylens]", err);
  return c.json({ error: "Unexpected server error." }, 500);
});

function stateName(code: string): string {
  return STATES.find((s) => s.code === code)?.name ?? code;
}

function parseOptimizeQuery(c: { req: { query: (k: string) => string | undefined } }) {
  const state = c.req.query("state");
  const yearRaw = c.req.query("year");
  const leavesRaw = c.req.query("leaves");
  if (!state) throw new HolidayLensError("`state` is required (e.g. KA).", 400);
  if (leavesRaw == null || leavesRaw === "") {
    throw new HolidayLensError("`leaves` is required (e.g. 4).", 400);
  }
  const year = yearRaw ? Number(yearRaw) : new Date().getUTCFullYear() + 1;
  const leaves = Number(leavesRaw);
  const weekend = (c.req.query("weekend") ?? "sat-sun") as WeekendMode;
  if (weekend !== "sat-sun" && weekend !== "sun-only") {
    throw new HolidayLensError("`weekend` must be sat-sun or sun-only.", 400);
  }
  const maxPlans = Math.min(20, Math.max(1, Number(c.req.query("max_plans") ?? 5)));
  const includeRestricted = c.req.query("include_restricted") === "true";
  return { state, year, leaves, weekend, maxPlans, includeRestricted };
}

function pickPlan(plans: LeavePlan[], planId: string | undefined): LeavePlan {
  if (!plans.length) throw new HolidayLensError("No plans found for these inputs.", 404);
  if (!planId) return plans[0]!;
  const found = plans.find((p) => p.id === planId);
  if (!found) throw new HolidayLensError(`Unknown plan id "${planId}".`, 404);
  return found;
}

function svgResponse(svg: string, ttl = 3600): Response {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function cardOrError(
  themeName: string | undefined,
  produce: () => Promise<string>,
): Promise<Response> {
  try {
    return svgResponse(await produce());
  } catch (err) {
    const message = err instanceof HolidayLensError ? err.message : "Could not render card.";
    if (!(err instanceof HolidayLensError)) console.error("[holidaylens] card", err);
    const svg = await renderSvg(ErrorCard(message, themeName), ERROR_WIDTH, ERROR_HEIGHT);
    return svgResponse(svg, 60);
  }
}

app.get("/", (c) =>
  c.json({
    name: "HolidayLens",
    tagline: "Indian state holidays + leave bridge optimizer.",
    states: STATES,
    years: SUPPORTED_YEARS,
    live: {
      holidays: "/api/holidays?state=KA&year=2027",
      optimize: "/api/optimize?state=KA&year=2027&leaves=4",
      planCard: "/api/card/plan?state=KA&year=2027&leaves=4&theme=toolwiz",
      yearCard: "/api/card/year?state=KA&year=2027&leaves=4&theme=toolwiz",
      og: "/api/og?state=KA&year=2027&leaves=4&theme=toolwiz",
      ics: "/api/ics?state=KA&year=2027&leaves=4",
      share: "/p?state=KA&year=2027&leaves=4",
      health: "/healthz",
    },
    params: ["state", "year", "leaves", "weekend", "include_restricted", "max_plans", "plan", "theme", "animate"],
  }),
);

app.get("/healthz", (c) => c.text("ok"));

app.get("/api/states", (c) =>
  c.json({
    states: STATES,
    years: SUPPORTED_YEARS,
    stateOverlays: ["KA", "MH", "DL", "TN", "TS"],
  }),
);

app.get("/api/holidays", (c) => {
  const state = c.req.query("state");
  const yearRaw = c.req.query("year");
  if (!state) throw new HolidayLensError("`state` is required (e.g. KA).", 400);
  const year = yearRaw ? Number(yearRaw) : new Date().getUTCFullYear();
  if (!Number.isFinite(year)) throw new HolidayLensError("`year` must be a number.", 400);
  const includeRestricted = c.req.query("include_restricted") === "true";
  return c.json(getHolidays(state, year, { includeRestricted }));
});

app.get("/api/optimize", (c) => {
  const q = parseOptimizeQuery(c);
  return c.json(optimizeLeaves(q));
});

app.get("/api/card/plan", (c) =>
  cardOrError(c.req.query("theme"), async () => {
    const q = parseOptimizeQuery(c);
    const result = optimizeLeaves({ ...q, maxPlans: Math.max(q.maxPlans, 10) });
    const plan = pickPlan(result.plans, c.req.query("plan"));
    const theme = resolveTheme(c.req.query("theme"));
    let svg = await renderSvg(
      PlanCard(plan, { state: result.state, stateName: stateName(result.state), year: result.year }, theme),
      PLAN_WIDTH,
      PLAN_HEIGHT,
    );
    if (c.req.query("animate") !== "false") svg = animateSvg(svg, theme.accent);
    return svg;
  }),
);

app.get("/api/card/year", (c) =>
  cardOrError(c.req.query("theme"), async () => {
    const q = parseOptimizeQuery(c);
    const result = optimizeLeaves({ ...q, maxPlans: Math.max(q.maxPlans, 5) });
    const theme = resolveTheme(c.req.query("theme"));
    let svg = await renderSvg(
      YearCard(result.plans, {
        state: result.state,
        stateName: stateName(result.state),
        year: result.year,
        leaves: result.leaves,
      }, theme),
      YEAR_WIDTH,
      YEAR_HEIGHT,
    );
    if (c.req.query("animate") !== "false") svg = animateSvg(svg, theme.accent);
    return svg;
  }),
);

app.get("/api/og", (c) =>
  cardOrError(c.req.query("theme"), async () => {
    const q = parseOptimizeQuery(c);
    const result = optimizeLeaves({ ...q, maxPlans: Math.max(q.maxPlans, 10) });
    const plan = pickPlan(result.plans, c.req.query("plan"));
    const theme = resolveTheme(c.req.query("theme"));
    return renderSvg(
      OgCard(plan, { stateName: stateName(result.state), year: result.year }, theme),
      OG_WIDTH,
      OG_HEIGHT,
    );
  }),
);

app.get("/api/ics", (c) => {
  const q = parseOptimizeQuery(c);
  const result = optimizeLeaves({ ...q, maxPlans: Math.max(q.maxPlans, 10) });
  const plan = pickPlan(result.plans, c.req.query("plan"));
  const title = `HolidayLens: ${plan.label} (${stateName(result.state)})`;
  const body = buildIcs(plan, title);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="holidaylens-${plan.id}.ics"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
});

/** Lightweight shareable HTML page (OG + summary). Dashboard SPA can replace later. */
app.get("/p", (c) => {
  const q = parseOptimizeQuery(c);
  const result = optimizeLeaves({ ...q, maxPlans: Math.max(q.maxPlans, 10) });
  const plan = pickPlan(result.plans, c.req.query("plan"));
  const theme = c.req.query("theme") ?? "toolwiz";
  const name = stateName(result.state);
  const qs = new URLSearchParams({
    state: result.state,
    year: String(result.year),
    leaves: String(result.leaves),
    plan: plan.id,
    theme,
  });
  const og = `/api/og?${qs}`;
  const card = `/api/card/plan?${qs}`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${plan.label} · ${name} · HolidayLens</title>
  <meta property="og:title" content="${plan.label} — ${name}"/>
  <meta property="og:description" content="${plan.from} to ${plan.to} · ${plan.efficiency}× leave ROI"/>
  <meta property="og:image" content="${og}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <style>
    body{margin:0;font-family:Inter,system-ui,sans-serif;background:#07070d;color:#f4f5fb;
      min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:40px 20px;
      background-image:radial-gradient(circle at 80% 0%,rgba(46,230,214,.25),transparent 45%),
        radial-gradient(circle at 10% 90%,rgba(255,92,168,.18),transparent 40%)}
    h1{font-size:clamp(28px,5vw,44px);margin:0 0 8px;letter-spacing:-.02em}
    p{color:#8695b6;margin:0 0 24px}
    img{max-width:min(1080px,100%);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
    a{color:#2ee6d6}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
    .actions a{padding:10px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.14);
      text-decoration:none;color:#e7ecf6;background:rgba(255,255,255,.05)}
  </style>
</head>
<body>
  <h1>${plan.label}</h1>
  <p>${name} · ${plan.from} → ${plan.to} · ${plan.efficiency}× efficiency</p>
  <img src="${card}" alt="${plan.label}"/>
  <div class="actions">
    <a href="/api/ics?${qs}">Add to calendar (.ics)</a>
    <a href="/">API index</a>
  </div>
</body>
</html>`;
  return c.html(html);
});

export default app;
