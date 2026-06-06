import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, ShieldCheck, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Personal Wealth OS" },
      { name: "description", content: "Sign in or create an account to access your wealth dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) return toast.success("Account created. Please sign in.");
    toast.success("Welcome to Wealth OS");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-primary)", opacity: 0.18 }} />
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg grid place-items-center bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="font-semibold">Personal Wealth OS</span>
        </Link>
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            A cloud-powered wealth operating system for disciplined investing.
          </h1>
          <p className="text-muted-foreground">
            MMFs, NSE stocks, Acorn/Vuka REITs, liquidity, ROI and risk — all in one fintech dashboard built for the Kenyan student investor.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-primary" /> Bank-grade row-level security on your data</li>
            <li className="flex items-center gap-3"><BarChart3 className="h-4 w-4 text-primary" /> Auto 40/40/20 allocation engine</li>
            <li className="flex items-center gap-3"><TrendingUp className="h-4 w-4 text-primary" /> Live ROI, liquidity & risk scoring</li>
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">© Wealth OS · For educational use</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md fintech-card p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in or create an account to continue.</p>
          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <AuthForm cta="Sign in" loading={loading} onSubmit={signIn} />
            </TabsContent>
            <TabsContent value="signup">
              <AuthForm cta="Create account" loading={loading} onSubmit={signUp} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AuthForm({
  cta, loading, onSubmit,
}: {
  cta: string;
  loading: boolean;
  onSubmit: (email: string, password: string) => unknown | Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      className="space-y-4 mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email.trim(), password);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : cta}
      </Button>
    </form>
  );
}