export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

export function cardBase(): string {
  return API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
}

export interface StateInfo {
  code: string;
  name: string;
}

export interface LeavePlan {
  id: string;
  from: string;
  to: string;
  leavesUsed: number;
  weekends: number;
  holidays: number;
  totalOff: number;
  efficiency: number;
  leaveDates: string[];
  holidayNames: string[];
  label: string;
}

export interface OptimizeResult {
  state: string;
  year: number;
  leaves: number;
  weekend: string;
  coverage?: "state" | "national";
  plans: LeavePlan[];
}

export interface Holiday {
  date: string;
  name: string;
  type: string;
  scope: string;
  confidence?: string;
}

export interface HolidaysResult {
  state: string;
  year: number;
  holidays: Holiday[];
  source?: string;
  coverage?: "state" | "national";
}

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  return sp.toString();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok || (json && typeof json === "object" && "error" in json && json.error)) {
    throw new Error(
      json && typeof json === "object" && "error" in json && json.error
        ? String(json.error)
        : `Request failed (${res.status})`,
    );
  }
  return json;
}

export async function fetchStates(): Promise<{ states: StateInfo[]; years: number[] }> {
  return getJson("/api/states");
}

export async function fetchOptimize(input: {
  state: string;
  year: number;
  leaves: number;
  weekend: string;
  includeRestricted?: boolean;
  maxPlans?: number;
}): Promise<OptimizeResult> {
  const q = qs({
    state: input.state,
    year: input.year,
    leaves: input.leaves,
    weekend: input.weekend,
    include_restricted: input.includeRestricted ? "true" : undefined,
    max_plans: input.maxPlans ?? 8,
  });
  return getJson(`/api/optimize?${q}`);
}

export async function fetchHolidays(
  state: string,
  year: number,
  includeRestricted = false,
): Promise<HolidaysResult> {
  const q = qs({
    state,
    year,
    include_restricted: includeRestricted ? "true" : undefined,
  });
  return getJson(`/api/holidays?${q}`);
}

export function shareUrl(params: {
  state: string;
  year: number;
  leaves: number;
  plan?: string;
  theme?: string;
}): string {
  const q = qs({
    state: params.state,
    year: params.year,
    leaves: params.leaves,
    plan: params.plan,
    theme: params.theme ?? "toolwiz",
  });
  return `${cardBase()}/p?${q}`;
}

export function icsUrl(params: {
  state: string;
  year: number;
  leaves: number;
  plan?: string;
}): string {
  const q = qs({
    state: params.state,
    year: params.year,
    leaves: params.leaves,
    plan: params.plan,
  });
  return `${cardBase()}/api/ics?${q}`;
}

export function weekdayShort(iso: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[new Date(iso + "T00:00:00Z").getUTCDay()]!;
}

export function weekdayLetter(iso: string): string {
  return weekdayShort(iso).charAt(0);
}

export function fmtDay(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso + "T00:00:00Z");
  return `${weekdayShort(iso)} · ${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function fmtRange(from: string, to: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  const left = `${weekdayShort(from)} ${months[a.getUTCMonth()]} ${a.getUTCDate()}`;
  const right = `${weekdayShort(to)} ${months[b.getUTCMonth()]} ${b.getUTCDate()}, ${b.getUTCFullYear()}`;
  return `${left} – ${right}`;
}
