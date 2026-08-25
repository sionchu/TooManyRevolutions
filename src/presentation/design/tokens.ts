export const TMR_DESIGN_TOKENS = {
  colors: {
    ink: "#27211d",
    inkMuted: "#6f6255",
    parchment: "#eee2cb",
    paper: "#fbf5e8",
    paperDeep: "#dfceb0",
    oxblood: "#873d38",
    crimson: "#b34b43",
    indigo: "#405879",
    brass: "#b58b3f",
    moss: "#65745d",
    water: "#b8c6c4",
    white: "#fffaf0",
  },
  spacing: {
    xs: "0.35rem",
    sm: "0.6rem",
    md: "0.9rem",
    lg: "1.25rem",
    xl: "1.75rem",
    xxl: "2.5rem",
  },
  radii: {
    sharp: "2px",
    card: "8px",
    pill: "999px",
  },
  typography: {
    display: 'Georgia, "Noto Serif KR", serif',
    body: '"Noto Sans KR", "Segoe UI", system-ui, sans-serif',
    mono: '"Cascadia Mono", Consolas, monospace',
  },
  breakpoints: {
    mobile: "767px",
    tablet: "1023px",
    laptop: "1439px",
    wide: "1440px",
  },
} as const;

export type TmrDesignTokens = typeof TMR_DESIGN_TOKENS;
