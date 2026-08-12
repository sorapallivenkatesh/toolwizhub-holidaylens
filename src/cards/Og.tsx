import { h, type SatoriElement } from "../jsx.js";
import type { LeavePlan } from "../types.js";
import type { Theme } from "./theme.js";
import { fmtRange } from "./render.js";
import { OG_HEIGHT, OG_WIDTH } from "./sizes.js";

export { OG_WIDTH, OG_HEIGHT };

export function OgCard(
  plan: LeavePlan,
  meta: { stateName: string; year: number },
  theme: Theme,
): SatoriElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "64px 72px",
        background: `linear-gradient(145deg, ${theme.bg} 0%, ${theme.bg2} 55%, ${theme.bg} 100%)`,
        border: `2px solid ${theme.border}`,
        borderRadius: 28,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 6,
          borderRadius: 6,
          background: `linear-gradient(90deg, ${theme.ring}, ${theme.title}, #ff5ca8)`,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 18,
          fontWeight: 700,
          color: theme.ring,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          marginTop: 36,
        }}
      >
        HolidayLens · Leave optimizer
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 700,
          color: theme.title,
          letterSpacing: "-0.02em",
          marginTop: 14,
        }}
      >
        {plan.label}
      </div>
      <div style={{ display: "flex", fontSize: 28, color: theme.muted, marginTop: 12 }}>
        {`${meta.stateName} · ${fmtRange(plan.from, plan.to)}`}
      </div>
      <div style={{ display: "flex", marginTop: "auto", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 22, color: theme.muted, flexGrow: 1 }}>
          holidaylens.toolwizhub.com
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: theme.accent }}>
          {`${plan.efficiency}× ROI`}
        </div>
      </div>
    </div>
  );
}
