import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Home as HomeIcon } from "lucide-react";
import { z } from "zod";
import { SectionHeading } from "@/components/SectionHeading";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { personalAssetsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { fmtKES } from "@/lib/finance";
import { personalAssetsValue } from "@/lib/balance";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/personal-assets")({
  head: () => ({ meta: [{ title: "Assets Manager — Wealth OS" }] }),
  component: PersonalAssetsPage,
});

const CATEGORIES = ["VEHICLE", "HOUSEHOLD", "ELECTRONICS", "CLOTHES", "CASH", "OTHER"] as const;
const LABEL: Record<(typeof CATEGORIES)[number], string> = {
  VEHICLE: "Motor vehicle",
  HOUSEHOLD: "Household items",
  ELECTRONICS: "Electronics",
  CLOTHES: "Clothes & apparel",
  CASH: "Cash on hand",
  OTHER: "Other",
};

const Schema = z.object({
  name: z.string().trim().min(1, "Name required").max(120),
  category: z.enum(CATEGORIES),
  value: z.coerce.number().positive("Must be > 0").max(1_000_000_000),
  acquired_at: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

function PersonalAssetsPage() {
  const qc = useQueryClient();
  const { data } = useQuery(personalAssetsQuery());
  const rows = data ?? [];
  const total = personalAssetsValue(rows);
  const byCat = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + Number(r.value); return acc;
  }, {});

  async function del(id: string) {
    const { error } = await supabase.from("personal_assets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["personal_assets"] }); }
  }

  return (
    <div>
      <SectionHeading title="Assets Manager" sub="Vehicles, household items, electronics, clothes, cash — counted toward net worth." action={<AddDialog />} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total value" value={fmtKES(total)} icon={<HomeIcon className="h-4 w-4" />} />
        <MetricCard label="Items" value={String(rows.length)} />
        <MetricCard label="Cash on hand" value={fmtKES(byCat.CASH ?? 0)} />
        <MetricCard label="Vehicles" value={fmtKES(byCat.VEHICLE ?? 0)} />
      </div>
      <div className="fintech-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="text-left p-3">Item</th><th className="text-left p-3">Category</th><th className="text-right p-3">Value</th><th className="text-left p-3">Acquired</th><th className="w-10" /></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-secondary/30">
                <td className="p-3 font-medium">{r.name}{r.notes ? <div className="text-xs text-muted-foreground">{r.notes}</div> : null}</td>
                <td className="p-3 text-muted-foreground">{LABEL[r.category as keyof typeof LABEL] ?? r.category}</td>
                <td className="p-3 text-right metric-value">{fmtKES(Number(r.value))}</td>
                <td className="p-3 text-xs text-muted-foreground">{r.acquired_at ? new Date(r.acquired_at).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No personal assets yet.</td></tr>}
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
    name: "", category: "HOUSEHOLD" as (typeof CATEGORIES)[number],
    value: "", acquired_at: "", notes: "",
  });
  const add = useMutation({
    mutationFn: async () => {
      const parsed = Schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("personal_assets").insert({
        user_id: u.user!.id,
        name: parsed.data.name,
        category: parsed.data.category,
        value: parsed.data.value,
        acquired_at: parsed.data.acquired_at ? new Date(parsed.data.acquired_at).toISOString() : null,
        notes: parsed.data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Asset added");
      qc.invalidateQueries({ queryKey: ["personal_assets"] });
      setOpen(false);
      setForm({ name: "", category: "HOUSEHOLD", value: "", acquired_at: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add asset</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New personal asset</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Item name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Toyota Vitz / Sofa set" /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as (typeof CATEGORIES)[number] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{LABEL[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Current value (KES)</Label><Input type="number" min={1} step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            <div><Label>Acquired on</Label><Input type="date" value={form.acquired_at} onChange={(e) => setForm({ ...form, acquired_at: e.target.value })} /></div>
          </div>
          <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Model, condition…" /></div>
          <div className="flex justify-end"><Button type="submit" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}