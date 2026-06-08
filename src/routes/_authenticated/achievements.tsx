import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Progress } from "@/components/ui/progress";
import { assetsQuery, incomeQuery, goalsQuery, remindersQuery } from "@/lib/queries";
import { computeBadges } from "@/lib/achievements";
import { computeStreak, disciplineScore } from "@/lib/personalization";
import { byCategory, liquidityRatio, totalValue } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Wealth OS" }] }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const assets = useQuery(assetsQuery());
  const income = useQuery(incomeQuery());
  const goals = useQuery(goalsQuery());
  const reminders = useQuery(remindersQuery());

  const a = assets.data ?? [];
  const total = totalValue(a) || 1;
  const stocksConc = byCategory(a).STOCKS / total;
  const streak = computeStreak((income.data ?? []).map((x) => x.date));
  const g = goals.data ?? [];
  const avgGoal = g.length ? g.reduce((s, x) => s + Math.min(1, Number(x.current) / (Number(x.target) || 1)), 0) / g.length : 0;
  const rem = reminders.data ?? [];
  const remRate = rem.length ? rem.filter((r) => r.completed).length / rem.length : 1;
  const { score } = disciplineScore({ streakMonths: streak, liquidityRatio: liquidityRatio(a), avgGoalProgress: avgGoal, reminderCompletionRate: remRate, stocksConcentration: stocksConc });

  const badges = computeBadges(a, income.data ?? [], g, score);
  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Achievements"
        sub={`${unlocked} of ${badges.length} badges earned · keep building the habit`}
        icon={<Award className="h-5 w-5" />}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`fintech-card p-5 transition ${b.unlocked ? "" : "opacity-60"}`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-12 w-12 grid place-items-center rounded-xl text-2xl ${b.unlocked ? "bg-primary/15" : "bg-muted"}`}>
                {b.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{b.title}</div>
                  {b.unlocked ? (
                    <span className="text-[10px] uppercase tracking-widest text-[color:var(--success)]">Unlocked</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Locked</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                <div className="mt-3">
                  <Progress value={b.progress * 100} className="h-1.5" />
                  {b.hint && <div className="text-[10px] text-muted-foreground mt-1">{b.hint}</div>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}