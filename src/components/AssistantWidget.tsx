import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, X, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assetsQuery, incomeQuery, expensesQuery, goalsQuery } from "@/lib/queries";
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

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "aria.chat.v1";
const MAX_STORED = 40;

const STARTER_CHIPS = [
  "How am I doing this month?",
  "Where am I overspending?",
  "Suggest a rebalance for my portfolio.",
  "Which MMF fits me best right now?",
  "How close am I to my top goal?",
  "What's my safest path to KES 1M?",
];

function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_STORED);
  } catch {
    return [];
  }
}

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hi, I'm Aria — your Kenyan wealth copilot. I remember our past chats and see your live portfolio. Ask me anything, or pick a prompt below.",
};

export function AssistantWidget({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const stored = loadHistory();
    return stored.length ? stored : [WELCOME];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const send = useServerFn(chatWithAdvisor);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED))); } catch { /* quota */ }
  }, [msgs]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 60); }, [open]);

  async function submitText(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const payload = next.filter((m) => m.content !== WELCOME.content).slice(-20);
      const res = await send({ data: { messages: payload, context } });
      if ("error" in res) setMsgs([...next, { role: "assistant", content: `⚠️ ${res.error}` }]);
      else setMsgs([...next, { role: "assistant", content: res.content || "(no response)" }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: "Sorry — something went wrong." }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }

  function clearHistory() {
    setMsgs([WELCOME]);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }

  const showChips = msgs.filter((m) => m.role === "user").length === 0;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 hidden h-14 items-center gap-2 rounded-full px-4 text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.02] md:inline-flex"
          style={{ background: "var(--gradient-primary)" }}
          aria-label="Open AI assistant"
        >
          <Sparkles className="h-6 w-6" />
          <span className="pr-1 text-sm font-medium">Ask Aria</span>
        </button>
      )}
      {open && (
        <div
          className={cn(
            "fixed z-50 hidden overflow-hidden md:flex md:flex-col",
            "md:bottom-6 md:right-6 md:h-[600px] md:w-[400px]",
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
                <div className="flex items-center gap-2">
                  <button onClick={clearHistory} className="text-primary-foreground/80 hover:text-primary-foreground" aria-label="Clear conversation" title="Clear conversation">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-primary-foreground/80">
                Kenyan wealth copilot · remembers past chats · sees your live data.
              </p>
            </div>
            <div ref={scroller} className="flex-1 space-y-2 overflow-auto p-3">
              {msgs.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "border border-border bg-background/60",
                  )}
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
                  <span className="ml-1">Aria is thinking…</span>
                </div>
              )}
              {showChips && !busy && (
                <div className="pt-2">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Try a prompt</div>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_CHIPS.map((chip) => (
                      <button key={chip} onClick={() => submitText(chip)} className="text-xs rounded-full border border-border bg-secondary/40 hover:bg-secondary px-3 py-1.5 transition">
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border bg-background/70 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Memory: {Math.max(0, msgs.length - 1)} turns saved on this device.</span>
                <button onClick={clearHistory} className="inline-flex items-center gap-1 hover:text-foreground">
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitText(input)}
                  placeholder="Ask Aria…"
                  disabled={busy}
                />
                <Button onClick={() => submitText(input)} disabled={busy || !input.trim()} size="icon">
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
