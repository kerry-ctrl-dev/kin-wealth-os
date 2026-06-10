import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Coins } from "lucide-react";
import { z } from "zod";
import { SectionHeading } from "@/components/SectionHeading";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { loansQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtKES } from "@/lib/finance";
import { loanOutstanding, totalLoansOutstanding } from "@/lib/balance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: "Loans — Wealth OS" }] }),
  component: LoansPage,
});

const Schema = z.object({
  lender: z.string().trim().min(1, "Lender required").max(120),
  principal: z.coerce.number().positive("Must be > 0").max(1_000_000_000),
  interest_rate: z.coerce.number().min(0).max(200),
  borrowed_at: z.string(),
  due_date: z.string().optional(),
  purpose: z.string().trim().min(1, "Purpose required").max(500),
  notes: z.string().trim().max(500).optional(),
});

const STATUSES = ["ACTIVE", "REPAID", "OVERDUE"] as const;

function LoansPage() {
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const { data } = useQuery(loansQuery());
  const rows = data ?? [];
  const outstanding = totalLoansOutstanding(rows);
  const active = rows.filter((l) => l.status === "ACTIVE").length;
  const overdue = rows.filter((l) => l.due_date && new Date(l.due_date) < new Date() && l.status !== "REPAID").length;

  async function setStatus(id: string, status: (typeof STATUSES)[number]) {
    const { error } = await supabase.from("loans").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["loans"] }); }
  }
  async function del(id: string) {
    const { error } = await supabase.from("loans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["loans"] }); }
  }

  return (
    <div>
      <SectionHeading title="Loans & Debt" sub="Track borrowed money — lender, amount, interest, deadline and how it's used." action={<AddDialog />} />

      <div className="fintech-card p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Loan tracking</div>
          <div className="text-xs text-muted-foreground">Toggle off to hide debt from your net-worth display.</div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Outstanding" value={fmtKES(outstanding)} tone={outstanding > 0 ? "warning" : "success"} icon={<Coins className="h-4 w-4" />} />
        <MetricCard label="Active loans" value={String(active)} />
        <MetricCard label="Overdue" value={String(overdue)} tone={overdue > 0 ? "danger" : undefined} />
        <MetricCard label="Total borrowed" value={fmtKES(rows.reduce((s, r) => s + Number(r.principal), 0))} />
      </div>

      <div className="fintech-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Lender</th>
              <th className="text-right p-3">Principal</th>
              <th className="text-right p-3">Rate</th>
              <th className="text-right p-3">Outstanding</th>
              <th className="text-left p-3">Due</th>
              <th className="text-left p-3">Purpose</th>
              <th className="text-left p-3">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/30">
                <td className="p-3 font-medium">{l.lender}<div className="text-[10px] text-muted-foreground">Borrowed {new Date(l.borrowed_at).toLocaleDateString()}</div></td>
                <td className="p-3 text-right metric-value">{fmtKES(Number(l.principal))}</td>
                <td className="p-3 text-right">{Number(l.interest_rate)}%</td>
                <td className="p-3 text-right metric-value">{fmtKES(loanOutstanding(l))}</td>
                <td className="p-3 text-xs">{l.due_date ? new Date(l.due_date).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-xs text-muted-foreground max-w-[180px] truncate">{l.purpose ?? "—"}</td>
                <td className="p-3">
                  <Select value={l.status} onValueChange={(v) => setStatus(l.id, v as (typeof STATUSES)[number])}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No loans recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    lender: "", principal: "", interest_rate: "0",
    borrowed_at: new Date().toISOString().slice(0, 10),
    due_date: "", purpose: "", notes: "",
  });
  const add = useMutation({
    mutationFn: async () => {
      const parsed = Schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("loans").insert({
        user_id: u.user!.id,
        lender: parsed.data.lender,
        principal: parsed.data.principal,
        interest_rate: parsed.data.interest_rate,
        borrowed_at: new Date(parsed.data.borrowed_at).toISOString(),
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date).toISOString() : null,
        purpose: parsed.data.purpose,
        notes: parsed.data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loan recorded");
      qc.invalidateQueries({ queryKey: ["loans"] });
      setOpen(false);
      setForm({ lender: "", principal: "", interest_rate: "0", borrowed_at: new Date().toISOString().slice(0, 10), due_date: "", purpose: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Record loan</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New loan</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Lender</Label><Input value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} placeholder="KCB, M-Shwari, John D…" /></div>
            <div><Label>Amount (KES)</Label><Input type="number" min={1} step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} /></div>
            <div><Label>Interest rate (% / yr)</Label><Input type="number" min={0} step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} /></div>
            <div><Label>Borrowed on</Label><Input type="date" value={form.borrowed_at} onChange={(e) => setForm({ ...form, borrowed_at: e.target.value })} /></div>
            <div><Label>Deadline</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <div><Label>How will this money be used?</Label><Textarea rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Rent, school fees, business stock…" /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end"><Button type="submit" disabled={add.isPending}>{add.isPending ? "Saving…" : "Record loan"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}