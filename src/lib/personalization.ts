export function greetByHour(name: string, now: Date = new Date()): { text: string; emoji: string } {
  const h = now.getHours();
  const first = (name || "there").trim().split(/\s+/)[0];
  if (h < 12) return { text: `Good morning, ${first}`, emoji: "☀️" };
  if (h < 17) return { text: `Good afternoon, ${first}`, emoji: "🌤️" };
  return { text: `Good evening, ${first}`, emoji: "🌙" };
}

const MOTIVATIONS = [
  "Consistency compounds.",
  "Liquidity creates opportunity.",
  "Small investments become powerful over time.",
  "Discipline beats emotion.",
  "Wealth grows through systems.",
  "Time in the market beats timing the market.",
  "Your future self is watching today's decisions.",
  "Save first. Spend what remains.",
  "Boring portfolios build exciting lives.",
  "Risk is what's left when you think you've thought of everything.",
];

export function dailyMotivation(seed: Date = new Date()): string {
  const day = Math.floor(seed.getTime() / (1000 * 60 * 60 * 24));
  // rotate per session refresh + per day
  const idx = (day + Math.floor(seed.getSeconds() / 6)) % MOTIVATIONS.length;
  return MOTIVATIONS[idx];
}

/** Investment streak in months (consecutive months with ≥1 income/asset entry up to current month). */
export function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const months = new Set(dates.map((d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${x.getMonth()}`;
  }));
  let streak = 0;
  const cur = new Date();
  cur.setDate(1);
  for (;;) {
    const key = `${cur.getFullYear()}-${cur.getMonth()}`;
    if (months.has(key)) {
      streak += 1;
      cur.setMonth(cur.getMonth() - 1);
    } else break;
  }
  return streak;
}

/** Discipline score 0-100 from consistency, liquidity, goal progress, reminders. */
export function disciplineScore(args: {
  streakMonths: number;
  liquidityRatio: number;
  avgGoalProgress: number; // 0..1
  reminderCompletionRate: number; // 0..1
  stocksConcentration: number; // 0..1
}): { score: number; strengths: string[]; weaknesses: string[] } {
  const s1 = Math.min(1, args.streakMonths / 6) * 30;
  const s2 = Math.min(1, args.liquidityRatio / 0.5) * 20;
  const s3 = args.avgGoalProgress * 20;
  const s4 = args.reminderCompletionRate * 15;
  const s5 = (1 - Math.min(1, Math.max(0, args.stocksConcentration - 0.4) / 0.4)) * 15;
  const score = Math.round(s1 + s2 + s3 + s4 + s5);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (s1 >= 20) strengths.push("Strong investing consistency");
  else weaknesses.push("Build a monthly investing habit");
  if (s2 >= 14) strengths.push("Healthy liquidity buffer");
  else weaknesses.push("Raise your cash/MMF buffer");
  if (s3 >= 12) strengths.push("Goals on track");
  else weaknesses.push("Increase monthly contributions to goals");
  if (s4 >= 10) strengths.push("Disciplined on reminders");
  else weaknesses.push("Complete pending reminders");
  if (s5 >= 10) strengths.push("Balanced portfolio");
  else weaknesses.push("Trim stock concentration risk");
  return { score, strengths, weaknesses };
}

/**
 * Map an internal 0-100 discipline score to a real-world credit-score-style
 * Wealth Rating (300-850) with a familiar tier label (Poor → Excellent),
 * mirroring how lenders communicate FICO scores.
 */
export function wealthRating(score: number): { value: number; tier: string; min: number; max: number } {
  const clamped = Math.max(0, Math.min(100, score));
  const value = Math.round(300 + (clamped / 100) * 550); // 300..850
  const tier =
    value >= 800 ? "Excellent" :
    value >= 740 ? "Very Good" :
    value >= 670 ? "Good" :
    value >= 580 ? "Fair" : "Poor";
  return { value, tier, min: 300, max: 850 };
}