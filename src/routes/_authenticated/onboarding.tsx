import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Wealth OS" }] }),
  component: Onboarding,
});

const PROFESSIONS = ["Student", "Software Developer", "Freelancer", "Entrepreneur", "Business Owner", "Other"];
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
      title: "Tell us about you",
      sub: "We'll personalize your dashboard.",
      content: (
        <div className="space-y-4">
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} placeholder="Kerry Jakomanyo" /></Field>
          <Field label="Age"><Input type="number" min={10} max={120} value={form.age} onChange={(e) => set("age")(e.target.value)} placeholder="22" /></Field>
        </div>
      ),
      valid: form.full_name.trim().length > 1 && Number(form.age) > 0,
    },
    {
      title: "What do you do?",
      sub: "Your work context shapes risk and liquidity.",
      content: (
        <div className="space-y-4">
          <Field label="Profession"><PickerSelect value={form.profession} onChange={set("profession")} options={PROFESSIONS} /></Field>
          <Field label="Employment status"><PickerSelect value={form.employment_status} onChange={set("employment_status")} options={EMPLOYMENT} /></Field>
          <Field label="Monthly income (KES)"><Input type="number" min={0} value={form.monthly_income} onChange={(e) => set("monthly_income")(e.target.value)} placeholder="25000" /></Field>
        </div>
      ),
      valid: !!form.profession && !!form.employment_status,
    },
    {
      title: "Investing preferences",
      sub: "We'll tune your allocation engine.",
      content: (
        <div className="space-y-4">
          <Field label="Investment experience"><PickerSelect value={form.investment_experience} onChange={set("investment_experience")} options={EXPERIENCE} /></Field>
          <Field label="Preferred risk level"><PickerSelect value={form.risk_level} onChange={set("risk_level")} options={RISK} /></Field>
          <Field label="Main financial goals">
            <Textarea rows={3} value={form.main_goals} onChange={(e) => set("main_goals")(e.target.value)} placeholder="e.g. Build 100k emergency fund, buy land in 3 years…" />
          </Field>
        </div>
      ),
      valid: !!form.investment_experience && !!form.risk_level,
    },
  ];

  const cur = steps[step];

  async function finish() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setBusy(false); return; }
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
    <div className="max-w-xl mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-lg grid place-items-center bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome to Wealth OS</div>
          <div className="font-semibold">Personal Wealth Operating System</div>
        </div>
      </div>
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Step {step + 1} of {steps.length}</div>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{cur.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{cur.sub}</p>
        <div className="h-1.5 w-full bg-secondary rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="mt-6">{cur.content}</div>
        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!cur.valid}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={!cur.valid || busy}>
              {busy ? "Finishing…" : "Enter Wealth OS"} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PickerSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}