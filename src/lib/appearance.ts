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

export interface Appearance {
  theme: ThemeMode;
  font: FontFamilyKey;
  size: FontSizeKey;
  accent: AccentKey;
}

const KEY = "malingu:appearance";

export const DEFAULT_APPEARANCE: Appearance = {
  theme: "system",
  font: "system",
  size: "md",
  accent: "blue",
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
)};var mode=a.theme;var resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;var r=document.documentElement;r.classList.toggle('dark',resolved==='dark');r.dataset.theme=resolved;var acc=accents[a.accent]||accents.blue;var v=resolved==='dark'?acc.dark:acc.light;r.style.setProperty('--primary','oklch('+v+')');r.style.setProperty('--accent','oklch('+v+')');r.style.setProperty('--ring','oklch('+v+')');r.style.setProperty('--sidebar-primary','oklch('+v+')');r.style.setProperty('--sidebar-ring','oklch('+v+')');r.style.setProperty('--chart-1','oklch('+v+')');var f=fonts[a.font]||fonts.system;r.style.setProperty('--app-font',f.stack);var s=sizes[a.size]||sizes.md;r.style.fontSize=s.px+'px';}catch(e){}})();`;

export function watchSystemTheme(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => cb();
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}