import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Palette, Sun, Moon, Monitor } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACCENTS,
  CHART_PALETTES,
  DENSITY_LABEL,
  DEFAULT_RANGE_LABEL,
  FONT_SIZES,
  FONT_STACKS,
  applyAppearance,
  loadAppearance,
  saveAppearance,
  watchSystemTheme,
  type AccentKey,
  type Appearance,
  type ChartPaletteKey,
  type DefaultRangeKey,
  type DensityKey,
  type FontFamilyKey,
  type FontSizeKey,
  type ThemeMode,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/appearance")({
  head: () => ({ meta: [{ title: "Appearance — MalinGu" }] }),
  component: AppearancePage,
});

function AppearancePage() {
  const [a, setA] = useState<Appearance>(() => loadAppearance());

  useEffect(() => {
    applyAppearance(a);
    saveAppearance(a);
  }, [a]);

  useEffect(() => {
    if (a.theme !== "system") return;
    return watchSystemTheme(() => applyAppearance(a));
  }, [a]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <SectionHeading
        title="Appearance"
        sub="Customize the look, chart colors, widget density and dashboard defaults. Changes save automatically."
      />

      <Section title="Theme" icon={<Palette className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: "light", label: "Light", icon: Sun },
              { key: "dark", label: "Dark", icon: Moon },
              { key: "system", label: "System", icon: Monitor },
            ] as { key: ThemeMode; label: string; icon: typeof Sun }[]
          ).map((opt) => {
            const active = a.theme === opt.key;
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setA({ ...a, theme: opt.key })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/70 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Typography">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Font</Label>
            <Select value={a.font} onValueChange={(v: FontFamilyKey) => setA({ ...a, font: v })}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FONT_STACKS) as FontFamilyKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    <span style={{ fontFamily: FONT_STACKS[k].stack }}>{FONT_STACKS[k].label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Size</Label>
            <Select value={a.size} onValueChange={(v: FontSizeKey) => setA({ ...a, size: v })}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{FONT_SIZES[k].label} · {FONT_SIZES[k].px}px</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Accent color">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {(Object.keys(ACCENTS) as AccentKey[]).map((k) => {
            const ac = ACCENTS[k];
            const active = a.accent === k;
            return (
              <button
                key={k}
                type="button"
                title={ac.label}
                onClick={() => setA({ ...a, accent: k })}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-2xl border transition",
                  active
                    ? "border-foreground/70 ring-2 ring-offset-2 ring-offset-background"
                    : "border-border/70 hover:border-foreground/40",
                )}
                style={{ background: ac.swatch }}
              >
                {active && <Check className="h-4 w-4 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Chart palette" sub="Applied to donuts, area charts and analytics.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(CHART_PALETTES) as ChartPaletteKey[]).map((k) => {
            const p = CHART_PALETTES[k];
            const active = a.chartPalette === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setA({ ...a, chartPalette: k })}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border/70 hover:border-foreground/40",
                )}
              >
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="mt-2 flex gap-1">
                    {p.colors.map((c, i) => (
                      <span key={i} className="h-4 w-6 rounded" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Widget density" sub="Trade information density for breathing room.">
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(DENSITY_LABEL) as DensityKey[]).map((k) => {
            const active = a.density === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setA({ ...a, density: k })}
                className={cn(
                  "rounded-2xl border p-4 text-sm transition",
                  active ? "border-primary bg-primary/10" : "border-border/70 hover:border-foreground/40",
                )}
              >
                {DENSITY_LABEL[k]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Default dashboard range" sub="Time window pre-selected when you open the dashboard.">
        <Select
          value={a.defaultRange}
          onValueChange={(v: DefaultRangeKey) => {
            setA({ ...a, defaultRange: v });
            toast.success("Default range saved");
          }}
        >
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(DEFAULT_RANGE_LABEL) as DefaultRangeKey[]).map((k) => (
              <SelectItem key={k} value={k}>{DEFAULT_RANGE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>
    </div>
  );
}

function Section({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fintech-card space-y-4 p-6 sm:p-7">
      <div>
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          {icon} {title}
        </h2>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}