export interface Theme {
  bg: string;
  bg2: string;
  border: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  ring: string;
}

export const themes: Record<string, Theme> = {
  toolwiz: {
    bg: "#0a0f1e",
    bg2: "#151b33",
    border: "#273154",
    title: "#8f96ff",
    text: "#e7ecf6",
    muted: "#8695b6",
    accent: "#34e0b0",
    ring: "#2ee6d6",
  },
  dark: {
    bg: "#0d1117",
    bg2: "#161b22",
    border: "#30363d",
    title: "#58a6ff",
    text: "#c9d1d9",
    muted: "#8b949e",
    accent: "#39d353",
    ring: "#2ea043",
  },
  light: {
    bg: "#ffffff",
    bg2: "#f6f8fa",
    border: "#d0d7de",
    title: "#0969da",
    text: "#1f2328",
    muted: "#57606a",
    accent: "#2da44e",
    ring: "#2da44e",
  },
};

export function resolveTheme(name: string | undefined): Theme {
  return themes[(name ?? "toolwiz").toLowerCase()] ?? themes.toolwiz!;
}
