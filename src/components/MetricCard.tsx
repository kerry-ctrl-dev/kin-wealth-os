import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-[color:var(--success)]",
    warning: "text-[color:var(--warning)]",
    danger: "text-[color:var(--danger)]",
  }[tone];
  return (
    <div className="fintech-card relative flex flex-col gap-3 overflow-hidden p-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-50"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 10%, transparent), transparent)",
        }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={cn("relative metric-value text-3xl font-semibold sm:text-[2rem]", toneClass)}>
        {value}
      </div>
      {sub && <div className="relative text-xs leading-relaxed text-muted-foreground">{sub}</div>}
    </div>
  );
}
