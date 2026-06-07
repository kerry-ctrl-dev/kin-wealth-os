import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { remindersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, BellRing, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({ meta: [{ title: "Reminders — Wealth OS" }] }),
  component: RemindersPage,
});

const KINDS = ["INVEST", "BILL", "GOAL", "REVIEW", "EMERGENCY", "DIVIDEND", "GENERAL"];
const FREQUENCIES = ["ONCE", "DAILY", "WEEKLY", "MONTHLY"];

function RemindersPage() {
  const qc = useQueryClient();
  const { data } = useQuery(remindersQuery());
  const rows = data ?? [];
  const [form, setForm] = useState({
    title: "", kind: "INVEST", frequency: "MONTHLY",
    next_due: new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title required");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("reminders").insert({
        user_id: u.user!.id,
        title: form.title.trim(),
        kind: form.kind,
        frequency: form.frequency,
        next_due: new Date(form.next_due).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reminder set");
      setForm((f) => ({ ...f, title: "" }));
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (r: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("reminders").update({ completed: !r.completed }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const upcoming = rows.filter((r) => !r.completed).sort((a, b) => +new Date(a.next_due) - +new Date(b.next_due));
  const done = rows.filter((r) => r.completed);
  const completionPct = rows.length ? Math.round((done.length / rows.length) * 100) : 0;

  return (
    <div>
      <SectionHeading
        title="Reminders"
        sub="Stay disciplined: investing, bills, goal check-ins, dividends and portfolio reviews."
      />
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="fintech-card p-5 lg:col-span-2">
          <form
            className="grid sm:grid-cols-[1fr_140px_140px_160px_auto] gap-3 items-end"
            onSubmit={(e) => { e.preventDefault(); add.mutate(); }}
          >
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Invest in MMF" /></Field>
            <Field label="Kind">
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Frequency">
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Next due"><Input type="date" value={form.next_due} onChange={(e) => setForm({ ...form, next_due: e.target.value })} /></Field>
            <Button type="submit" disabled={add.isPending}><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </div>
        <div className="fintech-card p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Completion rate</div>
          <div className="metric-value text-3xl font-semibold mt-1">{completionPct}%</div>
          <div className="text-xs text-muted-foreground">{done.length} of {rows.length} completed</div>
        </div>
      </div>

      <div className="fintech-card p-5">
        <h2 className="font-semibold tracking-tight mb-3 flex items-center gap-2"><BellRing className="h-4 w-4" /> Upcoming</h2>
        <div className="divide-y divide-border">
          {upcoming.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox checked={r.completed} onCheckedChange={() => toggle.mutate({ id: r.id, completed: r.completed })} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2"><CalendarClock className="h-3 w-3" /> {new Date(r.next_due).toLocaleDateString()} · {r.kind} · {r.frequency}</div>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No upcoming reminders.</p>}
        </div>
        {done.length > 0 && (
          <>
            <h3 className="font-semibold tracking-tight mt-6 mb-2 text-sm text-muted-foreground uppercase tracking-widest">Completed</h3>
            <div className="divide-y divide-border">
              {done.map((r) => (
                <div key={r.id} className="py-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Checkbox checked onCheckedChange={() => toggle.mutate({ id: r.id, completed: r.completed })} />
                    <span className="line-through text-muted-foreground">{r.title}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>{children}</div>;
}