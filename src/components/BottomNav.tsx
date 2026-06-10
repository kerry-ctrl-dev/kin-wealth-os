import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, PieChart, ReceiptText, Sparkles, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/portfolio", icon: PieChart, label: "Invest" },
  { to: "/expenses", icon: ReceiptText, label: "Spend" },
  { to: "/loans", icon: Coins, label: "Loans" },
  { to: "/assistant", icon: Sparkles, label: "Aria" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = path === i.to;
          return (
            <li key={i.to}>
              <Link to={i.to} className={cn("flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                <i.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_var(--color-primary)]")} />
                <span className="font-medium">{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}