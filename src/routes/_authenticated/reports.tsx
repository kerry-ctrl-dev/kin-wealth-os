import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileDown, FileText, Sparkles, ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { assetsQuery, incomeQuery, goalsQuery, expensesQuery, budgetsQuery, remindersQuery, alertsQuery, personalAssetsQuery, loansQuery } from "@/lib/queries";
import { buildReport, toCSV, downloadFile, type ReportPeriod } from "@/lib/reports";
import { exportReportPDF } from "@/lib/pdf-report";
import { profileQuery } from "@/lib/queries";
import { CATEGORY_LABEL, fmtKES, fmtPct } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — MalinGu" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const assets = useQuery(assetsQuery());
  const income = useQuery(incomeQuery());
  const goals = useQuery(goalsQuery());
  const expenses = useQuery(expensesQuery());
  const budgets = useQuery(budgetsQuery());
  const reminders = useQuery(remindersQuery());
  const alerts = useQuery(alertsQuery());
  const personalAssets = useQuery(personalAssetsQuery());
  const loans = useQuery(loansQuery());
  const profile = useQuery(profileQuery());
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [showCsv, setShowCsv] = useState(false);

  const report = useMemo(
    () => buildReport(period, assets.data ?? [], income.data ?? [], goals.data ?? [], new Date(), {
      expenses: expenses.data ?? [],
      budgets: budgets.data ?? [],
      reminders: reminders.data ?? [],
      alerts: alerts.data ?? [],
      personalAssets: personalAssets.data ?? [],
      loans: loans.data ?? [],
    }),
    [period, assets.data, income.data, goals.data, expenses.data, budgets.data, reminders.data, alerts.data, personalAssets.data, loans.data],
  );

  function exportPDF() {
    exportReportPDF(report, { profile: profile.data?.full_name ?? undefined });
  }
  function exportCSV(kind: "income" | "assets" | "goals") {
    const rows: Record<string, unknown>[] =
      kind === "income" ? (income.data ?? []).map((r) => ({ date: r.date, source: r.source, amount: r.amount }))
      : kind === "assets" ? (assets.data ?? []).map((r) => ({ created_at: r.created_at, category: r.category, name: r.name, value: r.value, liquidity: r.liquidity, platform: r.platform ?? "", payment_method: r.payment_method ?? "" }))
      : (goals.data ?? []).map((r) => ({ name: r.name, target: r.target, current: r.current, deadline: r.deadline ?? "" }));
    downloadFile(`malingu-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Report Center" sub="Branded PDF reports for daily, weekly, and monthly views. Raw CSV is optional." />

      <div className="fintech-card p-6">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <Button onClick={exportPDF}><FileText className="h-4 w-4" /> Download PDF report</Button>
          </div>

          <TabsContent value={period} className="mt-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{report.label}</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <Metric label="Total Assets" value={fmtKES(report.totalAssets)} />
              <Metric label="ROI" value={fmtPct(report.roi, 2)} />
              <Metric label="Liquidity" value={fmtPct(report.liquidity)} />
              <Metric label="Risk" value={report.risk} />
              <Metric label="Income this period" value={`${report.incomeCount} entries`} sub={fmtKES(report.incomeTotal)} />
              <Metric label="New investments" value={`${report.newInvestments} entries`} sub={fmtKES(report.newInvestmentsValue)} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-6">
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold mb-2">Allocation</h3>
                {report.allocation.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assets yet.</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {report.allocation.map((a) => (
                      <li key={a.category} className="flex justify-between">
                        <span>{CATEGORY_LABEL[a.category]}</span>
                        <span className="metric-value text-muted-foreground">{fmtKES(a.value)} · {fmtPct(a.pct)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-lg border border-border p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Insights</h3>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  {report.insights.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fintech-card p-6">
        <button onClick={() => setShowCsv((s) => !s)} className="w-full flex items-center justify-between text-left">
          <div>
            <h2 className="font-semibold">Optional: raw CSV exports</h2>
            <p className="text-xs text-muted-foreground">For spreadsheets — most users only need the PDF above.</p>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${showCsv ? "rotate-180" : ""}`} />
        </button>
        {showCsv && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" onClick={() => exportCSV("income")}><FileDown className="h-4 w-4" /> Income CSV</Button>
            <Button variant="outline" onClick={() => exportCSV("assets")}><FileDown className="h-4 w-4" /> Investments CSV</Button>
            <Button variant="outline" onClick={() => exportCSV("goals")}><FileDown className="h-4 w-4" /> Goals CSV</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold metric-value">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}