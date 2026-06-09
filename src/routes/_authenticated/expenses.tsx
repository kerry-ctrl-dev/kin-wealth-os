import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, ReceiptText } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expensesQuery, incomeQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtKES } from "@/lib/finance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expenses — Wealth OS" }] }),
  component: ExpensesPage,
});

const CATS = ["Food", "Transport", "Rent", "Utilities", "Entertainment", "Health", "Shopping", "Education", "Other"];

function ExpensesPage() {
  const qc = useQueryClient();
  const { data: rows } = useQuery(expensesQuery());
  const { data: income } = useQuery(incomeQuery());
  const all = rows ?? [];
  const now = new Date();
  const monthRows = all.filter((r) => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthTotal = monthRows.reduce((s, r) => s + Number(r.amount), 0);
  const monthIncome = (income ?? []).filter((r) => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, r) => s + Number(r.amount), 0);
  const byCat = monthRows.reduce<Record<string, number>>((acc, r) => { acc[r.category] = (acc[r.category] ?? 0) + Number(r.amount); return acc; }, {});

  async function del(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["expenses"] }); }
  }

  return (
    <div>
      <SectionHeading title="Expenses" sub="Track spending and stay in control." action={<AddExpense />} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <MetricCard label="This Month" value={fmtKES(monthTotal)} icon={<ReceiptText className="h-4 w-4" />} />
        <MetricCard label="Net Cash Flow" value={fmtKES(monthIncome - monthTotal)} tone={monthIncome - monthTotal >= 0 ? "success" : "danger"} sub={`Income ${fmtKES(monthIncome)}`} />
        <MetricCard label="Top Category" value={Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"} sub={Object.entries(byCat).sort((a, b) => b[1] - a[1])[0] ? fmtKES(Object.entries(byCat).sort((a, b) => b[1] - a[1])[0][1]) : ""} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="fintech-card p-6 lg:col-span-2">
          <h2 className="font-semibold mb-3">Transactions</h2>
          <div className="divide-y divide-border">
            {all.map((r) => (
              <div key={r.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.category}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}{r.method ? ` · ${r.method}` : ""}{r.notes ? ` · ${r.notes}` : ""}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="metric-value">{fmtKES(Number(r.amount))}</div>
                  <button onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {all.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No expenses yet. Tap "Add Expense" to start.</p>}
          </div>
        </div>
        <div className="fintech-card p-6">
          <h2 className="font-semibold mb-3">By Category (this month)</h2>
          <div className="space-y-2">
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k}>
                <div className="flex items-center justify-between text-sm"><span>{k}</span><span className="metric-value text-muted-foreground">{fmtKES(v)}</span></div>
                <div className="h-1.5 rounded bg-muted overflow-hidden mt-1"><div className="h-full bg-primary" style={{ width: `${monthTotal ? (v / monthTotal) * 100 : 0}%` }} /></div>
              </div>
            ))}
            {!monthTotal && <p className="text-sm text-muted-foreground">No data yet this month.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddExpense() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "Food", method: "", notes: "", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  async function save() {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return toast.error("Amount must be > 0");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("expenses").insert({
      user_id: u.user.id, amount: amt, category: form.category, method: form.method || null, notes: form.notes || null, date: new Date(form.date).toISOString(),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Expense added"); setOpen(false); setForm({ amount: "", category: "Food", method: "", notes: "", date: new Date().toISOString().slice(0, 10) }); qc.invalidateQueries({ queryKey: ["expenses"] }); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Expense</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (KES)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Payment method (optional)</Label><Input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} placeholder="M-Pesa, Card, Cash…" /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}