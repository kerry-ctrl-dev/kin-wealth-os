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
        await supabaseAdmin.from(t).delete().eq("user_id", uid);
      } catch {
        // ignore per-table failures; user deletion below is the source of truth
      }
    }
    try {
      await supabaseAdmin.from("profiles").delete().eq("id", uid);
    } catch {
      /* noop */
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });