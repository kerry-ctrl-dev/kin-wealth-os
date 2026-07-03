import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  LogOut,
  Upload,
  Palette,
  Type,
  Sun,
  Moon,
  Monitor,
  AlertTriangle,
  Trash2,
  Check,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/delete-account.functions";
import {
  ACCENTS,
  FONT_SIZES,
  FONT_STACKS,
  applyAppearance,
  loadAppearance,
  saveAppearance,
  watchSystemTheme,
  type AccentKey,
  type Appearance,
  type FontFamilyKey,
  type FontSizeKey,
  type ThemeMode,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/SectionHeading";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { profileQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/avatar";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { useRef } from "react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — MalinGu" }] }),
  component: SettingsPage,
});

function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function SettingsPage() {
  const profile = useQuery(profileQuery());
  const qc = useQueryClient();
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    profession: "",
    age: "",
    employment_status: "",
    monthly_income: "",
    risk_level: "",
    main_goals: "",
    investment_experience: "",
    phone: "",
    avatar_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarUrl = useAvatarUrl(form.avatar_url).data;
  const safeAvatarUrl = isSafeImageUrl(avatarUrl) ? avatarUrl : null;

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
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        profession: form.profession || null,
        age: form.age ? Number(form.age) : null,
        employment_status: form.employment_status || null,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        risk_level: form.risk_level || null,
        main_goals: form.main_goals || null,
        investment_experience: form.investment_experience || null,
        phone: form.phone || null,
      })
      .eq("id", u.user.id);
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
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <SectionHeading title="Settings" sub="Manage your profile and preferences" />

      <div className="fintech-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold tracking-tight">Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your details up to date so the dashboard stays personalized.
            </p>
          </div>
          <div className="h-10 w-10 rounded-2xl border border-border/70 bg-background/35 grid place-items-center text-muted-foreground">
            <SettingsIcon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {safeAvatarUrl ? (
            <img
              src={safeAvatarUrl}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover border border-border/70 shadow-[var(--shadow-soft)]"
            />
          ) : (
            <div className="h-20 w-20 rounded-full grid place-items-center bg-primary/15 text-primary text-xl font-semibold border border-border/70 shadow-[var(--shadow-soft)]">
              {(form.full_name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Change photo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG/PNG, up to a few MB.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field label="Phone number">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+254 7…"
            />
          </Field>
          <Field label="Profession">
            <Input
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
            />
          </Field>
          <Field label="Age">
            <Input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </Field>
          <Field label="Monthly income (KES)">
            <Input
              type="number"
              value={form.monthly_income}
              onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
            />
          </Field>
          <Field label="Employment status">
            <Select
              value={form.employment_status}
              onValueChange={(v) => setForm({ ...form, employment_status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="self_employed">Self-employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Risk preference">
            <Select
              value={form.risk_level}
              onValueChange={(v) => setForm({ ...form, risk_level: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Investment experience">
            <Select
              value={form.investment_experience}
              onValueChange={(v) => setForm({ ...form, investment_experience: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Main financial goals">
          <Textarea
            rows={3}
            value={form.main_goals}
            onChange={(e) => setForm({ ...form, main_goals: e.target.value })}
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-muted-foreground">
            Changes save to your profile immediately and update your dashboard.
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="fintech-card p-6 sm:p-7">
        <h2 className="font-semibold tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign out from this device.</p>
        <Button variant="outline" className="mt-4" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <AppearanceSection />
      <DangerZone />
    </div>
  );
}

function AppearanceSection() {
  const [appearance, setAppearance] = useState<Appearance>(() => loadAppearance());

  useEffect(() => {
    applyAppearance(appearance);
    saveAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    if (appearance.theme !== "system") return;
    return watchSystemTheme(() => applyAppearance(appearance));
  }, [appearance]);

  return (
    <div className="fintech-card space-y-6 p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize the theme, typography and accent colours of your workspace.
          </p>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Theme</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              { key: "light", label: "Light", icon: Sun },
              { key: "dark", label: "Dark", icon: Moon },
              { key: "system", label: "System", icon: Monitor },
            ] as { key: ThemeMode; label: string; icon: typeof Sun }[]
          ).map((opt) => {
            const active = appearance.theme === opt.key;
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setAppearance({ ...appearance, theme: opt.key })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/70 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Font style
          </Label>
          <Select
            value={appearance.font}
            onValueChange={(v: FontFamilyKey) => setAppearance({ ...appearance, font: v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FONT_STACKS) as FontFamilyKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  <span style={{ fontFamily: FONT_STACKS[k].stack }}>{FONT_STACKS[k].label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Font size
          </Label>
          <Select
            value={appearance.size}
            onValueChange={(v: FontSizeKey) => setAppearance({ ...appearance, size: v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {FONT_SIZES[k].label} · {FONT_SIZES[k].px}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">
          Accent colour
        </Label>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {(Object.keys(ACCENTS) as AccentKey[]).map((k) => {
            const a = ACCENTS[k];
            const active = appearance.accent === k;
            return (
              <button
                key={k}
                type="button"
                title={a.label}
                onClick={() => setAppearance({ ...appearance, accent: k })}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-2xl border transition",
                  active
                    ? "border-foreground/70 ring-2 ring-offset-2 ring-offset-background"
                    : "border-border/70 hover:border-foreground/40",
                )}
                style={{ background: a.swatch }}
              >
                {active && <Check className="h-4 w-4 text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Applies instantly across the app, charts and sidebar.
        </p>
      </div>
    </div>
  );
}

function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();
  const deleteFn = useServerFn(deleteMyAccount);

  async function runDelete() {
    if (confirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type "DELETE" to confirm');
      return;
    }
    setBusy(true);
    try {
      await deleteFn();
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      toast.success("Your account has been deleted");
      nav({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete account");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 sm:p-7">
      <h2 className="flex items-center gap-2 font-semibold tracking-tight text-destructive">
        <AlertTriangle className="h-4 w-4" /> Danger zone
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Permanently delete your MalinGu account and every record — income, expenses,
        investments, goals, loans, reminders and documents. This action cannot be undone.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="mt-4">
            <Trash2 className="h-4 w-4" /> Delete my account
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Delete account forever?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            All your data will be erased permanently. To confirm, type{" "}
            <span className="font-mono font-semibold text-foreground">DELETE</span> below.
          </p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="font-mono"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={runDelete} disabled={busy}>
              {busy ? "Deleting…" : "Yes, delete forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
