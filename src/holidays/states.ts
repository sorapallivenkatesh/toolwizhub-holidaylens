import type { StateInfo } from "../types.js";
import { HolidayLensError } from "../types.js";

/**
 * All Indian states + UTs (ISO 3166-2:IN-style codes).
 * Telangana kept as TS (legacy) — TG also accepted.
 * States without a data overlay use the national gazette calendar.
 */
export const STATES: StateInfo[] = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DH", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TS", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UT", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
].sort((a, b) => a.name.localeCompare(b.name));

/** Codes that currently ship a state holiday overlay. */
export const STATE_OVERLAY_CODES = new Set(["KA", "MH", "DL", "TN", "TS"]);

export const STATE_CODES = new Set(STATES.map((s) => s.code));

const ALIASES: Record<string, string> = {
  TG: "TS", // ISO Telangana → our TS
  CG: "CT", // common Chhattisgarh
  OD: "OR", // common Odisha
  UK: "UT", // common Uttarakhand
  DD: "DH", // old Daman & Diu
  DN: "DH", // old Dadra & Nagar Haveli
};

export function assertState(code: string): string {
  let c = code.trim().toUpperCase();
  c = ALIASES[c] ?? c;
  if (!STATE_CODES.has(c)) {
    throw new HolidayLensError(
      `Unknown state "${code}". Use a 2-letter India state/UT code (e.g. KA, MH, UP).`,
      400,
    );
  }
  return c;
}

export function hasStateOverlay(code: string): boolean {
  return STATE_OVERLAY_CODES.has(code);
}
