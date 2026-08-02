import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAssets from "./tools/list-assets";
import listExpenses from "./tools/list-expenses";
import listGoals from "./tools/list-goals";
import portfolioSummary from "./tools/portfolio-summary";
import recordExpense from "./tools/record-expense";
import recordIncome from "./tools/record-income";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "malingu",
  title: "MalinGu",
  version: "0.1.0",
  instructions:
    "Tools for MalinGu (Mali Yangu — 'My Wealth'), a Kenyan personal wealth tracker. All amounts are in KES. Use portfolio_summary for an overview, list_assets / list_expenses / list_goals to read detail, and record_expense / record_income to add entries for the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [portfolioSummary, listAssets, listExpenses, listGoals, recordExpense, recordIncome],
});
