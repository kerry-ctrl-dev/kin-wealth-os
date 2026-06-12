import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, ShieldCheck, BarChart3 } from "lucide-react";
import { lovable } from "@/integrations/lovable";

// Validation rules
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/;
const PASSWORD_PATTERN_MESSAGE = "Password must contain uppercase, lowercase, number, and special character";

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
    const { error } = await supabase.auth.signUp({
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
    
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (signInErr) return toast.success("Account created. Please sign in.");
    toast.success("Welcome to Wealth OS");
    navigate({ to: "/dashboard", replace: true });
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
              <AuthForm cta="Sign in" loading={loading} onSubmit={signIn} isSignUp={false} />
            </TabsContent>
            <TabsContent value="signup">
              <AuthForm cta="Create account" loading={loading} onSubmit={signUp} isSignUp={true} />
            </TabsContent>
          </Tabs>
          <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={signInWithGoogle}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.6 0 9.3-3.8 9.3-9.3 0-.6 0-1.3-.1-1.9H12z" />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function AuthForm({
  cta, loading, onSubmit, isSignUp,
}: {
  cta: string;
  loading: boolean;
  isSignUp: boolean;
  onSubmit: (email: string, password: string) => unknown | Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp && value.length > 0) {
      const validation = validatePassword(value);
      setPasswordError(validation.valid ? null : validation.error || null);
    }
  };

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
        <Input
          id="password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          placeholder={isSignUp ? "Minimum 12 characters (uppercase, lowercase, number, symbol)" : "••••••••"}
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />
        {passwordError && isSignUp && (
          <p className="text-sm text-red-500">{passwordError}</p>
        )}
        {isSignUp && password.length > 0 && !passwordError && (
          <p className="text-sm text-green-500">✓ Password is strong</p>
        )}
      </div>
      <Button type="submit" disabled={loading || (isSignUp && !!passwordError)} className="w-full">
        {loading ? "Please wait…" : cta}
      </Button>
    </form>
  );
}
