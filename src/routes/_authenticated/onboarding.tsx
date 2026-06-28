import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CircleCheckBig,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Wealth OS" }] }),
  component: Onboarding,
});

const PROFESSIONS = [
  "Student",
  "Software Developer",
  "Freelancer",
  "Entrepreneur",
  "Business Owner",
  "Other",
];
const EMPLOYMENT = ["Student", "Employed", "Self-employed", "Freelancer", "Unemployed"];
const EXPERIENCE = ["Beginner", "Intermediate", "Advanced"];
const RISK = ["LOW", "MEDIUM", "HIGH"];

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    profession: "",
    employment_status: "",
    monthly_income: "",
    investment_experience: "",
    risk_level: "MEDIUM",
    main_goals: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const steps = [
    {
      icon: <UserRound className="h-4 w-4" />,
      title: "Tell us about you",
      sub: "Start with the basics so the app can feel tailored from day one.",
      content: (
        <div className="space-y-4">
          <Field label="Full name" help="This appears in greetings and dashboard summaries.">
            <Input
              value={form.full_name}
              onChange={(e) => set("full_name")(e.target.value)}
              placeholder="Kerry Jakomanyo"
            />
          </Field>
          <Field label="Age" help="Used for context only and can be updated later.">
            <Input
              type="number"
              min={10}
              max={120}
              value={form.age}
              onChange={(e) => set("age")(e.target.value)}
              placeholder="22"
            />
          </Field>
        </div>
      ),
      valid: form.full_name.trim().length > 1 && Number(form.age) > 0,
    },
    {
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      title: "What do you do?",
      sub: "Your income rhythm helps us frame liquidity and planning suggestions.",
      content: (
        <div className="space-y-4">
          <Field label="Profession" help="Choose the option closest to your main focus right now.">
            <PickerSelect
              value={form.profession}
              onChange={set("profession")}
              options={PROFESSIONS}
            />
          </Field>
          <Field label="Employment status" help="This helps tailor cash flow assumptions.">
            <PickerSelect
              value={form.employment_status}
              onChange={set("employment_status")}
              options={EMPLOYMENT}
            />
          </Field>
          <Field
            label="Monthly income (KES)"
            help="Optional, but useful for better planning guidance."
          >
            <Input
              type="number"
              min={0}
              value={form.monthly_income}
              onChange={(e) => set("monthly_income")(e.target.value)}
              placeholder="25000"
            />
          </Field>
        </div>
      ),
      valid: !!form.profession && !!form.employment_status,
    },
    {
      icon: <PiggyBank className="h-4 w-4" />,
      title: "Investing preferences",
      sub: "Set your comfort level so your dashboard starts with the right tone.",
      content: (
        <div className="space-y-4">
          <Field label="Investment experience" help="Used to shape how advanced the app feels.">
            <PickerSelect
              value={form.investment_experience}
              onChange={set("investment_experience")}
              options={EXPERIENCE}
            />
          </Field>
          <Field label="Preferred risk level" help="You can adjust this later in settings.">
            <PickerSelect value={form.risk_level} onChange={set("risk_level")} options={RISK} />
          </Field>
          <Field
            label="Main financial goals"
            help="A few words are enough to personalize your dashboard."
          >
            <Textarea
              rows={3}
              value={form.main_goals}
              onChange={(e) => set("main_goals")(e.target.value)}
              placeholder="e.g. Build 100k emergency fund, buy land in 3 years…"
            />
          </Field>
        </div>
      ),
      valid: !!form.investment_experience && !!form.risk_level,
    },
  ];

  const cur = steps[step];
  const completedSteps = steps.filter((entry) => entry.valid).length;
  const progress = ((step + 1) / steps.length) * 100;
  const canFinish = steps.every((entry) => entry.valid);
  const summaryItems = useMemo(
    () => [
      { label: "Profile", value: form.full_name.trim() || "Not set yet" },
      { label: "Work", value: form.profession || "Add your profession" },
      { label: "Risk", value: form.risk_level || "MEDIUM" },
      { label: "Goal", value: form.main_goals.trim() || "Add a focus area" },
    ],
    [form],
  );

  async function finish() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: u.user.id,
      full_name: form.full_name.trim(),
      age: form.age ? Number(form.age) : null,
      profession: form.profession || null,
      employment_status: form.employment_status || null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      investment_experience: form.investment_experience || null,
      risk_level: form.risk_level || null,
      main_goals: form.main_goals.trim() || null,
      onboarded: true,
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("You're all set");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Welcome to Wealth OS
              </div>
              <div className="font-semibold tracking-tight">Set up your workspace</div>
            </div>
          </div>

          <div className="fintech-card relative overflow-hidden p-6">
            <div
              className="absolute inset-x-0 top-0 h-24 opacity-30"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/45 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Personalized setup in a few quick steps
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Let&apos;s tailor your dashboard.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This keeps your first experience relevant without making setup feel heavy.
              </p>
            </div>

            <div className="relative mt-6 space-y-3">
              {steps.map((entry, index) => {
                const state = index < step ? "done" : index === step ? "current" : "upcoming";
                return (
                  <div
                    key={entry.title}
                    className={
                      state === "current"
                        ? "rounded-2xl border border-primary/35 bg-primary/10 p-4"
                        : "rounded-2xl border border-border/70 bg-background/30 p-4"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          state === "done"
                            ? "mt-0.5 rounded-xl bg-[color:var(--success)]/15 p-2 text-[color:var(--success)]"
                            : state === "current"
                              ? "mt-0.5 rounded-xl bg-primary/15 p-2 text-primary"
                              : "mt-0.5 rounded-xl bg-background/60 p-2 text-muted-foreground"
                        }
                      >
                        {state === "done" ? <CircleCheckBig className="h-4 w-4" /> : entry.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{entry.title}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{entry.sub}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-6 grid gap-3 text-sm">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/35 px-4 py-3"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="max-w-[65%] truncate text-right font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fintech-card p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Step {step + 1} of {steps.length}
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{cur.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{cur.sub}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/35 px-3 py-2 text-right">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Complete
              </div>
              <div className="metric-value text-lg font-semibold">
                {completedSteps}/{steps.length}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/70 bg-background/25 p-4 sm:p-5">
            {cur.content}
          </div>

          {step === steps.length - 1 && (
            <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/8 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Target className="h-4 w-4 text-primary" />
                Ready to launch
              </div>
              <div className="mt-1 text-muted-foreground">
                Finish setup to unlock your personalized dashboard, goals, and portfolio views.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!cur.valid}
                className="rounded-xl"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={!canFinish || busy} className="rounded-xl">
                {busy ? "Finishing…" : "Enter Wealth OS"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {children}
    </div>
  );
}

function PickerSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
