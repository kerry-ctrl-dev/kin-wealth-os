import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { failed, json, unauthenticated } from "./_shared";

export default defineTool({
  name: "record_expense",
  title: "Record an expense",
  description: "Record a new expense in KES for the signed-in MalinGu user.",
  inputSchema: {
    amount: z.number().positive().describe("Expense amount in KES."),
    category: z.string().min(1).describe("Expense category, e.g. Rent, Transport, Food."),
    date: z.string().optional().describe("Expense date, YYYY-MM-DD. Defaults to today."),
    vendor: z.string().optional().describe("Who was paid."),
    method: z.string().optional().describe("Payment method, e.g. M-Pesa, Bank, Cash."),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ amount, category, date, vendor, method, notes }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const userId = ctx.getUserId();
    if (!userId) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        amount,
        category,
        date: date ?? new Date().toISOString().slice(0, 10),
        vendor: vendor ?? null,
        method: method ?? null,
        notes: notes ?? null,
      })
      .select()
      .single();
    if (error) return failed(error.message);
    return json({ expense: data });
  },
});
