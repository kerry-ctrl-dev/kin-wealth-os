import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, X, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assetsQuery, incomeQuery, expensesQuery, goalsQuery, profileQuery } from "@/lib/queries";
import {
  fmtKES,
  totalIncome,
  totalValue,
  byCategory,
  computeRoi,
  liquidityRatio,
} from "@/lib/finance";
import { chatWithAdvisor } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type Msg = { role: "user" | "assistant"; content: string };

type OnboardStep =
  | { key: "main_goals"; prompt: string }
  | { key: "risk_level"; prompt: string }
  | { key: "income_cadence"; prompt: string }
  | { key: "holdings"; prompt: string };

const ONBOARD_STEPS: OnboardStep[] = [
  { key: "main_goals", prompt: "Karibu! I'm Aria. Let's set up your Kenyan wealth profile in 4 quick questions.\n\n1️⃣ What are your top 1–3 financial goals right now? (e.g. Buy land in Kiambu by 2028, build KES 500k emergency fund, quit employment in 5 years)" },
  { key: "risk_level", prompt: "2️⃣ How much investment risk feel right for you — LOW (mostly MMF/T-bills), MEDIUM (mixed with NSE/REITs), or HIGH (heavy stocks/alt)?" },
  { key: "income_cadence", prompt: "3️⃣ How is your income paid? (monthly salary, weekly/daily hustle, commission, business, mixed…)" },
  { key: "holdings", prompt: "4️⃣ Roughly, what do you already hold today? (KES in M-Pesa/bank, MMF at Cytonn/Sanlam/etc, NSE stocks, SACCO shares, land/property, etc.)" },
];

