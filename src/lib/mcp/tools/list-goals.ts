import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
import { failed, json, unauthenticated } from "./_shared";

export default defineTool({
  name: "list_goals",
  title: "List goals",
  description: "List the signed-in user's savings/investment goals with target, current progress and deadline (KES).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("goals")
      .select("id,name,target,current,deadline")
      .order("created_at", { ascending: false });
    if (error) return failed(error.message);
    return json({
      currency: "KES",
      goals: (data ?? []).map((g) => ({
        ...g,
        progress_pct: g.target ? Math.round((Number(g.current) / Number(g.target)) * 100) : 0,
      })),
    });
  },
});
