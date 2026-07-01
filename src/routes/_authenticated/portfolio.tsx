import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SectionHeading } from "@/components/SectionHeading";
import { assetsQuery, incomeQuery, expensesQuery } from "@/lib/queries";
import { byCategory, CATEGORY_LABEL, fmtKES, fmtPct, LIQUIDITY_SCORE, totalValue, type AssetCategory } from "@/lib/finance";
import { incomeBalances, totalAvailableCash } from "@/lib/balance";
import { MMF_OPTIONS, NSE_OPTIONS, REIT_OPTIONS, PAYMENT_METHODS } from "@/lib/instruments";
import { AllocationDonut } from "@/components/AllocationDonut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Investments — Wealth OS" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const qc = useQueryClient();
  const { data: assets } = useQuery(assetsQuery());
  const a = assets ?? [];
  const total = totalValue(a);
  const cats = byCategory(a);
  const allocation = (Object.keys(cats) as AssetCategory[])
    .filter((c) => cats[c] > 0)
    .map((c) => ({ category: c, value: cats[c], pct: total ? (cats[c] / total) * 100 : 0 }));

  async function del(id: string) {
    if (!confirm("Delete this investment? This cannot be undone.")) return;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Investment deleted"); qc.invalidateQueries({ queryKey: ["assets"] }); }
  }

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
              <th className="w-10" />
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
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={() => del(row.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {a.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No assets — add income to allocate automatically.</td></tr>}
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
  source_income_id: z.string().uuid().optional().or(z.literal("")),
});

const CATEGORIES: AssetCategory[] = ["MMF", "STOCKS", "REITS", "CASH", "REAL_ESTATE"];
const PURPOSES = ["Long-term growth", "Emergency fund", "Income/dividends", "Short-term savings", "Diversification"];

function AddInvestmentDialog() {
  const qc = useQueryClient();
  const { data: income } = useQuery(incomeQuery());
  const { data: expenses } = useQuery(expensesQuery());
  const { data: existingAssets } = useQuery(assetsQuery());
  const balances = incomeBalances(income ?? [], existingAssets ?? [], expenses ?? []);
  const available = totalAvailableCash(income ?? [], existingAssets ?? [], expenses ?? []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "STOCKS" as AssetCategory, value: "",
    payment_method: "M-Pesa", transaction_code: "", platform: "",
    invested_at: new Date().toISOString().slice(0, 10), notes: "", purpose: "Long-term growth",
    source_income_id: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v as never }));

  const suggestions =
    form.category === "MMF" ? MMF_OPTIONS :
    form.category === "STOCKS" ? NSE_OPTIONS :
    form.category === "REITS" ? REIT_OPTIONS : [];
  const categoryNameLabel =
    form.category === "MMF" ? "Which MMF?" :
    form.category === "STOCKS" ? "Which NSE stock?" :
    form.category === "REITS" ? "Which REIT?" : "Investment name";
  const categoryHint =
    form.category === "MMF" ? "Kenyan MMFs: CIC, Sanlam, Britam, NCBA, ICEA, Old Mutual, Cytonn, Etica, Zimele…" :
    form.category === "STOCKS" ? "NSE picks: SCOM, EQTY, KCB, COOP, EABL, ABSA, KEGN, BAT…" :
    form.category === "REITS" ? "Available REITs: ILAM Fahari, Acorn ASA D-REIT & I-REIT, LAPTrust Imara, Vuka." :
    form.category === "CASH" ? "Cash: bank savings, M-Pesa, cash on hand." :
    "Real estate: land, rental unit, plot.";

  const add = useMutation({
    mutationFn: async () => {
      const parsed = InvestmentSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (parsed.data.source_income_id) {
        const bal = balances.get(parsed.data.source_income_id);
        if (bal && parsed.data.value > bal.remaining + 0.001) {
          throw new Error(`Selected income only has ${bal.remaining.toFixed(2)} KES left`);
        }
      }
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
        source_income_id: parsed.data.source_income_id || null,
      };
      const { error } = await supabase.from("assets").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Investment added");
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["income"] });
      setOpen(false);
      setForm((f) => ({ ...f, name: "", value: "", transaction_code: "", platform: "", notes: "", source_income_id: "" }));
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
          <div className="rounded-md border border-border bg-secondary/30 p-2 text-xs text-muted-foreground">
            Available cash from income: <span className="font-semibold text-foreground">{fmtKES(available)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={categoryNameLabel}>
              {suggestions.length > 0 ? (
                <Select value={form.name} onValueChange={(v) => set("name")(v)}>
                  <SelectTrigger><SelectValue placeholder={`Choose ${form.category === "MMF" ? "an MMF" : form.category === "STOCKS" ? "an NSE stock" : "a REIT"}…`} /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {suggestions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <SelectItem value="__other__">Other (type below)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Asset name" />
              )}
              {form.name === "__other__" && (
                <Input className="mt-2" placeholder="Custom name" onChange={(e) => set("name")(e.target.value)} />
              )}
            </Field>
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="col-span-2 -mt-1 text-[11px] text-muted-foreground">{categoryHint}</div>
            <Field label="Amount invested (KES)"><Input type="number" min={1} step="0.01" value={form.value} onChange={(e) => set("value")(e.target.value)} placeholder="5000" /></Field>
            <Field label="Date invested"><Input type="date" value={form.invested_at} onChange={(e) => set("invested_at")(e.target.value)} /></Field>
            <Field label="Funded by (income)">
              <Select value={form.source_income_id || "none"} onValueChange={(v) => set("source_income_id")(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Choose income" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {(income ?? []).map((inc) => {
                    const bal = balances.get(inc.id);
                    return <SelectItem key={inc.id} value={inc.id}>{inc.source} · {fmtKES(bal?.remaining ?? Number(inc.amount))} left</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Payment method">
              <Select value={form.payment_method} onValueChange={(v) => set("payment_method")(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Platform"><Input value={form.platform} onChange={(e) => set("platform")(e.target.value)} placeholder="Hisa, CIC, Acorn…" /></Field>
            <Field label="M-Pesa / bank reference"><Input value={form.transaction_code} onChange={(e) => set("transaction_code")(e.target.value)} placeholder="QFG3X8R… / NEFT ref" /></Field>
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