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
// require at least one lower, one upper, one digit, one symbol, and only allowed chars
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
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
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
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

// Only allow same-origin relative paths as a post-login destination.
function safeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = safeNext(next);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  function goAfterAuth() {
    if (dest) {
      window.location.href = dest;
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        if (data.user) {
          if (dest) window.location.href = dest;
          else navigate({ to: "/dashboard", replace: true });
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, dest]);

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
    goAfterAuth();
  }

  // username is optional, only used on sign-up
  async function signUp(email: string, password: string, username?: string) {
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

    // If the auth returned a user immediately (e.g. magic link flow with session), store profile
    try {
      if (data?.user && username && username.trim()) {
        // Upsert profile with username
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: username.trim() });
      }
    } catch (e) {
      // non-fatal; profile can be created later in onboarding
      console.error("Failed to save username to profile", e);
    }

    setLoading(false);

    if (data?.session) {
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
          <p className="mt-2 text-sm text-muted-foreground">Checking your account...</p>
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
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-gold)] text-[color:var(--gold-foreground)] shadow-[var(--glow-gold)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold tracking-tight">MalinGu</div>
                <div className="text-xs text-muted-foreground">Disciplined investing</div>
              </div>
            </Link>
            <div className="rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs text-muted-foreground">Faster sign-in</div>
          </div>

          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--gold)]" />
              Built to stay calm and fast
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight">Plan, track, and grow your money.</h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">One workspace for portfolio, cash flow, and goals.</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Private by default"
                copy="Protected with authenticated access and row-level security."
              />
              <FeatureCard
                icon={<BarChart3 className="h-4 w-4" />}
                title="Actionable insights"
                copy="Track ROI, liquidity, and portfolio health."
              />
              <FeatureCard
                icon={<TrendingUp className="h-4 w-4" />}
                title="Built for momentum"
                copy="Move from setup to your dashboard quickly."
              />
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <TrustRow label="Setup time" value="Under 2 minutes" />
            <TrustRow label="What you get" value="Portfolio, goals, spending" />
            <TrustRow label="Best for" value="Students, founders" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[image:var(--gradient-gold)] text-[color:var(--gold-foreground)] shadow-[var(--glow-gold)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">MalinGu</div>
              <div className="text-xs text-muted-foreground">Cleaner money decisions</div>
            </div>
          </div>

          <div className="glass-panel animate-panel-in p-6 sm:p-8">
            <div className="rounded-2xl border border-[color:var(--glass-border)] bg-background/25 p-4 backdrop-blur-sm">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Welcome back</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in or create an account</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Quick setup, then your dashboard.</p>
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
                  cta="Create"
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
              className="h-11 w-full rounded-xl border-[color:var(--glass-border)] bg-background/45 backdrop-blur-sm"
              disabled={loading}
              onClick={signInWithGoogle}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                  fill="#EA4335"
                  d="M12 4.8c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.1 14.7 1.2 12 1.2 8 1.2 4.5 3.5 2.8 6.9l3.2 2.5C6.8 6.7 9.2 4.8 12 4.8z"
                />
                <path
                  fill="#4285F4"
                  d="M22.8 12.2c0-.8-.1-1.4-.2-2H12v3.9h6.1c-.1 1-.8 2.5-2.1 3.5l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.8z"
                />
                <path fill="#FBBC05" d="M6 9.4A6.9 6.9 0 0 0 5.6 12c0 .9.2 1.8.4 2.6L2.8 17.1A11 11 0 0 1 1.6 12c0-1.8.4-3.5 1.2-5.1L6 9.4z" />
                <path
                  fill="#34A853"
                  d="M12 22.8c3 0 5.4-1 7.1-2.8l-3.1-2.4c-.9.6-2.1 1-4 1-2.8 0-5.2-1.9-6-4.6l-3.2 2.5C4.5 20.5 8 22.8 12 22.8z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="mt-4 text-center text-xs text-muted-foreground">By continuing you agree to our terms.</div>
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
  onSubmit: (email: string, password: string, username?: string) => unknown | Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
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
        onSubmit(email.trim(), password, isSignUp ? username.trim() : undefined);
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

      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            autoComplete="username"
          />
        </div>
      )}

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
          <p className="text-xs text-muted-foreground">Use the email and password tied to your account.</p>
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
    <div className="glass-panel p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--emerald)]/15 text-[color:var(--emerald)]">
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
