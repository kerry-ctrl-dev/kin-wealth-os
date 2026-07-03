import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Coins, ArrowDownLeft, ArrowUpRight, FileDown } from "lucide-react";
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
import { loanOutstanding, totalLoansOutstanding, totalLoansReceivable } from "@/lib/balance";
import { toast } from "sonner";
import { exportLoanReportPDF, defaultReminderMessage } from "@/lib/loan-report";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: "Loans — MalinGu" }] }),
  component: LoansPage,
});

const Schema = z.object({
  direction: z.enum(["BORROWED", "LENT"]),
  lender: z.string().trim().min(1, "Lender required").max(120),
  principal: z.coerce.number().positive("Must be > 0").max(1_000_000_000),
  interest_rate: z.coerce.number().min(0).max(200),
  interest_period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  borrowed_at: z.string(),
  due_date: z.string().optional(),
  purpose: z.string().trim().min(1, "Purpose required").max(500),
  notes: z.string().trim().max(500).optional(),
  contact_phone: z.string().trim().max(40).optional(),
  contact_email: z.string().trim().max(160).optional(),
  contact_alt: z.string().trim().max(120).optional(),
  payment_instructions: z.string().trim().max(500).optional(),
  reminder_message: z.string().trim().max(1000).optional(),
});

const STATUSES = ["ACTIVE", "REPAID", "OVERDUE"] as const;
const PERIODS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
const PERIOD_LABEL: Record<(typeof PERIODS)[number], string> = {
  DAILY: "per day",
  WEEKLY: "per week",
  MONTHLY: "per month",
  YEARLY: "per year",
};

