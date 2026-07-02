import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;
    // Best-effort cleanup of user rows across owned tables. RLS-owned rows
    // will also be removed by the auth.users cascade for anything wired with
    // ON DELETE CASCADE — this loop covers tables without cascade too.
    const tables = [
      "assets",
      "income",
      "expenses",
      "goals",
      "budgets",
      "reminders",
      "loans",
      "personal_assets",
      "documents",
      "snapshots",
      "alerts",
      "recurring",
      "profiles",
    ] as const;
    for (const t of tables) {
      try {
        // profiles PK is `id` (auth user id); everything else uses `user_id`.
        const col = t === "profiles" ? "id" : "user_id";
        await (supabaseAdmin.from(t).delete() as unknown as {
          eq: (c: string, v: string) => Promise<unknown>;
        }).eq(col, uid);
      } catch {
        // ignore per-table failures; user deletion below is the source of truth
      }
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });