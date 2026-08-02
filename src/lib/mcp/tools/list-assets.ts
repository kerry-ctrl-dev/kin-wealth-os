import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { failed, json, unauthenticated } from "./_shared";

export default defineTool({
  name: "list_assets",
  title: "List investments",
  description: "List the signed-in user's investments (MMF, NSE stocks, REITs, bonds, cash, other) with value in KES.",
  inputSchema: {
    category: z.string().optional().describe("Optional asset category filter, e.g. MMF, NSE, REIT, CASH."),
    limit: z.number().int().optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("assets")
      .select("id,name,category,value,platform,liquidity,invested_at,notes")
      .order("invested_at", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 200));
    if (category) query = query.eq("category", category as never);
    const { data, error } = await query;
    if (error) return failed(error.message);
    return json({ currency: "KES", assets: data ?? [] });
  },
});
