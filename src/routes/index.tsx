import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, BarChart3, PieChart, Target, Bell, ArrowRight, Wallet, Sparkles,
  ReceiptText, Activity, Repeat, Play, ChevronDown,
} from "lucide-react";
import logo from "@/assets/logo.png";
import hero from "@/assets/landing-hero.jpg";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MalinGu — Your wealth, in one place" },
      { name: "description", content: "Track investments, spending and goals. Get AI answers in seconds. Built for Kenya." },
      { property: "og:title", content: "MalinGu" },
      { property: "og:description", content: "Track investments, spending and goals. Get AI answers in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky transparent → solid header */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-black/60 backdrop-blur-xl saturate-150 border-b border-white/10" : "bg-gradient-to-b from-black/80 to-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="font-bold tracking-tight text-lg">Malin<span className="text-primary">Gu</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm" className="text-white hover:bg-white/10">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-gold">Start free</Button></Link>
          </div>
        </div>
      </header>

      {/* Cinematic hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-black/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-24 morph-in">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> Mali Yangu · My Wealth
            </span>
            <h1 className="mt-4 text-5xl sm:text-7xl font-black tracking-tight leading-[1.02] drop-shadow-2xl">
              Your Wealth.<br/>Your Future.<br/><span className="text-primary">Your Control.</span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/80 max-w-md">
              Investments, spending and goals — one dashboard, one clear picture.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 morph-in-delayed">
              <Link to="/auth"><Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold h-12 px-6 glow-gold">
                <Play className="h-5 w-5 fill-current" /> Start free
              </Button></Link>
              <a href="#features"><Button size="lg" variant="outline" className="glass-morph bg-white/10 border-white/30 text-white hover:bg-white/20 h-12 px-6">See how it works</Button></a>
            </div>
            <p className="mt-4 text-xs text-white/60">Free. No card needed.</p>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* Feature row 1 */}
      <FeatureRow
        title="Everything you need to grow"
        items={[
          { icon: PieChart, title: "Investments", body: "NSE, MMFs, REITs. Real ROI." },
          { icon: ReceiptText, title: "Expenses", body: "Every shilling, tracked." },
          { icon: Wallet, title: "Budgets", body: "Caps that warn you early." },
          { icon: Target, title: "Goals", body: "Targets with the math done." },
          { icon: Activity, title: "Projections", body: "See your future net worth." },
          { icon: Repeat, title: "Recurring", body: "Salary, rent, subs — on autopilot." },
        ]}
      />

      {/* Feature row 2 */}
      <FeatureRow
        title="Intelligence built in"
        items={[
          { icon: Sparkles, title: "Aria AI", body: "Ask anything. Answers in seconds.", featured: true },
          { icon: BarChart3, title: "Live Analytics", body: "Allocation, liquidity, risk." },
          { icon: Bell, title: "Smart Alerts", body: "Warnings before it hurts." },
          { icon: ShieldCheck, title: "Private by Design", body: "Your data, yours alone." },
        ]}
      />

      {/* Big visual band */}
      <section className="relative py-24 px-4 sm:px-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto text-center morph-in">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">Money, without the spreadsheets.</h2>
          <p className="mt-5 text-lg text-white/70 max-w-xl mx-auto">One place for income, investments, spending and advice.</p>
          <div className="mt-8"><Link to="/auth"><Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 px-8 glow-gold">Open my dashboard <ArrowRight className="h-4 w-4" /></Button></Link></div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-8 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-10">Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="glass-morph border-0 px-5">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-white/70">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-12 text-center">
            <p className="text-white/70 mb-4">Ready when you are.</p>
            <Link to="/auth"><Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-semibold glow-gold">Create my account <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 px-4 sm:px-8 text-center text-sm text-white/50">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src={logo} alt="" className="h-6 w-6" />
          <span className="font-semibold text-white">MalinGu</span>
        </div>
        © {new Date().getFullYear()} MalinGu
      </footer>
    </div>
  );
}

type FeatureItem = { icon: React.ComponentType<{ className?: string }>; title: string; body: string; featured?: boolean };

function FeatureRow({ title, items }: { title: string; items: FeatureItem[] }) {
  return (
    <section id="features" className="py-12 sm:py-16 px-4 sm:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">{title}</h2>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 -mx-4 sm:mx-0 px-4 sm:px-0 snap-x snap-mandatory">
          {items.map((f) => (
            <div
              key={f.title}
              className={`group glass-morph shrink-0 w-[78%] sm:w-[300px] aspect-[16/10] overflow-hidden relative snap-start hover:z-10 ${f.featured ? "bg-gradient-to-br from-primary/40 to-accent/30" : ""}`}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <f.icon className={`h-7 w-7 mb-3 ${f.featured ? "text-white" : "text-primary"}`} />
                <h3 className="font-bold text-lg leading-tight">{f.title}</h3>
                <p className="text-sm text-white/70 mt-1 leading-snug">{f.body}</p>
              </div>
              {f.featured && <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded">New</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  { q: "Is it free?", a: "Yes — the full app, no cost." },
  { q: "Is my data private?", a: "Row-level isolation. Only you can see it." },
  { q: "What does Aria see?", a: "A summary of your portfolio — never your documents." },
  { q: "Which currency?", a: "KES first. Multi-currency is on the roadmap." },
  { q: "Can I leave?", a: "Delete your account in Settings and your data goes with it." },
];
