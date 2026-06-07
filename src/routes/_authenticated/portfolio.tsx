import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { assetsQuery } from "@/lib/queries";
import { byCategory, CATEGORY_LABEL, fmtKES, fmtPct, LIQUIDITY_SCORE, totalValue, type AssetCategory } from "@/lib/finance";
import { AllocationDonut } from "@/components/AllocationDonut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Investments — Wealth OS" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data: assets } = useQuery(assetsQuery());
  const a = assets ?? [];
  const total = totalValue(a);
  const cats = byCategory(a);
  const allocation = (Object.keys(cats) as AssetCategory[])
    .filter((c) => cats[c] > 0)
    .map((c) => ({ category: c, value: cats[c], pct: total ? (cats[c] / total) * 100 : 0 }));

  return (
    <div>
      <SectionHeading
        title="Investments"
        sub="All assets, categories, values and liquidity scores."
        action={<AddInvestmentDialog />}
      />
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="fintech-card p-6 lg:col-span-2">
          <h2 className="font-semibold tracking-tight mb-3">Category Totals</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {allocation.map((c) => (
              <div key={c.category} className="rounded-lg border border-border p-4 bg-background/40">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{CATEGORY_LABEL[c.category]}</div>
                <div className="metric-value text-2xl font-semibold mt-1">{fmtKES(c.value)}</div>
                <div className="text-xs text-muted-foreground mt-1">{fmtPct(c.pct)} of portfolio</div>
              </div>
            ))}
            {allocation.length === 0 && <p className="text-sm text-muted-foreground">No assets yet.</p>}
          </div>
        </div>
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-3">Distribution</h2>
          <AllocationDonut data={allocation} />
        </div>
      </div>
      <div className="fintech-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-3">Asset</th><th className="text-left p-3">Category</th>
              <th className="text-right p-3">Value</th><th className="text-right p-3">Liquidity</th>
              <th className="text-right p-3">% Portfolio</th><th className="text-left p-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {a.map((row) => (
              <tr key={row.id} className="hover:bg-secondary/30">
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 text-muted-foreground">{CATEGORY_LABEL[row.category as AssetCategory]}</td>
                <td className="p-3 text-right metric-value">{fmtKES(Number(row.value))}</td>
                <td className="p-3 text-right"><span className="inline-block px-2 py-0.5 rounded-full bg-secondary text-xs">{row.liquidity}/5</span></td>
                <td className="p-3 text-right">{fmtPct(total ? (Number(row.value) / total) * 100 : 0)}</td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(row.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {a.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No assets — add income to allocate automatically.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const InvestmentSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  category: z.enum(["MMF", "STOCKS", "REITS", "CASH", "REAL_ESTATE"]),
  value: z.coerce.number().positive("Amount must be > 0").max(1_000_000_000),
  payment_method: z.string().trim().max(60).optional(),
  transaction_code: z.string().trim().max(80).optional(),
  platform: z.string().trim().max(80).optional(),
  invested_at: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
  purpose: z.string().trim().max(120).optional(),
});

const CATEGORIES: AssetCategory[] = ["MMF", "STOCKS", "REITS", "CASH", "REAL_ESTATE"];
const PAYMENT_METHODS = ["M-Pesa", "Bank transfer", "Card", "Cash", "Other"];
const PURPOSES = ["Long-term growth", "Emergency fund", "Income/dividends", "Short-term savings", "Diversification"];

function AddInvestmentDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "STOCKS" as AssetCategory, value: "",
    payment_method: "M-Pesa", transaction_code: "", platform: "",
    invested_at: new Date().toISOString().slice(0, 10), notes: "", purpose: "Long-term growth",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  const add = useMutation({
    mutationFn: async () => {
      const parsed = InvestmentSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const row = {
        user_id: uid,
        name: parsed.data.name,
        category: parsed.data.category,
        value: parsed.data.value,
        liquidity: LIQUIDITY_SCORE[parsed.data.category],
        payment_method: parsed.data.payment_method || null,
        transaction_code: parsed.data.transaction_code || null,
        platform: parsed.data.platform || null,
        purpose: parsed.data.purpose || null,
        notes: parsed.data.notes || null,
        invested_at: parsed.data.invested_at ? new Date(parsed.data.invested_at).toISOString() : null,
      };
      const { error } = await supabase.from("assets").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Investment added");
      qc.invalidateQueries({ queryKey: ["assets"] });
      setOpen(false);
      setForm((f) => ({ ...f, name: "", value: "", transaction_code: "", platform: "", notes: "" }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> Add investment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New investment</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Investment name"><Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Safaricom Shares" /></Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Amount invested (KES)"><Input type="number" min={1} step="0.01" value={form.value} onChange={(e) => set("value")(e.target.value)} placeholder="5000" /></Field>
            <Field label="Date invested"><Input type="date" value={form.invested_at} onChange={(e) => set("invested_at")(e.target.value)} /></Field>
            <Field label="Payment method">
              <Select value={form.payment_method} onValueChange={(v) => set("payment_method")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Platform"><Input value={form.platform} onChange={(e) => set("platform")(e.target.value)} placeholder="Hisa, CIC, Acorn…" /></Field>
            <Field label="Transaction code"><Input value={form.transaction_code} onChange={(e) => set("transaction_code")(e.target.value)} placeholder="QFG3X8R…" /></Field>
            <Field label="Purpose">
              <Select value={form.purpose} onValueChange={(v) => set("purpose")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Optional context…" /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save investment"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>{children}</div>;
}