import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { goalsQuery } from "@/lib/queries";
import { fmtKES, monthlyNeeded } from "@/lib/finance";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — Wealth OS" }] }),
  component: GoalsPage,
});

const Schema = z.object({
  name: z.string().trim().min(1).max(80),
  target: z.coerce.number().positive().max(1_000_000_000),
  current: z.coerce.number().min(0).max(1_000_000_000).default(0),
  deadline: z.string().optional(),
});

function GoalsPage() {
  const qc = useQueryClient();
  const { data: goals } = useQuery(goalsQuery());
  const [form, setForm] = useState({ name: "", target: "", current: "0", deadline: "" });

  const add = useMutation({
    mutationFn: async (v: z.infer<typeof Schema>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("goals").insert({
        user_id: u.user!.id, name: v.name, target: v.target, current: v.current,
        deadline: v.deadline || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Goal added");
      qc.invalidateQueries({ queryKey: ["goals"] });
      setForm({ name: "", target: "", current: "0", deadline: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCurrent = useMutation({
    mutationFn: async (p: { id: string; current: number }) => {
      const { error } = await supabase.from("goals").update({ current: p.current }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Goal removed"); qc.invalidateQueries({ queryKey: ["goals"] }); },
  });

  return (
    <div>
      <SectionHeading title="Goals" sub="Set targets and get monthly contribution suggestions." />
      <form
        className="fintech-card p-5 grid sm:grid-cols-[1fr_140px_140px_160px_auto] gap-3 items-end mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = Schema.safeParse(form);
          if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
          add.mutate(parsed.data);
        }}
      >
        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="MacBook fund" /></div>
        <div className="space-y-2"><Label>Target (KES)</Label><Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="200000" /></div>
        <div className="space-y-2"><Label>Current</Label><Input type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} /></div>
        <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
        <Button type="submit" disabled={add.isPending}><Plus className="h-4 w-4" /> Add</Button>
      </form>
      <div className="grid sm:grid-cols-2 gap-4">
        {(goals ?? []).map((g) => {
          const pct = Math.min(100, (Number(g.current) / Number(g.target)) * 100);
          const monthly = monthlyNeeded(g);
          const done = pct >= 100;
          return (
            <div key={g.id} className="fintech-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold tracking-tight">{g.name}</h3>
                  <p className="text-xs text-muted-foreground">Target {fmtKES(Number(g.target))}{g.deadline ? ` · by ${new Date(g.deadline).toLocaleDateString()}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-4 space-y-2">
                <Progress value={pct} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{fmtKES(Number(g.current))} saved</span>
                  <span className="metric-value font-semibold">{pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{done ? "Goal reached 🎉" : `Suggested monthly: ${fmtKES(monthly)}`}</span>
                <Button size="sm" variant="secondary" disabled={done}
                  onClick={() => updateCurrent.mutate({ id: g.id, current: Number(g.current) + monthly })}>
                  Log contribution
                </Button>
              </div>
            </div>
          );
        })}
        {(goals ?? []).length === 0 && <div className="fintech-card p-6 text-sm text-muted-foreground">No goals yet — set your first target above.</div>}
      </div>
    </div>
  );
}