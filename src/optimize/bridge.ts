import type { LeavePlan, OptimizeInput, WeekendMode } from "../types.js";
import { HolidayLensError } from "../types.js";
import { getHolidays } from "../holidays/load.js";

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function daysInYear(year: number): number {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return (end - start) / 86_400_000;
}

function isWeekend(d: Date, mode: WeekendMode): boolean {
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  if (mode === "sun-only") return day === 0;
  return day === 0 || day === 6;
}

function planId(from: string, to: string, leaves: number): string {
  return `${from}_${to}_L${leaves}`;
}

/**
 * Find leave bridges: gaps of working days between off-blocks that can be
 * filled with ≤ available leaves to merge into one long break.
 */
export function optimizeLeaves(input: OptimizeInput): {
  state: string;
  year: number;
  leaves: number;
  weekend: WeekendMode;
  coverage: "state" | "national";
  plans: LeavePlan[];
} {
  if (!Number.isFinite(input.leaves) || input.leaves < 0 || input.leaves > 60) {
    throw new HolidayLensError("`leaves` must be an integer between 0 and 60.", 400);
  }
  const leavesBudget = Math.floor(input.leaves);

  const { state, year, holidays, coverage } = getHolidays(input.state, input.year, {
    includeRestricted: input.includeRestricted,
  });

  const holidayByDate = new Map(holidays.map((h) => [h.date, h]));
  const n = daysInYear(year);
  const start = parseISO(`${year}-01-01`);

  // off[i] = true if day i (0-based from Jan 1) is weekend or holiday
  const off: boolean[] = Array.from({ length: n }, (_, i) => {
    const d = addDays(start, i);
    const iso = toISO(d);
    return isWeekend(d, input.weekend) || holidayByDate.has(iso);
  });

  type Gap = { start: number; end: number; len: number }; // inclusive working-day indices
  const gaps: Gap[] = [];
  let i = 0;
  while (i < n) {
    while (i < n && off[i]) i += 1;
    if (i >= n) break;
    const gStart = i;
    while (i < n && !off[i]) i += 1;
    const gEnd = i - 1;
    gaps.push({ start: gStart, end: gEnd, len: gEnd - gStart + 1 });
  }

  const candidates: LeavePlan[] = [];

  for (const gap of gaps) {
    if (gap.len === 0 || gap.len > leavesBudget) continue;

    // Fill entire gap with leave → merge previous off-run + gap + next off-run
    let spanStart = gap.start;
    while (spanStart > 0 && off[spanStart - 1]) spanStart -= 1;
    let spanEnd = gap.end;
    while (spanEnd + 1 < n && off[spanEnd + 1]) spanEnd += 1;

    // Also allow partial fills: use k leaves (1..gap.len) at the edge that
    // maximizes merged span. For MVP, filling the whole gap is enough when
    // gap.len <= budget; additionally try filling from left/right subsets.
    const variants: { leaveIdx: number[] }[] = [];
    // full gap
    variants.push({
      leaveIdx: Array.from({ length: gap.len }, (_, k) => gap.start + k),
    });
    // take first k / last k days of the gap (often optimal for bridges)
    for (let k = 1; k < gap.len; k += 1) {
      variants.push({
        leaveIdx: Array.from({ length: k }, (_, j) => gap.start + j),
      });
      variants.push({
        leaveIdx: Array.from({ length: k }, (_, j) => gap.end - k + 1 + j),
      });
    }

    for (const v of variants) {
      if (v.leaveIdx.length > leavesBudget) continue;
      const taken = new Set(v.leaveIdx);
      let s = Math.min(...v.leaveIdx);
      let e = Math.max(...v.leaveIdx);
      while (s > 0 && (off[s - 1] || taken.has(s - 1))) s -= 1;
      while (e + 1 < n && (off[e + 1] || taken.has(e + 1))) e += 1;

      const from = toISO(addDays(start, s));
      const to = toISO(addDays(start, e));
      const leaveDates = v.leaveIdx.map((idx) => toISO(addDays(start, idx)));
      const totalOff = e - s + 1;
      const leavesUsed = leaveDates.length;
      if (leavesUsed === 0 || totalOff <= leavesUsed) continue; // no leverage

      let weekends = 0;
      let holidayCount = 0;
      const holidayNames: string[] = [];
      for (let d = s; d <= e; d += 1) {
        const iso = toISO(addDays(start, d));
        const dt = addDays(start, d);
        if (isWeekend(dt, input.weekend)) weekends += 1;
        const h = holidayByDate.get(iso);
        if (h) {
          holidayCount += 1;
          holidayNames.push(h.name);
        }
      }

      const efficiency = totalOff / leavesUsed;
      candidates.push({
        id: planId(from, to, leavesUsed),
        from,
        to,
        leavesUsed,
        weekends,
        holidays: holidayCount,
        totalOff,
        efficiency: Math.round(efficiency * 100) / 100,
        leaveDates,
        holidayNames: [...new Set(holidayNames)],
        label: `${leavesUsed} leave${leavesUsed === 1 ? "" : "s"} → ${totalOff}-day break`,
      });
    }
  }

  // Dedupe by from-to-leavesUsed; keep highest efficiency
  const best = new Map<string, LeavePlan>();
  for (const p of candidates) {
    const key = `${p.from}|${p.to}|${p.leavesUsed}`;
    const prev = best.get(key);
    if (!prev || p.efficiency > prev.efficiency || p.totalOff > prev.totalOff) {
      best.set(key, p);
    }
  }

  const plans = [...best.values()]
    .sort((a, b) => b.efficiency - a.efficiency || b.totalOff - a.totalOff || a.from.localeCompare(b.from))
    .slice(0, input.maxPlans);

  return { state, year, leaves: leavesBudget, weekend: input.weekend, coverage, plans };
}
