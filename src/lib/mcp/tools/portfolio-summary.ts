import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
import { failed, json, unauthenticated } from "./_shared";

export default defineTool({
  name: "portfolio_summary",
  title: "Portfolio summary",
  description:
    "Summarise the signed-in MalinGu user's finances in KES: total invested value by asset category, total income, total expenses and open goals.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const [assets, income, expenses, goals] = await Promise.all([
      supabase.from("assets").select("category,value,liquidity"),
      supabase.from("income").select("amount"),
      supabase.from("expenses").select("amount"),
      supabase.from("goals").select("name,target,current,deadline"),
    ]);
    const err = assets.error ?? income.error ?? expenses.error ?? goals.error;
    if (err) return failed(err.message);

    const byCategory: Record<string, number> = {};
    let totalAssets = 0;
    for (const a of assets.data ?? []) {
      byCategory[a.category] = (byCategory[a.category] ?? 0) + Number(a.value);
      totalAssets += Number(a.value);
    }
    const totalIncome = (income.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalExpenses = (expenses.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

    return json({
      currency: "KES",
      total_invested: totalAssets,
      by_category: byCategory,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cash_flow: totalIncome - totalExpenses,
      goals: goals.data ?? [],
    });
  },
});
