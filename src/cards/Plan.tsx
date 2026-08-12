import { h, type SatoriElement } from "../jsx.js";
import type { LeavePlan } from "../types.js";
import type { Theme } from "./theme.js";
import { fmtRange } from "./render.js";
import { CARD_FULL_W, CARD_H } from "./sizes.js";

export const PLAN_WIDTH = CARD_FULL_W;
export const PLAN_HEIGHT = CARD_H;

export function PlanCard(
  plan: LeavePlan,
  meta: { state: string; stateName: string; year: number },
  theme: Theme,
): SatoriElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "28px 36px",
        background: `linear-gradient(145deg, ${theme.bg} 0%, ${theme.bg2} 100%)`,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 5,
          borderRadius: 5,
          marginBottom: 18,
          background: `linear-gradient(90deg, ${theme.ring}, ${theme.title}, #ff5ca8)`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <div
          style={{
            display: "flex",
            fontSize: 13,
            fontWeight: 700,
            color: theme.ring,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {`HolidayLens · ${meta.stateName} · ${meta.year}`}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          fontWeight: 700,
          color: theme.title,
          letterSpacing: "-0.02em",
          marginBottom: 6,
        }}
      >
        {plan.label}
      </div>
      <div style={{ display: "flex", fontSize: 20, color: theme.muted, marginBottom: 22 }}>
        {fmtRange(plan.from, plan.to)}
      </div>
      <div style={{ display: "flex", width: "100%", gap: 14 }}>
        {statPill("Leaves used", String(plan.leavesUsed), theme.accent, theme)}
        {statPill("Total days off", String(plan.totalOff), theme.ring, theme)}
        {statPill("Efficiency", `${plan.efficiency}×`, theme.title, theme)}
        {statPill("Holidays", String(plan.holidays), "#ff5ca8", theme)}
      </div>
    </div>
  );
}

function statPill(label: string, value: string, color: string, theme: Theme): SatoriElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        padding: "14px 16px",
        borderRadius: 14,
        background: theme.bg2,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ display: "flex", fontSize: 13, color: theme.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}
