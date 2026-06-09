import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Power } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recurringQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtKES } from "@/lib/finance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recurring")({
  head: () => ({ meta: [{ title: "Recurring — Wealth OS" }] }),
  component: RecurringPage,
});

function RecurringPage() {
  const qc = useQueryClient();
  const { data } = useQuery(recurringQuery());
  async function toggle(id: string, active: boolean) {
    const { error } = await supabase.from("recurring").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["recurring"] });
  }
  async function del(id: string) {
    const { error } = await supabase.from("recurring").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["recurring"] });
  }
  return (
    <div>
      <SectionHeading title="Recurring Transactions" sub="Auto-create income or expenses on a schedule." action={<AddRecurring />} />
      <div className="grid sm:grid-cols-2 gap-4">
        {(data ?? []).map((r) => (
          <div key={r.id} className="fintech-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.type} · {r.frequency}</div>
                <div className="font-semibold">{r.label}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(r.id, r.active)} title={r.active ? "Pause" : "Resume"} className={r.active ? "text-primary" : "text-muted-foreground"}><Power className="h-4 w-4" /></button>
                <button onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="metric-value text-2xl mt-2">{fmtKES(Number(r.amount))}</div>
            <div className="text-xs text-muted-foreground mt-1">Next: {new Date(r.next_run).toLocaleDateString()} {r.active ? "" : "· paused"}</div>
          </div>
        ))}
        {(!data || data.length === 0) && <p className="text-sm text-muted-foreground">No recurring entries yet.</p>}
      </div>
    </div>
  );
}

function AddRecurring() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "expense", amount: "", label: "", frequency: "monthly", next_run: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!Number(form.amount) || !form.label.trim()) return toast.error("Fill all fields");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("recurring").insert({
      user_id: u.user.id, type: form.type, amount: Number(form.amount), label: form.label, frequency: form.frequency, next_run: form.next_run, active: true,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Added"); setOpen(false); qc.invalidateQueries({ queryKey: ["recurring"] }); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add Recurring</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Recurring Entry</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Label ({form.type === "income" ? "Source" : "Category"})</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (KES)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><Label>Next run</Label><Input type="date" value={form.next_run} onChange={(e) => setForm({ ...form, next_run: e.target.value })} /></div>
          </div>
          <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}