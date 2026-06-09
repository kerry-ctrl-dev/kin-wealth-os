import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { budgetsQuery, expensesQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtKES } from "@/lib/finance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Wealth OS" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const qc = useQueryClient();
  const { data: budgets } = useQuery(budgetsQuery());
  const { data: expenses } = useQuery(expensesQuery());
  const now = new Date();
  const monthSpend = (expenses ?? []).filter((r) => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce<Record<string, number>>((acc, r) => { acc[r.category] = (acc[r.category] ?? 0) + Number(r.amount); return acc; }, {});

  async function del(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["budgets"] }); }
  }

  return (
    <div>
      <SectionHeading title="Budgets" sub="Set a monthly cap per category and track burn rate." action={<AddBudget />} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(budgets ?? []).map((b) => {
          const spent = monthSpend[b.category] ?? 0;
          const pct = Math.min(100, (spent / Number(b.monthly_limit)) * 100);
          const over = spent > Number(b.monthly_limit);
          return (
            <div key={b.id} className="fintech-card p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{b.category}</div>
                <button onClick={() => del(b.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="metric-value text-2xl mt-2">{fmtKES(spent)} <span className="text-sm text-muted-foreground">/ {fmtKES(Number(b.monthly_limit))}</span></div>
              <div className="h-2 rounded bg-muted overflow-hidden mt-2"><div className="h-full" style={{ width: `${pct}%`, background: over ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--success)" }} /></div>
              <div className="text-xs mt-2" style={{ color: over ? "var(--danger)" : "var(--muted-foreground)" }}>
                {over ? `Over budget by ${fmtKES(spent - Number(b.monthly_limit))}` : `${(100 - pct).toFixed(0)}% remaining`}
              </div>
            </div>
          );
        })}
        {(!budgets || budgets.length === 0) && <p className="text-sm text-muted-foreground">No budgets yet. Add one to start tracking.</p>}
      </div>
    </div>
  );
}

function AddBudget() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!category.trim() || !Number(limit)) return toast.error("Fill all fields");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("budgets").upsert({ user_id: u.user.id, category: category.trim(), monthly_limit: Number(limit) }, { onConflict: "user_id,category" });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Budget saved"); setOpen(false); setCategory(""); setLimit(""); qc.invalidateQueries({ queryKey: ["budgets"] }); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Budget</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Budget</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Food, Transport, …" /></div>
          <div><Label>Monthly limit (KES)</Label><Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
          <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}