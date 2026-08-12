/**
 * Local SVG card previews → scripts/out/
 * Usage: npm run preview:cards
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { optimizeLeaves } from "../src/optimize/bridge.js";
import { resolveTheme } from "../src/cards/theme.js";
import { renderSvg } from "../src/cards/render.js";
import { animateSvg } from "../src/cards/animate.js";
import { PlanCard, PLAN_WIDTH, PLAN_HEIGHT } from "../src/cards/Plan.js";
import { YearCard, YEAR_WIDTH, YEAR_HEIGHT } from "../src/cards/Year.js";
import { OgCard, OG_WIDTH, OG_HEIGHT } from "../src/cards/Og.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "out");
mkdirSync(outDir, { recursive: true });

const result = optimizeLeaves({
  state: "KA",
  year: 2027,
  leaves: 4,
  weekend: "sat-sun",
  includeRestricted: false,
  maxPlans: 5,
});

const plan = result.plans[0];
if (!plan) throw new Error("No plans generated for preview.");

const theme = resolveTheme("toolwiz");
const meta = { state: result.state, stateName: "Karnataka", year: result.year };

let planSvg = await renderSvg(PlanCard(plan, meta, theme), PLAN_WIDTH, PLAN_HEIGHT);
planSvg = animateSvg(planSvg, theme.accent);
const yearSvg = await renderSvg(
  YearCard(result.plans, { ...meta, leaves: result.leaves }, theme),
  YEAR_WIDTH,
  YEAR_HEIGHT,
);
const ogSvg = await renderSvg(OgCard(plan, { stateName: meta.stateName, year: meta.year }, theme), OG_WIDTH, OG_HEIGHT);

writeFileSync(resolve(outDir, "plan.svg"), planSvg);
writeFileSync(resolve(outDir, "year.svg"), yearSvg);
writeFileSync(resolve(outDir, "og.svg"), ogSvg);
console.log(`Wrote ${outDir}/{plan,year,og}.svg — best plan: ${plan.label}`);