function LoansPage() {
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(true);
  const { data } = useQuery(loansQuery());
  const rows = data ?? [];
  const outstanding = totalLoansOutstanding(rows);
  const receivable = totalLoansReceivable(rows);
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

  const lentRows = rows.filter((l) => l.direction === "LENT");

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
        <MetricCard label="You owe (debt)" value={fmtKES(outstanding)} tone={outstanding > 0 ? "warning" : "success"} icon={<ArrowDownLeft className="h-4 w-4" />} />
        <MetricCard label="Owed to you" value={fmtKES(receivable)} tone={receivable > 0 ? "success" : undefined} icon={<ArrowUpRight className="h-4 w-4" />} />
        <MetricCard label="Overdue" value={String(overdue)} tone={overdue > 0 ? "danger" : undefined} />
        <MetricCard label="Active records" value={String(active)} icon={<Coins className="h-4 w-4" />} />
      </div>

      <div className="fintech-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Counterparty</th>
              <th className="text-right p-3">Principal</th>
              <th className="text-right p-3">Rate</th>
              <th className="text-left p-3">Period</th>
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
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.direction === "LENT" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"}`}>
                    {l.direction === "LENT" ? <><ArrowUpRight className="h-3 w-3" /> Lent</> : <><ArrowDownLeft className="h-3 w-3" /> Borrowed</>}
                  </span>
                </td>
                <td className="p-3 font-medium">{l.lender}<div className="text-[10px] text-muted-foreground">{l.direction === "LENT" ? "Given out" : "Borrowed"} {new Date(l.borrowed_at).toLocaleDateString()}</div></td>
                <td className="p-3 text-right metric-value">{fmtKES(Number(l.principal))}</td>
                <td className="p-3 text-right">{Number(l.interest_rate)}%</td>
                <td className="p-3 text-xs text-muted-foreground">{PERIOD_LABEL[(((l as unknown as { interest_period?: string }).interest_period ?? "MONTHLY") as (typeof PERIODS)[number])]}</td>
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
            {rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No loans recorded.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Loanee reports (lent money) */}
      <div className="mt-8">
        <SectionHeading title="Loanee reports" sub="Generate a printable statement for each person who owes you — contact details, terms, payment instructions and a kind note." />
        {lentRows.length === 0 ? (
          <div className="fintech-card p-6 text-sm text-muted-foreground">No lent loans yet. Add a loan with direction “I lent” to generate a report.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {lentRows.map((l) => {
              const phone = (l as unknown as { contact_phone?: string }).contact_phone;
              const email = (l as unknown as { contact_email?: string }).contact_email;
              return (
                <div key={l.id} className="fintech-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{l.lender}</div>
                      <div className="text-xs text-muted-foreground">
                        Lent {fmtKES(Number(l.principal))} · Outstanding{" "}
                        <span className="text-foreground metric-value">{fmtKES(loanOutstanding(l))}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {phone ? `📞 ${phone}` : "No phone"} {email ? ` · ✉️ ${email}` : ""}
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => exportLoanReportPDF(l)}>
                      <FileDown className="h-4 w-4" /> Report
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AddDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    direction: "BORROWED" as "BORROWED" | "LENT",
    lender: "", principal: "", interest_rate: "0",
    interest_period: "MONTHLY" as (typeof PERIODS)[number],
    borrowed_at: new Date().toISOString().slice(0, 10),
    due_date: "", purpose: "", notes: "",
    contact_phone: "", contact_email: "", contact_alt: "",
    payment_instructions: "", reminder_message: "",
  });
  const add = useMutation({
    mutationFn: async () => {
      const parsed = Schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("loans").insert({
        user_id: u.user!.id,
        direction: parsed.data.direction,
        lender: parsed.data.lender,
        principal: parsed.data.principal,
        interest_rate: parsed.data.interest_rate,
        interest_period: parsed.data.interest_period,
        borrowed_at: new Date(parsed.data.borrowed_at).toISOString(),
        due_date: parsed.data.due_date ? new Date(parsed.data.due_date).toISOString() : null,
        purpose: parsed.data.purpose,
        notes: parsed.data.notes || null,
        contact_phone: parsed.data.contact_phone || null,
        contact_email: parsed.data.contact_email || null,
        contact_alt: parsed.data.contact_alt || null,
        payment_instructions: parsed.data.payment_instructions || null,
        reminder_message: (parsed.data.reminder_message || defaultReminderMessage(parsed.data.lender)),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recorded");
      qc.invalidateQueries({ queryKey: ["loans"] });
      setOpen(false);
      setForm({ direction: "BORROWED", lender: "", principal: "", interest_rate: "0", interest_period: "MONTHLY", borrowed_at: new Date().toISOString().slice(0, 10), due_date: "", purpose: "", notes: "", contact_phone: "", contact_email: "", contact_alt: "", payment_instructions: "", reminder_message: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Record loan</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New loan record</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <div>
            <Label>Direction</Label>
            <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as "BORROWED" | "LENT" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BORROWED">I borrowed (someone lent me money)</SelectItem>
                <SelectItem value="LENT">I lent (someone owes me money)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{form.direction === "LENT" ? "Borrower (who owes you)" : "Lender (who you owe)"}</Label><Input value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} placeholder={form.direction === "LENT" ? "John D, Mary…" : "KCB, M-Shwari, John D…"} /></div>
            <div><Label>Amount (KES)</Label><Input type="number" min={1} step="0.01" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} /></div>
            <div><Label>Interest rate (%)</Label><Input type="number" min={0} step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} /></div>
            <div>
              <Label>Interest period</Label>
              <Select value={form.interest_period} onValueChange={(v) => setForm({ ...form, interest_period: v as (typeof PERIODS)[number] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()} ({PERIOD_LABEL[p]})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{form.direction === "LENT" ? "Lent on" : "Borrowed on"}</Label><Input type="date" value={form.borrowed_at} onChange={(e) => setForm({ ...form, borrowed_at: e.target.value })} /></div>
            <div><Label>Deadline</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          {form.direction === "LENT" && (
            <div className="rounded-lg border border-border bg-secondary/20 p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Loanee contact & payment (for reports)</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone number</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+254 7…" /></div>
                <div><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="loanee@example.com" /></div>
                <div className="col-span-2"><Label>Alternative contact</Label><Input value={form.contact_alt} onChange={(e) => setForm({ ...form, contact_alt: e.target.value })} placeholder="Next of kin, WhatsApp, workplace…" /></div>
              </div>
              <div>
                <Label>Your payment details (how they should pay you)</Label>
                <Textarea rows={2} value={form.payment_instructions} onChange={(e) => setForm({ ...form, payment_instructions: e.target.value })} placeholder="M-Pesa: 07XX XXX XXX (Name)&#10;Bank: KCB · 1234567890 · Account Name" />
              </div>
              <div>
                <Label>Kind message to the loanee</Label>
                <Textarea rows={3} value={form.reminder_message} onChange={(e) => setForm({ ...form, reminder_message: e.target.value })} placeholder={defaultReminderMessage(form.lender || "friend")} />
              </div>
            </div>
          )}
          <div><Label>{form.direction === "LENT" ? "What is the money for?" : "How will this money be used?"}</Label><Textarea rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Rent, school fees, business stock…" /></div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end"><Button type="submit" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save record"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}