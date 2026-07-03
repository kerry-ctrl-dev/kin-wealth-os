import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Wallet, BellRing, Target as TargetIcon } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { incomeQuery, remindersQuery, goalsQuery } from "@/lib/queries";
import { fmtKES } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — MalinGu" }] }),
  component: CalendarPage,
});

type Ev = { date: Date; kind: "income" | "reminder" | "goal"; label: string; sub?: string };

function CalendarPage() {
  const income = useQuery(incomeQuery());
  const reminders = useQuery(remindersQuery());
  const goals = useQuery(goalsQuery());
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const events: Ev[] = useMemo(() => {
    const out: Ev[] = [];
    for (const i of income.data ?? []) out.push({ date: new Date(i.date), kind: "income", label: i.source, sub: fmtKES(Number(i.amount)) });
    for (const r of reminders.data ?? []) out.push({ date: new Date(r.next_due), kind: "reminder", label: r.title, sub: r.frequency });
    for (const g of goals.data ?? []) if (g.deadline) out.push({ date: new Date(g.deadline), kind: "goal", label: `Goal: ${g.name}`, sub: fmtKES(Number(g.target)) });
    return out;
  }, [income.data, reminders.data, goals.data]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const monthEvents = events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === month);
  const dayEvents = (d: Date) => monthEvents.filter((e) => sameDay(e.date, d));

  return (
    <div className="space-y-6">
      <SectionHeading title="Financial Calendar" sub="Income entries, reminders, and goal deadlines" />

      <div className="fintech-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="text-center py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, idx) => (
            <div key={idx} className={`min-h-[72px] rounded-md border border-border p-1.5 text-xs ${d && sameDay(d, today) ? "bg-primary/10 border-primary/40" : "bg-background/30"}`}>
              {d && (
                <>
                  <div className="text-[10px] text-muted-foreground">{d.getDate()}</div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents(d).slice(0, 3).map((e, i) => (
                      <div key={i} className="truncate flex items-center gap-1">
                        {e.kind === "income" && <Wallet className="h-3 w-3 text-[color:var(--success)]" />}
                        {e.kind === "reminder" && <BellRing className="h-3 w-3 text-[color:var(--warning)]" />}
                        {e.kind === "goal" && <TargetIcon className="h-3 w-3 text-primary" />}
                        <span className="truncate">{e.label}</span>
                      </div>
                    ))}
                    {dayEvents(d).length > 3 && <div className="text-[10px] text-muted-foreground">+{dayEvents(d).length - 3} more</div>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fintech-card p-6">
        <h2 className="font-semibold mb-3">This month's events</h2>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events this month.</p>
        ) : (
          <ul className="divide-y divide-border">
            {monthEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).map((e, i) => (
              <li key={i} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {e.kind === "income" && <Wallet className="h-4 w-4 text-[color:var(--success)]" />}
                  {e.kind === "reminder" && <BellRing className="h-4 w-4 text-[color:var(--warning)]" />}
                  {e.kind === "goal" && <TargetIcon className="h-4 w-4 text-primary" />}
                  <span className="font-medium">{e.label}</span>
                  {e.sub && <span className="text-muted-foreground">· {e.sub}</span>}
                </div>
                <span className="text-muted-foreground">{e.date.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}