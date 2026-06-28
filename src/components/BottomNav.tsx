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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden supports-[backdrop-filter]:bg-background/80">
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2">
        {items.map((i) => {
          const active = path === i.to;
          return (
            <li key={i.to}>
              <Link
                to={i.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-[10px] font-medium transition-all",
                  active
                    ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_22%,transparent)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <i.icon
                  className={cn("h-5 w-5", active && "drop-shadow-[0_0_10px_var(--color-primary)]")}
                />
                <span className="font-medium">{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
