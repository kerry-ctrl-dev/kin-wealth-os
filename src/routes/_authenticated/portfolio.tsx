import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "@/components/SectionHeading";
import { assetsQuery } from "@/lib/queries";
import { byCategory, CATEGORY_LABEL, fmtKES, fmtPct, totalValue, type AssetCategory } from "@/lib/finance";
import { AllocationDonut } from "@/components/AllocationDonut";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Wealth OS" }] }),
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
      <SectionHeading title="Portfolio" sub="All assets, categories, values and liquidity scores." />
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