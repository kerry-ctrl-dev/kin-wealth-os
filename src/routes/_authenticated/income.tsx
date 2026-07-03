import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { incomeQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { allocateIncome, fmtKES } from "@/lib/finance";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/income")({
  head: () => ({ meta: [{ title: "Income — MalinGu" }] }),
  component: IncomePage,
});

const Schema = z.object({
  source: z.string().trim().min(1, "Source required").max(80),
  amount: z.coerce.number().positive("Amount must be > 0").max(1_000_000_000),
});

function IncomePage() {
  const qc = useQueryClient();
  const { data: income } = useQuery(incomeQuery());
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [autoAllocate, setAutoAllocate] = useState(false);

  const addIncome = useMutation({
    mutationFn: async (input: { source: string; amount: number; autoAllocate: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const { data: inserted, error } = await supabase
        .from("income")
        .insert({ source: input.source, amount: input.amount, user_id: uid })
        .select()
        .single();
      if (error) throw error;
      if (input.autoAllocate) {
        const rows = allocateIncome(input.amount).map((r) => ({
          user_id: uid, name: r.name, category: r.category,
          value: r.value, liquidity: r.liquidity, source_income_id: inserted.id,
        }));
        const { error: aErr } = await supabase.from("assets").insert(rows);
        if (aErr) throw aErr;
      }
      return { autoAllocated: input.autoAllocate };
    },
    onSuccess: (res) => {
      toast.success(res.autoAllocated ? "Income recorded & allocated 30/30/20/20" : "Income recorded");
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      setSource(""); setAmount("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Income removed");
      qc.invalidateQueries({ queryKey: ["income"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return (
    <div>
      <SectionHeading title="Income" sub="Track every shilling earned. Optionally auto-allocate each entry across MMF / Stocks / REITs / Savings." />
      <form
        className="fintech-card p-5 mb-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = Schema.safeParse({ source, amount });
          if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
          addIncome.mutate({ ...parsed.data, autoAllocate });
        }}
      >
        <div className="grid sm:grid-cols-[1fr_180px_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="src">Source</Label>
            <Input id="src" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Stipend, side hustle…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (KES)</Label>
            <Input id="amt" type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" />
          </div>
          <Button type="submit" disabled={addIncome.isPending}><Plus className="h-4 w-4" /> Add income</Button>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/30 p-3">
          <div>
            <Label htmlFor="auto" className="text-sm font-medium">Auto-allocate 30/30/20/20</Label>
            <p className="text-xs text-muted-foreground">Split this income across MMF, NSE stocks, REITs and Savings automatically.</p>
          </div>
          <Switch id="auto" checked={autoAllocate} onCheckedChange={setAutoAllocate} />
        </div>
      </form>
      <div className="fintech-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="text-left p-3">Source</th><th className="text-left p-3">Date</th><th className="text-right p-3">Amount</th><th className="w-10" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(income ?? []).map((i) => (
              <tr key={i.id} className="hover:bg-secondary/30">
                <td className="p-3 font-medium">{i.source}</td>
                <td className="p-3 text-muted-foreground">{new Date(i.date).toLocaleDateString()}</td>
                <td className="p-3 text-right metric-value">{fmtKES(Number(i.amount))}</td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(i.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {(income ?? []).length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No income yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}