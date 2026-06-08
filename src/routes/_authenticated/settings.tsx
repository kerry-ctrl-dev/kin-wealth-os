import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, LogOut } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Wealth OS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useQuery(profileQuery());
  const qc = useQueryClient();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "", profession: "", age: "", employment_status: "", monthly_income: "", risk_level: "", main_goals: "", investment_experience: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setForm({
      full_name: profile.data.full_name ?? "",
      profession: profile.data.profession ?? "",
      age: profile.data.age?.toString() ?? "",
      employment_status: profile.data.employment_status ?? "",
      monthly_income: profile.data.monthly_income?.toString() ?? "",
      risk_level: profile.data.risk_level ?? "",
      main_goals: profile.data.main_goals ?? "",
      investment_experience: profile.data.investment_experience ?? "",
    });
  }, [profile.data]);

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name || null,
      profession: form.profession || null,
      age: form.age ? Number(form.age) : null,
      employment_status: form.employment_status || null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      risk_level: form.risk_level || null,
      main_goals: form.main_goals || null,
      investment_experience: form.investment_experience || null,
    }).eq("id", u.user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeading title="Settings" sub="Manage your profile and preferences" icon={<SettingsIcon className="h-5 w-5" />} />

      <div className="fintech-card p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Profession"><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></Field>
          <Field label="Age"><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
          <Field label="Monthly income (KES)"><Input type="number" value={form.monthly_income} onChange={(e) => setForm({ ...form, monthly_income: e.target.value })} /></Field>
          <Field label="Employment status">
            <Select value={form.employment_status} onValueChange={(v) => setForm({ ...form, employment_status: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self_employed">Self-employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Risk preference">
            <Select value={form.risk_level} onValueChange={(v) => setForm({ ...form, risk_level: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Investment experience">
            <Select value={form.investment_experience} onValueChange={(v) => setForm({ ...form, investment_experience: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Main financial goals">
          <Textarea rows={3} value={form.main_goals} onChange={(e) => setForm({ ...form, main_goals: e.target.value })} />
        </Field>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>

      <div className="fintech-card p-6">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign out from this device.</p>
        <Button variant="outline" className="mt-3" onClick={signOut}><LogOut className="h-4 w-4" /> Sign out</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}