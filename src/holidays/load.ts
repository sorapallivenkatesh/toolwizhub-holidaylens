import type { Holiday, HolidayYearFile } from "../types.js";
import { HolidayLensError } from "../types.js";
import { assertState, hasStateOverlay } from "./states.js";

import national2026 from "../../data/holidays/national/2026.json";
import national2027 from "../../data/holidays/national/2027.json";
import ka2026 from "../../data/holidays/KA/2026.json";
import ka2027 from "../../data/holidays/KA/2027.json";
import mh2026 from "../../data/holidays/MH/2026.json";
import mh2027 from "../../data/holidays/MH/2027.json";
import dl2026 from "../../data/holidays/DL/2026.json";
import dl2027 from "../../data/holidays/DL/2027.json";
import tn2026 from "../../data/holidays/TN/2026.json";
import tn2027 from "../../data/holidays/TN/2027.json";
import ts2026 from "../../data/holidays/TS/2026.json";
import ts2027 from "../../data/holidays/TS/2027.json";

const NATIONAL: Record<number, HolidayYearFile> = {
  2026: national2026 as HolidayYearFile,
  2027: national2027 as HolidayYearFile,
};

const STATE: Record<string, Record<number, HolidayYearFile>> = {
  KA: { 2026: ka2026 as HolidayYearFile, 2027: ka2027 as HolidayYearFile },
  MH: { 2026: mh2026 as HolidayYearFile, 2027: mh2027 as HolidayYearFile },
  DL: { 2026: dl2026 as HolidayYearFile, 2027: dl2027 as HolidayYearFile },
  TN: { 2026: tn2026 as HolidayYearFile, 2027: tn2027 as HolidayYearFile },
  TS: { 2026: ts2026 as HolidayYearFile, 2027: ts2027 as HolidayYearFile },
};

export const SUPPORTED_YEARS = Object.keys(NATIONAL).map(Number).sort();

function mergeHolidays(base: Holiday[], extra: Holiday[]): Holiday[] {
  const map = new Map<string, Holiday>();
  for (const h of [...base, ...extra]) {
    const prev = map.get(h.date);
    // Prefer gazetted over restricted; keep first name if same date.
    if (!prev || (prev.type !== "gazetted" && h.type === "gazetted")) {
      map.set(h.date, h);
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function getHolidays(
  stateRaw: string,
  year: number,
  opts: { includeRestricted?: boolean } = {},
): {
  state: string;
  year: number;
  holidays: Holiday[];
  source: string;
  coverage: "state" | "national";
} {
  const state = assertState(stateRaw);
  const national = NATIONAL[year];
  if (!national) {
    throw new HolidayLensError(
      `No holiday data for year ${year}. Supported years: ${SUPPORTED_YEARS.join(", ")}.`,
      404,
    );
  }

  const overlay = STATE[state]?.[year];
  const coverage: "state" | "national" =
    overlay && hasStateOverlay(state) ? "state" : "national";

  let holidays = overlay
    ? mergeHolidays(national.holidays, overlay.holidays)
    : national.holidays.slice();

  if (!opts.includeRestricted) {
    holidays = holidays.filter((h) => h.type === "gazetted" || h.type === "bank");
  }

  return {
    state,
    year,
    holidays,
    source: overlay ? `${national.source} + ${overlay.source}` : national.source,
    coverage,
  };
}