export function AssistantWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Aria — your financial assistant. Ask me anything about your portfolio, goals, or spending.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [onboarding, setOnboarding] = useState<{ step: number; answers: Record<string, string> } | null>(null);
  const qc = useQueryClient();
  const profile = useQuery({ ...profileQuery(), enabled: open });
  const send = useServerFn(chatWithAdvisor);
  const scroller = useRef<HTMLDivElement>(null);

  // Draggable floating button — position persisted per device.
  const POS_KEY = "malingu:aria:pos";
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(POS_KEY);
      return raw ? (JSON.parse(raw) as { x: number; y: number }) : null;
    } catch {
      return null;
    }
  });
  const dragState = useRef<{
    id: number;
    dx: number;
    dy: number;
    moved: boolean;
  } | null>(null);

  const clamp = (x: number, y: number, w = 64, h = 56) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: Math.min(Math.max(8, x), vw - w - 8),
      y: Math.min(Math.max(8, y), vh - h - 8),
    };
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragState.current = {
      id: e.pointerId,
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const s = dragState.current;
    if (!s || s.id !== e.pointerId) return;
    const nx = e.clientX - s.dx;
    const ny = e.clientY - s.dy;
    if (!s.moved && (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2)) s.moved = true;
    const w = e.currentTarget.offsetWidth;
    const h = e.currentTarget.offsetHeight;
    setPos(clamp(nx, ny, w, h));
  }, []);
  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const s = dragState.current;
      dragState.current = null;
      if (!s) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (pos) {
        try {
          window.localStorage.setItem(POS_KEY, JSON.stringify(pos));
        } catch {
          /* ignore */
        }
      }
      if (!s.moved) setOpen(true);
    },
    [pos],
  );
  // Keep in-view on resize.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setPos((p) => (p ? clamp(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const assets = useQuery({ ...assetsQuery(), enabled: open });
  const income = useQuery({ ...incomeQuery(), enabled: open });
  const expenses = useQuery({ ...expensesQuery(), enabled: open });
  const goals = useQuery({ ...goalsQuery(), enabled: open });

  const context = useMemo(() => {
    if (!open) return "";
    const a = assets.data ?? [],
      i = income.data ?? [],
      e = expenses.data ?? [],
      g = goals.data ?? [];
    const cats = byCategory(a);
    const monthSpend = e
      .filter((x) => new Date(x.date).getMonth() === new Date().getMonth())
      .reduce((s, x) => s + Number(x.amount), 0);
    const monthIncome = i
      .filter((x) => new Date(x.date).getMonth() === new Date().getMonth())
      .reduce((s, x) => s + Number(x.amount), 0);
    return [
      `Total assets: ${fmtKES(totalValue(a))}`,
      `Total invested: ${fmtKES(totalIncome(i))}`,
      `ROI: ${computeRoi(a, i).toFixed(2)}%`,
      `Liquidity ratio: ${(liquidityRatio(a) * 100).toFixed(1)}%`,
      `Allocation: MMF ${fmtKES(cats.MMF)}, Stocks ${fmtKES(cats.STOCKS)}, REITs ${fmtKES(cats.REITS)}, Cash ${fmtKES(cats.CASH)}, Real Estate ${fmtKES(cats.REAL_ESTATE)}`,
      `This month income: ${fmtKES(monthIncome)} | expenses: ${fmtKES(monthSpend)} | net: ${fmtKES(monthIncome - monthSpend)}`,
      `Active goals (${g.length}): ${g
        .slice(0, 5)
        .map((x) => `${x.name} ${fmtKES(Number(x.current))}/${fmtKES(Number(x.target))}`)
        .join("; ")}`,
    ].join("\n");
  }, [open, assets.data, income.data, expenses.data, goals.data]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [msgs, open]);

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    // Onboarding capture
    if (onboarding) {
      const cur = ONBOARD_STEPS[onboarding.step];
      const nextAnswers = { ...onboarding.answers, [cur.key]: text };
      const nextMsgs: Msg[] = [...msgs, { role: "user", content: text }];
      setInput("");
      if (onboarding.step + 1 < ONBOARD_STEPS.length) {
        const next = ONBOARD_STEPS[onboarding.step + 1];
        setMsgs([...nextMsgs, { role: "assistant", content: next.prompt }]);
        setOnboarding({ step: onboarding.step + 1, answers: nextAnswers });
      } else {
        setBusy(true);
        try {
          const { data: u } = await supabase.auth.getUser();
          if (u.user) {
            const risk = /HIGH/i.test(nextAnswers.risk_level ?? "") ? "HIGH" : /LOW/i.test(nextAnswers.risk_level ?? "") ? "LOW" : "MEDIUM";
            const combinedGoals = `${nextAnswers.main_goals}\n\nIncome cadence: ${nextAnswers.income_cadence}\nCurrent holdings: ${nextAnswers.holdings}`;
            await supabase.from("profiles").update({
              main_goals: combinedGoals,
              risk_level: risk,
              onboarded: true,
            }).eq("id", u.user.id);
            qc.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Your profile is saved");
          }
          setMsgs([
            ...nextMsgs,
            {
              role: "assistant",
              content: `Asante! I've saved your setup to your dashboard profile.\n\nQuick take on what you shared:\n• Risk: ${nextAnswers.risk_level}\n• Cadence: ${nextAnswers.income_cadence}\n\nBased on Kenyan mid-2026 rates, a common starting split is 40% MMF (net ~9–12%), 30% NSE bluechips (SCOM, EQTY, KCB), 15% REITs (ILAM, Acorn) and 15% cash buffer — tune to your risk. Ask me anything to go deeper.`,
            },
          ]);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not save profile");
        } finally {
          setBusy(false);
          setOnboarding(null);
        }
      }
      return;
    }
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await send({ data: { messages: next, context } });
      if ("error" in res) setMsgs([...next, { role: "assistant", content: `⚠️ ${res.error}` }]);
      else setMsgs([...next, { role: "assistant", content: res.content || "(no response)" }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: "Sorry — something went wrong." }]);
    } finally {
      setBusy(false);
    }
  }

  function startOnboarding() {
    setOnboarding({ step: 0, answers: {} });
    setMsgs((m) => [...m, { role: "assistant", content: ONBOARD_STEPS[0].prompt }]);
  }

  const showOnboardCta = open && !onboarding && profile.data && !profile.data.main_goals;

  return (
    <>
      {!open && (
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "z-40 inline-flex h-14 touch-none select-none items-center gap-2 rounded-full px-4 text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.02] active:scale-[0.98]",
            pos ? "fixed" : "fixed bottom-24 right-4 md:bottom-6 md:right-6",
          )}
          style={{
            background: "var(--gradient-primary)",
            ...(pos ? { left: pos.x, top: pos.y } : null),
            cursor: "grab",
          }}
          aria-label="Open AI assistant — drag to move"
          title="Drag to move · tap to open"
        >
          <Sparkles className="h-6 w-6" />
          <span className="pr-1 text-sm font-medium">Ask Aria</span>
        </button>
      )}
      {open && (
        <div
          className={cn(
            "fixed z-50 overflow-hidden",
            "inset-x-3 bottom-24 h-[70vh]",
            "md:inset-x-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[400px]",
          )}
        >
          <div className="fintech-card flex h-full flex-col overflow-hidden">
            <div
              className="border-b border-border p-4"
              style={{ background: "var(--gradient-primary)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-primary-foreground">
                  <Sparkles className="h-4 w-4" /> Aria · AI Assistant
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-primary-foreground/80">
                Ask about portfolio health, spending patterns, goals, or next moves.
              </p>
            </div>
            <div ref={scroller} className="flex-1 space-y-2 overflow-auto p-3">
              {showOnboardCta && (
                <button
                  onClick={startOnboarding}
                  className="w-full rounded-xl border border-primary/40 bg-primary/10 p-3 text-left text-sm hover:bg-primary/15"
                >
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Wand2 className="h-4 w-4" /> Start Kenyan onboarding (4 questions)
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Aria will collect your goals, risk, income cadence and current holdings, then save them to your profile.
                  </div>
                </button>
              )}
              {msgs.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto border border-primary/30 bg-primary/15"
                      : "border border-border bg-background/50",
                  )}
                >
                  {m.content}
                </div>
              ))}
              {busy && <div className="text-xs text-muted-foreground">Aria is thinking…</div>}
            </div>
            <div className="border-t border-border bg-background/70 p-3">
              <div className="mb-2 text-[11px] text-muted-foreground">
                {onboarding
                  ? `Setup ${onboarding.step + 1}/${ONBOARD_STEPS.length} — answer to continue.`
                  : "Context loads only when the assistant opens, keeping the rest of the app faster."}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={onboarding ? "Type your answer…" : "Ask Aria…"}
                  disabled={busy}
                />
                <Button onClick={submit} disabled={busy || !input.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
