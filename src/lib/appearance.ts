// Client-side appearance preferences (theme, font, size, accent color).
// Persisted to localStorage and applied to the <html> element.

export type ThemeMode = "light" | "dark" | "system";
export type FontFamilyKey = "system" | "inter" | "poppins" | "dm-sans" | "space-grotesk" | "roboto";
export type FontSizeKey = "sm" | "md" | "lg" | "xl";
export type AccentKey =
  | "blue"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "teal"
  | "orange"
  | "slate";
export type ChartPaletteKey = "default" | "ocean" | "sunset" | "forest" | "mono";
export type DensityKey = "compact" | "comfortable" | "spacious";
export type DefaultRangeKey = "7D" | "30D" | "90D" | "ALL";

export interface Appearance {
  theme: ThemeMode;
  font: FontFamilyKey;
  size: FontSizeKey;
  accent: AccentKey;
  chartPalette: ChartPaletteKey;
  density: DensityKey;
  defaultRange: DefaultRangeKey;
}

const KEY = "malingu:appearance";

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "system",
  font: "system",
  size: "md",
  accent: "blue",
  chartPalette: "default",
  density: "comfortable",
  defaultRange: "30D",
};

export const FONT_STACKS: Record<FontFamilyKey, { label: string; stack: string }> = {
  system:
    { label: "System", stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  inter: { label: "Inter", stack: "'Inter', system-ui, sans-serif" },
  poppins: { label: "Poppins", stack: "'Poppins', system-ui, sans-serif" },
  "dm-sans": { label: "DM Sans", stack: "'DM Sans', system-ui, sans-serif" },
  "space-grotesk": { label: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif" },
  roboto: { label: "Roboto", stack: "'Roboto', system-ui, sans-serif" },
};

export const FONT_SIZES: Record<FontSizeKey, { label: string; px: number }> = {
  sm: { label: "Small", px: 14 },
  md: { label: "Medium", px: 16 },
  lg: { label: "Large", px: 18 },
  xl: { label: "Extra Large", px: 20 },
};

// oklch tokens for primary + ring in light / dark
export const ACCENTS: Record<
  AccentKey,
  { label: string; swatch: string; light: string; dark: string }
> = {
  blue: { label: "Ocean Blue", swatch: "#3b82f6", light: "0.58 0.14 250", dark: "0.7 0.16 250" },
  emerald: { label: "Emerald", swatch: "#10b981", light: "0.6 0.15 155", dark: "0.72 0.16 155" },
  violet: { label: "Violet", swatch: "#8b5cf6", light: "0.55 0.2 290", dark: "0.7 0.18 290" },
  rose: { label: "Rose", swatch: "#f43f5e", light: "0.62 0.2 15", dark: "0.72 0.2 15" },
  amber: { label: "Amber", swatch: "#f59e0b", light: "0.7 0.16 70", dark: "0.78 0.16 70" },
  teal: { label: "Teal", swatch: "#14b8a6", light: "0.62 0.13 190", dark: "0.72 0.13 190" },
  orange: { label: "Sunset", swatch: "#f97316", light: "0.65 0.18 45", dark: "0.74 0.18 45" },
  slate: { label: "Slate", swatch: "#475569", light: "0.4 0.03 250", dark: "0.7 0.02 250" },
};

export const CHART_PALETTES: Record<ChartPaletteKey, { label: string; colors: string[] }> = {
  default: { label: "Default", colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"] },
  ocean:   { label: "Ocean",   colors: ["#0ea5e9", "#22d3ee", "#6366f1", "#14b8a6", "#3b82f6"] },
  sunset:  { label: "Sunset",  colors: ["#f97316", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"] },
  forest:  { label: "Forest",  colors: ["#10b981", "#84cc16", "#65a30d", "#0d9488", "#14532d"] },
  mono:    { label: "Mono",    colors: ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#334155"] },
};

export const DENSITY_LABEL: Record<DensityKey, string> = {
  compact: "Compact",
  comfortable: "Comfortable",
  spacious: "Spacious",
};

export const DEFAULT_RANGE_LABEL: Record<DefaultRangeKey, string> = {
  "7D": "Last 7 days",
  "30D": "Last 30 days",
  "90D": "Last 90 days",
  ALL: "All time",
};

export function loadAppearance(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    const parsed = JSON.parse(raw) as Partial<Appearance>;
    return { ...DEFAULT_APPEARANCE, ...parsed };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(next: Appearance) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyAppearance(a: Appearance) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = resolveTheme(a.theme);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;

  const accent = ACCENTS[a.accent] ?? ACCENTS.blue;
  const val = resolved === "dark" ? accent.dark : accent.light;
  root.style.setProperty("--primary", `oklch(${val})`);
  root.style.setProperty("--accent", `oklch(${val})`);
  root.style.setProperty("--ring", `oklch(${val})`);
  root.style.setProperty("--sidebar-primary", `oklch(${val})`);
  root.style.setProperty("--sidebar-ring", `oklch(${val})`);
  root.style.setProperty("--chart-1", `oklch(${val})`);

  const font = FONT_STACKS[a.font] ?? FONT_STACKS.system;
  root.style.setProperty("--app-font", font.stack);

  const size = FONT_SIZES[a.size] ?? FONT_SIZES.md;
  root.style.fontSize = `${size.px}px`;

  // Chart palette — overrides --chart-1..5 (accent overrides --chart-1 above, so
  // apply palette after only when user picked a non-default palette).
  const palette = CHART_PALETTES[a.chartPalette] ?? CHART_PALETTES.default;
  if (a.chartPalette !== "default") {
    palette.colors.forEach((c, i) => root.style.setProperty(`--chart-${i + 1}`, c));
  } else {
    // Reset chart-2..5 to defaults defined in styles.css by removing overrides
    for (let i = 2; i <= 5; i++) root.style.removeProperty(`--chart-${i}`);
  }

  // Widget density
  root.dataset.density = a.density;
}

// Serialized inline script that runs before hydration to prevent theme flash.
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
  KEY,
)});var a=raw?JSON.parse(raw):null;a=Object.assign(${JSON.stringify(
  DEFAULT_APPEARANCE,
)},a||{});var accents=${JSON.stringify(
  ACCENTS,
)};var fonts=${JSON.stringify(FONT_STACKS)};var sizes=${JSON.stringify(
  FONT_SIZES,
)};var palettes=${JSON.stringify(
  CHART_PALETTES,
)};var mode=a.theme;var resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;var r=document.documentElement;r.classList.toggle('dark',resolved==='dark');r.dataset.theme=resolved;var acc=accents[a.accent]||accents.blue;var v=resolved==='dark'?acc.dark:acc.light;r.style.setProperty('--primary','oklch('+v+')');r.style.setProperty('--accent','oklch('+v+')');r.style.setProperty('--ring','oklch('+v+')');r.style.setProperty('--sidebar-primary','oklch('+v+')');r.style.setProperty('--sidebar-ring','oklch('+v+')');r.style.setProperty('--chart-1','oklch('+v+')');var f=fonts[a.font]||fonts.system;r.style.setProperty('--app-font',f.stack);var s=sizes[a.size]||sizes.md;r.style.fontSize=s.px+'px';var p=palettes[a.chartPalette]||palettes.default;if(a.chartPalette!=='default'){p.colors.forEach(function(c,i){r.style.setProperty('--chart-'+(i+1),c);});}r.dataset.density=a.density||'comfortable';}catch(e){}})();`;

export function watchSystemTheme(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => cb();
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}