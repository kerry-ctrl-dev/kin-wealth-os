import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { failed, json, unauthenticated } from "./_shared";

export default defineTool({
  name: "list_expenses",
  title: "List expenses",
  description: "List the signed-in user's expenses in KES, newest first, optionally filtered by date range or category.",
  inputSchema: {
    from: z.string().optional().describe("Inclusive start date, YYYY-MM-DD."),
    to: z.string().optional().describe("Inclusive end date, YYYY-MM-DD."),
    category: z.string().optional().describe("Optional expense category filter."),
    limit: z.number().int().optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("expenses")
      .select("id,amount,category,date,vendor,method,notes")
      .order("date", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (category) query = query.eq("category", category);
    const { data, error } = await query;
    if (error) return failed(error.message);
    return json({ currency: "KES", expenses: data ?? [] });
  },
});
