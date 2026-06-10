import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Save, LogOut, Upload } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/avatar";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { useRef } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Wealth OS" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const profile = useQuery(profileQuery());
  const qc = useQueryClient();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "", profession: "", age: "", employment_status: "", monthly_income: "", risk_level: "", main_goals: "", investment_experience: "", phone: "", avatar_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarUrl = useAvatarUrl(form.avatar_url).data;

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
      phone: (profile.data as { phone?: string }).phone ?? "",
      avatar_url: profile.data.avatar_url ?? "",
    });
  }, [profile.data]);

  async function handleAvatar(file: File) {
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const path = await uploadAvatar(file, u.user.id);
      setForm((f) => ({ ...f, avatar_url: path }));
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", u.user.id);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["avatar-url"] });
      toast.success("Photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  }

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
      phone: form.phone || null,
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
      <SectionHeading title="Settings" sub="Manage your profile and preferences" />

      <div className="fintech-card p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-20 w-20 rounded-full grid place-items-center bg-primary/15 text-primary text-xl font-semibold border border-border">
              {(form.full_name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Change photo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG/PNG, up to a few MB.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name"><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
          <Field label="Phone number"><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 7…" /></Field>
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