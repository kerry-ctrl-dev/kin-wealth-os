// User-configurable alert thresholds, persisted to localStorage.

export interface AlertPrefs {
  liquidityMinPct: number;      // e.g. 30 → warn when liquidity below 30%
  goalMilestones: number[];     // e.g. [25, 50, 75, 100]
  stockConcMaxPct: number;      // e.g. 60 → warn when any single-category > 60%
  budgetOverPct: number;        // e.g. 90 → warn when spending hits X% of monthly budget
  loanDueDays: number;          // warn when loan due within N days
  enabled: boolean;
}

const KEY = "malingu:alert-prefs";

export const DEFAULT_ALERT_PREFS: AlertPrefs = {
  liquidityMinPct: 30,
  goalMilestones: [25, 50, 75, 100],
  stockConcMaxPct: 60,
  budgetOverPct: 90,
  loanDueDays: 7,
  enabled: true,
};

export function loadAlertPrefs(): AlertPrefs {
  if (typeof window === "undefined") return DEFAULT_ALERT_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_ALERT_PREFS;
    return { ...DEFAULT_ALERT_PREFS, ...(JSON.parse(raw) as Partial<AlertPrefs>) };
  } catch {
    return DEFAULT_ALERT_PREFS;
  }
}

export function saveAlertPrefs(next: AlertPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}