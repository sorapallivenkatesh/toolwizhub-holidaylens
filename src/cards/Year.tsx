import { h, type SatoriElement } from "../jsx.js";
import type { LeavePlan } from "../types.js";
import type { Theme } from "./theme.js";
import { fmtRange } from "./render.js";
import { CARD_FULL_W, CARD_H } from "./sizes.js";

export const YEAR_WIDTH = CARD_FULL_W;
export const YEAR_HEIGHT = CARD_H;

export function YearCard(
  plans: LeavePlan[],
  meta: { state: string; stateName: string; year: number; leaves: number },
  theme: Theme,
): SatoriElement {
  const top = plans.slice(0, 3);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "26px 34px",
        background: `linear-gradient(145deg, ${theme.bg} 0%, ${theme.bg2} 100%)`,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            color: theme.title,
            flexGrow: 1,
          }}
        >
          {`${meta.stateName} · Top bridges ${meta.year}`}
        </div>
        <div style={{ display: "flex", fontSize: 14, color: theme.muted }}>
          {`Budget: ${meta.leaves} leaves`}
        </div>
      </div>
      {top.length === 0 ? (
        <div style={{ display: "flex", color: theme.muted, fontSize: 16 }}>
          No bridges found for this leave budget.
        </div>
      ) : (
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
          {top.map((p, i) => row(p, i, theme))}
        </div>
      )}
    </div>
  );
}

function row(p: LeavePlan, i: number, theme: Theme): SatoriElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "32%",
        padding: "16px 18px",
        borderRadius: 14,
        background: theme.bg2,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 12, color: theme.ring, marginBottom: 6 }}>
        {`#${i + 1}`}
      </div>
      <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: theme.text }}>
        {p.label}
      </div>
      <div style={{ display: "flex", fontSize: 13, color: theme.muted, marginTop: 6 }}>
        {fmtRange(p.from, p.to)}
      </div>
      <div style={{ display: "flex", fontSize: 13, color: theme.accent, marginTop: 8 }}>
        {`${p.efficiency}× efficiency`}
      </div>
    </div>
  );
}
