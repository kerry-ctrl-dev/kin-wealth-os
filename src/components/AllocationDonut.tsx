import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_COLOR, CATEGORY_LABEL, type AssetCategory, fmtKES } from "@/lib/finance";

export function AllocationDonut({
  data,
}: {
  data: Array<{ category: AssetCategory; value: number; pct: number }>;
}) {
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No assets yet — add income to bootstrap allocation.</div>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="category"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="var(--color-background)"
          >
            {data.map((d) => (
              <Cell key={d.category} fill={CATEGORY_COLOR[d.category]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-foreground)",
            }}
            formatter={(v: number, _n, p) => [fmtKES(Number(v)), CATEGORY_LABEL[(p as { payload: { category: AssetCategory } }).payload.category]]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}