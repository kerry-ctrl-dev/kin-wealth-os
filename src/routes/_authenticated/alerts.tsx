import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { alertsQuery, assetsQuery, incomeQuery } from "@/lib/queries";
import { generateAlerts } from "@/lib/finance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, RefreshCw, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Wealth OS" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const qc = useQueryClient();
  const alerts = useQuery(alertsQuery());
  const assets = useQuery(assetsQuery());
  const income = useQuery(incomeQuery());

  const regen = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const computed = generateAlerts(assets.data ?? [], income.data ?? []);
      await supabase.from("alerts").delete().eq("user_id", uid);
      if (computed.length === 0) return;
      const { error } = await supabase.from("alerts").insert(computed.map((c) => ({ ...c, user_id: uid })));
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Alerts refreshed"); qc.invalidateQueries({ queryKey: ["alerts"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  useEffect(() => {
    if (assets.data && income.data && (alerts.data ?? []).length === 0 && !regen.isPending) {
      regen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets.data, income.data]);

  return (
    <div>
      <SectionHeading title="Alerts" sub="Liquidity, performance and volatility warnings."
        action={<Button onClick={() => regen.mutate()} variant="secondary"><RefreshCw className="h-4 w-4" /> Recompute</Button>} />
      <div className="space-y-3">
        {(alerts.data ?? []).map((al) => {
          const tone = al.severity === "DANGER" ? "var(--danger)" : al.severity === "WARNING" ? "var(--warning)" : "var(--muted-foreground)";
          return (
            <div key={al.id} className="fintech-card p-4 flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}>
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold" style={{ color: tone }}>
                  {al.severity} · {al.type}
                </div>
                <p className="text-sm mt-1">{al.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(al.date).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(al.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
        {(alerts.data ?? []).length === 0 && (
          <div className="fintech-card p-6 text-sm text-muted-foreground">No alerts — your portfolio looks healthy.</div>
        )}
      </div>
    </div>
  );
}