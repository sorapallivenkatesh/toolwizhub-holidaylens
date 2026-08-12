import type { LeavePlan } from "./types.js";

/** Build a minimal .ics calendar for leave dates + break span. */
export function buildIcs(plan: LeavePlan, title: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ToolWizHub//HolidayLens//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  // All-day event covering the full break (DTEND exclusive)
  const endExclusive = nextDay(plan.to);
  lines.push(
    "BEGIN:VEVENT",
    `UID:holidaylens-${plan.id}@toolwizhub.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(plan.from)}`,
    `DTEND;VALUE=DATE:${compact(endExclusive)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(`${plan.label}. Leaves: ${plan.leaveDates.join(", ")}`)}`,
    "END:VEVENT",
  );

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function compact(iso: string): string {
  return iso.replace(/-/g, "");
}

function nextDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
