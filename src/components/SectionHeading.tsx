import type { ReactNode } from "react";

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-5 sm:mb-6 flex-wrap">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-tight morph-in">{title}</h1>
        {sub && <p className="text-[0.8125rem] sm:text-sm text-muted-foreground mt-1">{sub}</p>}
      </div>
      {action}
    </div>
  );
}