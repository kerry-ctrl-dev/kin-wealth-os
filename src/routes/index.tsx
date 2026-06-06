import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, ShieldCheck, BarChart3, PieChart, Target, Bell, ArrowRight, Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Personal Wealth OS — Cloud-powered investing dashboard" },
      { name: "description", content: "Track MMFs, NSE stocks, Acorn/Vuka REITs, ROI, liquidity and goals in one fintech dashboard for Kenyan investors." },
      { property: "og:title", content: "Personal Wealth OS" },
      { property: "og:description", content: "Cloud-powered wealth dashboard for disciplined investing." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-30 bg-background/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg grid place-items-center bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Personal Wealth OS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm">Get started <ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground px-3 py-1 rounded-full border border-border">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Cloud-powered fintech
        </span>
        <h1 className="mt-6 text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          Your wealth, on autopilot.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          A personal wealth operating system for disciplined Kenyan investors. MMFs, NSE stocks, REITs, ROI,
          liquidity, risk, goals — measured continuously.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth"><Button size="lg">Launch dashboard <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Wallet, title: "Auto 40 / 40 / 20", body: "Every shilling of income is split into MMF, NSE stocks and REITs automatically." },
          { icon: PieChart, title: "Live portfolio analytics", body: "Allocation, liquidity ratio and ROI computed on every change." },
          { icon: BarChart3, title: "Risk scoring", body: "Low / Medium / High based on exposure and liquidity — never fly blind." },
          { icon: Target, title: "Goal tracking", body: "Set targets, get monthly contribution suggestions to stay on track." },
          { icon: Bell, title: "Smart alerts", body: "Liquidity, volatility and performance alerts as your portfolio drifts." },
          { icon: ShieldCheck, title: "Bank-grade isolation", body: "Row-level security — your data is yours alone." },
        ].map((f) => (
          <div key={f.title} className="fintech-card p-6">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
