/**
 * Validate holiday JSON files under data/holidays.
 * Run: npm run validate:data
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "data", "holidays");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
let errors = 0;

function fail(msg: string) {
  console.error("✗", msg);
  errors += 1;
}

function checkFile(path: string) {
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    year: number;
    holidays: { date: string; name: string; type: string; scope: string }[];
  };
  if (!raw.year) fail(`${path}: missing year`);
  const seen = new Set<string>();
  for (const h of raw.holidays ?? []) {
    if (!DATE_RE.test(h.date)) fail(`${path}: bad date ${h.date}`);
    if (!h.name) fail(`${path}: missing name on ${h.date}`);
    if (!["gazetted", "restricted", "optional", "bank"].includes(h.type)) {
      fail(`${path}: bad type ${h.type}`);
    }
    if (seen.has(h.date)) fail(`${path}: duplicate date ${h.date}`);
    seen.add(h.date);
    if (Number(h.date.slice(0, 4)) !== raw.year) {
      fail(`${path}: date ${h.date} year mismatch with file year ${raw.year}`);
    }
  }
  console.log(`✓ ${path} (${raw.holidays?.length ?? 0} holidays)`);
}

function walk(dir: string) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith(".json")) checkFile(p);
  }
}

walk(ROOT);
if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}
console.log("\nAll holiday files OK.");
