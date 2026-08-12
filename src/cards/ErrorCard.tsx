import { h, type SatoriElement } from "../jsx.js";
import { resolveTheme } from "./theme.js";

export const ERROR_WIDTH = 540;
export const ERROR_HEIGHT = 160;

export function ErrorCard(message: string, themeName?: string): SatoriElement {
  const theme = resolveTheme(themeName);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "24px 28px",
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        fontFamily: "Inter",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", fontSize: 16, fontWeight: 700, color: "#fb7185" }}>
        HolidayLens error
      </div>
      <div style={{ display: "flex", fontSize: 14, color: theme.text, marginTop: 8 }}>
        {message}
      </div>
    </div>
  );
}
