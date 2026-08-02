import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { failed, json, unauthenticated } from "./_shared";

export default defineTool({
  name: "record_income",
  title: "Record income",
  description: "Record a new income entry in KES for the signed-in MalinGu user.",
  inputSchema: {
    amount: z.number().positive().describe("Income amount in KES."),
    source: z.string().min(1).describe("Income source, e.g. Salary, Side hustle, Allowance."),
    date: z.string().optional().describe("Date received, YYYY-MM-DD. Defaults to today."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ amount, source, date }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const userId = ctx.getUserId();
    if (!userId) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("income")
      .insert({ user_id: userId, amount, source, date: date ?? new Date().toISOString().slice(0, 10) })
      .select()
      .single();
    if (error) return failed(error.message);
    return json({ income: data });
  },
});
