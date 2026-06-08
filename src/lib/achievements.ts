import type { Tables } from "@/integrations/supabase/types";
import { totalIncome, totalValue, liquidityRatio, computeRoi } from "./finance";
import { computeStreak } from "./personalization";

type Asset = Tables<"assets">;
type Income = Tables<"income">;
type Goal = Tables<"goals">;

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number; // 0..1
  hint?: string;
}

export function computeBadges(assets: Asset[], income: Income[], goals: Goal[], score: number): Badge[] {
  const invested = totalIncome(income);
  const total = totalValue(assets);
  const liq = liquidityRatio(assets);
  const roi = computeRoi(assets, income);
  const streak = computeStreak(income.map((i) => i.date));
  const goalsHit = goals.filter((g) => Number(g.current) >= Number(g.target)).length;

  const list: Badge[] = [
    { id: "first-step", title: "First Step", description: "Logged your first income", emoji: "🌱", unlocked: income.length >= 1, progress: Math.min(1, income.length / 1) },
    { id: "ten-entries", title: "Disciplined Logger", description: "Logged 10 income entries", emoji: "📒", unlocked: income.length >= 10, progress: Math.min(1, income.length / 10), hint: `${income.length}/10` },
    { id: "streak-3", title: "Consistent Investor", description: "3-month investing streak", emoji: "🔥", unlocked: streak >= 3, progress: Math.min(1, streak / 3), hint: `${streak}/3 mo` },
    { id: "streak-6", title: "Habit Forged", description: "6-month investing streak", emoji: "🏅", unlocked: streak >= 6, progress: Math.min(1, streak / 6), hint: `${streak}/6 mo` },
    { id: "ten-k", title: "10K Club", description: "Invested KES 10,000+", emoji: "💰", unlocked: invested >= 10_000, progress: Math.min(1, invested / 10_000) },
    { id: "hundred-k", title: "Six Figures", description: "Portfolio worth KES 100,000+", emoji: "💎", unlocked: total >= 100_000, progress: Math.min(1, total / 100_000) },
    { id: "liquid", title: "Liquid Master", description: "Liquidity above 50%", emoji: "💧", unlocked: liq >= 0.5, progress: Math.min(1, liq / 0.5) },
    { id: "positive-roi", title: "In the Green", description: "Positive ROI achieved", emoji: "📈", unlocked: roi > 0, progress: roi > 0 ? 1 : 0 },
    { id: "discipline-80", title: "Disciplined Mind", description: "Discipline score ≥ 80", emoji: "🧠", unlocked: score >= 80, progress: Math.min(1, score / 80), hint: `${score}/80` },
    { id: "goal-crusher", title: "Goal Crusher", description: "Reached a savings goal", emoji: "🎯", unlocked: goalsHit >= 1, progress: Math.min(1, goalsHit / 1) },
  ];
  return list;
}