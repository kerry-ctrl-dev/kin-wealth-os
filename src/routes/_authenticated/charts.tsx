import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area,
} from "recharts";
import { SectionHeading } from "@/components/SectionHeading";
import { assetsQuery, snapshotsQuery } from "@/lib/queries";
import { AllocationDonut } from "@/components/AllocationDonut";
import { byCategory, CATEGORY_LABEL, fmtKES, totalValue, type AssetCategory } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — MalinGu" }] }),
  component: ChartsPage,
});

function ChartsPage() {
  const assets = useQuery(assetsQuery());
  const snapshots = useQuery(snapshotsQuery());
  const a = assets.data ?? [];
  const snaps = (snapshots.data ?? []).map((s) => ({
    date: new Date(s.date).toLocaleDateString(),
    total: Number(s.total_assets),
    liquidity: Number(s.liquidity_ratio) * 100,
    roi: Number(s.roi),
  }));
  const total = totalValue(a);
  const cats = byCategory(a);
  const allocation = (Object.keys(cats) as AssetCategory[])
    .filter((c) => cats[c] > 0)
    .map((c) => ({ category: c, value: cats[c], pct: total ? (cats[c] / total) * 100 : 0 }));
  const barData = (Object.keys(cats) as AssetCategory[]).map((c) => ({ name: CATEGORY_LABEL[c], value: cats[c] }));
  const axis = { stroke: "var(--color-muted-foreground)", fontSize: 11 };
  const grid = "var(--color-border)";
  const tt = { contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, color: "var(--color-foreground)" } };

  return (
    <div>
      <SectionHeading title="Charts" sub="Allocation, net-worth growth and liquidity trend." />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-2">Portfolio Allocation</h2>
          <AllocationDonut data={allocation} />
        </div>
        <div className="fintech-card p-6">
          <h2 className="font-semibold tracking-tight mb-2">Asset Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} tickFormatter={(v) => fmtKES(Number(v))} />
                <Tooltip {...tt} formatter={(v: number) => fmtKES(Number(v))} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="fintech-card p-6 lg:col-span-2">
          <h2 className="font-semibold tracking-tight mb-2">Net Worth Growth</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={snaps}>
                <defs><linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} tickFormatter={(v) => fmtKES(Number(v))} />
                <Tooltip {...tt} formatter={(v: number) => fmtKES(Number(v))} />
                <Area type="monotone" dataKey="total" stroke="var(--chart-1)" fill="url(#nw)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="fintech-card p-6 lg:col-span-2">
          <h2 className="font-semibold tracking-tight mb-2">Liquidity & ROI Trend</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={snaps}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                <XAxis dataKey="date" {...axis} />
                <YAxis {...axis} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ color: "var(--color-muted-foreground)", fontSize: 12 }} />
                <Line type="monotone" dataKey="liquidity" stroke="var(--chart-2)" strokeWidth={2} dot={false} name="Liquidity %" />
                <Line type="monotone" dataKey="roi" stroke="var(--chart-3)" strokeWidth={2} dot={false} name="ROI %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}