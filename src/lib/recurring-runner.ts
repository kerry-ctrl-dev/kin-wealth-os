import { supabase } from "@/integrations/supabase/client";

function advance(d: Date, freq: string): Date {
  const n = new Date(d);
  if (freq === "daily") n.setDate(n.getDate() + 1);
  else if (freq === "weekly") n.setDate(n.getDate() + 7);
  else n.setMonth(n.getMonth() + 1);
  return n;
}

/** Process any due recurring entries for the signed-in user. Idempotent: each run advances next_run. */
export async function processDueRecurring() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: rows } = await supabase
    .from("recurring")
    .select("*")
    .eq("active", true)
    .lte("next_run", today.toISOString().slice(0, 10));
  if (!rows?.length) return;
  for (const r of rows) {
    try {
      if (r.type === "income") {
        await supabase.from("income").insert({ user_id: u.user.id, source: r.label, amount: Number(r.amount), date: new Date().toISOString() });
      } else {
        await supabase.from("expenses").insert({ user_id: u.user.id, category: r.label, amount: Number(r.amount), date: new Date().toISOString() });
      }
      const next = advance(new Date(r.next_run), r.frequency);
      await supabase.from("recurring").update({ next_run: next.toISOString().slice(0, 10) }).eq("id", r.id);
    } catch (e) {
      console.error("recurring run failed", e);
    }
  }
}