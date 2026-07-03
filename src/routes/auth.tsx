import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { lovable } from "@/integrations/lovable";

// Validation rules
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/;
const PASSWORD_PATTERN_MESSAGE =
  "Password must contain uppercase, lowercase, number, and special character";

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation helper
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return { valid: false, error: PASSWORD_PATTERN_MESSAGE };
  }
  return { valid: true };
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MalinGu" },
      {
        name: "description",
        content: "Sign in or create an account to access your wealth dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        if (data.user) navigate({ to: "/dashboard", replace: true });
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  async function signIn(email: string, password: string) {
    // Validate input
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      // Don't expose internal error details
      const errorMessage = error.message.includes("credentials")
        ? "Invalid email or password"
        : "Sign in failed. Please try again.";
      return toast.error(errorMessage);
    }

    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(email: string, password: string) {
    // Validate input
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.error);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) {
      setLoading(false);
      const errorMessage = error.message.includes("already registered")
        ? "This email is already registered"
        : "Sign up failed. Please try again.";
      return toast.error(errorMessage);
    }
    setLoading(false);

    if (data.session) {
      toast.success("Welcome to MalinGu");
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    toast.success("Account created. Check your email to finish signing in.");
  }

  async function signInWithGoogle() {
    // Use HTTPS-only redirect URI
    const redirectUri = window.location.origin;
    if (!redirectUri.startsWith("https://") && !redirectUri.startsWith("http://localhost")) {
      toast.error("Insecure connection detected. Please use HTTPS.");
      return;
    }

    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUri,
    });

    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }

    if (result.redirected) return;
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  }

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="fintech-card w-full max-w-sm p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Preparing your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Checking your account so we can send you to the right place.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,560px)]">
      <div className="relative hidden overflow-hidden border-r border-border lg:flex">
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-primary)", opacity: 0.14 }}
        />
        <div className="flex w-full flex-col justify-between p-12">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold tracking-tight">MalinGu</div>
                <div className="text-xs text-muted-foreground">
                  Disciplined investing, clearer decisions
                </div>
              </div>
            </Link>
            <div className="rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
              Faster sign-in flow
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built to stay calm, fast, and focused
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight">
              A smoother way to plan, track, and grow your money.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Review your portfolio, cash flow, goals, and upcoming actions in one cleaner workspace
              designed to stay quick as your data grows.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Private by default"
                copy="Protected with authenticated access and row-level security."
              />
              <FeatureCard
                icon={<BarChart3 className="h-4 w-4" />}
                title="Actionable insights"
                copy="Track ROI, liquidity, and portfolio health in one place."
              />
              <FeatureCard
                icon={<TrendingUp className="h-4 w-4" />}
                title="Built for momentum"
                copy="Move from setup to your dashboard with less friction."
              />
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <TrustRow label="Setup time" value="Under 2 minutes" />
            <TrustRow label="What you get" value="Portfolio, goals, spending, and alerts" />
            <TrustRow label="Best for" value="Students, founders, and early investors" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">MalinGu</div>
              <div className="text-xs text-muted-foreground">Cleaner money decisions</div>
            </div>
          </div>

          <div className="fintech-card p-6 sm:p-8">
            <div className="rounded-2xl border border-border/70 bg-background/35 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Welcome back
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Sign in or create your account
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Keep setup fast, then continue into your dashboard and personalized onboarding.
              </p>
            </div>

            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <AuthForm cta="Sign in" loading={loading} onSubmit={signIn} isSignUp={false} />
              </TabsContent>
              <TabsContent value="signup">
                <AuthForm
                  cta="Create account"
                  loading={loading}
                  onSubmit={signUp}
                  isSignUp={true}
                />
              </TabsContent>
            </Tabs>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-border/70 bg-background/45"
              disabled={loading}
              onClick={signInWithGoogle}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.6 0 9.3-3.8 9.3-9.3 0-.6 0-1.3-.1-1.9H12z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to use MalinGu for personal financial planning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthForm({
  cta,
  loading,
  onSubmit,
  isSignUp,
}: {
  cta: string;
  loading: boolean;
  isSignUp: boolean;
  onSubmit: (email: string, password: string) => unknown | Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp && value.length > 0) {
      const validation = validatePassword(value);
      setPasswordError(validation.valid ? null : validation.error || null);
    }
  };

  const passwordChecklist = useMemo(
    () => [
      {
        label: `${PASSWORD_MIN_LENGTH}+ characters`,
        valid: password.length >= PASSWORD_MIN_LENGTH,
      },
      { label: "Uppercase and lowercase", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
      { label: "Number and symbol", valid: /\d/.test(password) && /[@$!%*?&]/.test(password) },
    ],
    [password],
  );

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email.trim(), password);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder={isSignUp ? "Minimum 12 characters with a symbol" : "Enter your password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {isSignUp ? (
          <div className="rounded-xl border border-border/70 bg-background/30 p-3">
            <div className="text-xs font-medium text-foreground">Password requirements</div>
            <div className="mt-2 space-y-2 text-xs">
              {passwordChecklist.map((item) => (
                <div
                  key={item.label}
                  className={item.valid ? "text-[color:var(--success)]" : "text-muted-foreground"}
                >
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {passwordError && (
              <p className="mt-2 text-xs text-[color:var(--danger)]">{passwordError}</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use the email and password tied to your MalinGu account.
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading || (isSignUp && !!passwordError)}
        className="h-11 w-full rounded-xl"
      >
        {loading ? "Please wait…" : cta}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}

function FeatureCard({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4 backdrop-blur-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy}</div>
    </div>
  );
}

function TrustRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/35 px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
