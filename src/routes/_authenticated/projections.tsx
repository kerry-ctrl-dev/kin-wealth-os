import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { SectionHeading } from "@/components/SectionHeading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assetsQuery } from "@/lib/queries";
import { fmtKES, totalValue } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/projections")({
  head: () => ({ meta: [{ title: "Projections — MalinGu" }] }),
  component: Projections,
});

function Projections() {
  const assets = useQuery(assetsQuery());
  const start = totalValue(assets.data ?? []);
  const [principal, setPrincipal] = useState(String(Math.round(start)));
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("20");

  const data = useMemo(() => {
    const p0 = Number(principal) || 0, m = Number(monthly) || 0, r = (Number(rate) || 0) / 100, y = Math.max(1, Number(years) || 1);
    const mRate = r / 12;
    const out: { year: number; value: number }[] = [{ year: 0, value: p0 }];
    let v = p0;
    for (let mo = 1; mo <= y * 12; mo++) {
      v = v * (1 + mRate) + m;
      if (mo % 12 === 0) out.push({ year: mo / 12, value: Math.round(v) });
    }
    return out;
  }, [principal, monthly, rate, years]);

  const milestones = [1, 5, 10, 20].filter((y) => y <= Number(years)).map((y) => ({ y, v: data.find((d) => d.year === y)?.value ?? 0 }));

  return (
    <div>
      <SectionHeading title="Future Projections" sub="See where consistent investing could take you." />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="fintech-card p-6 space-y-3">
          <h2 className="font-semibold">Inputs</h2>
          <div><Label>Starting amount (KES)</Label><Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} /></div>
          <div><Label>Monthly contribution (KES)</Label><Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
          <div><Label>Annual return (%)</Label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div><Label>Years</Label><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></div>
        </div>
        <div className="fintech-card p-6 lg:col-span-2">
          <h2 className="font-semibold mb-3">Growth curve</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => fmtKES(v)} />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {milestones.map((m) => (
              <div key={m.y} className="rounded-lg border border-border p-3 bg-background/40">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">In {m.y} yr</div>
                <div className="metric-value text-lg font-semibold mt-1">{fmtKES(m.v)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}