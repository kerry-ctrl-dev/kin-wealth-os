import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AssistantWidget } from "@/components/AssistantWidget";
import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const pageTitles = [
  ["/dashboard", "Dashboard"],
  ["/charts", "Analytics"],
  ["/reports", "Reports"],
  ["/income", "Income"],
  ["/expenses", "Expenses"],
  ["/budgets", "Budgets"],
  ["/goals", "Goals"],
  ["/reminders", "Reminders"],
  ["/calendar", "Calendar"],
  ["/portfolio", "Investments"],
  ["/personal-assets", "Assets Manager"],
  ["/loans", "Loans"],
  ["/projections", "Projections"],
  ["/assistant", "AI Assistant"],
  ["/alerts", "Alerts"],
  ["/appearance", "Appearance"],
  ["/settings", "Settings"],
] as const;

function getPageTitle(pathname: string) {
  return pageTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1]
    ?? "Your wealth";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <SidebarProvider defaultOpen={false} className="gradient-mesh min-h-svh bg-background">
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-transparent">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl sm:px-6">
          <SidebarTrigger aria-label="Toggle navigation" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase text-muted-foreground">
              MalinGu · Personal Wealth
            </p>
            <h1 className="truncate text-base font-semibold sm:text-lg">{getPageTitle(pathname)}</h1>
          </div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-[color:var(--emerald)]" />
            Private workspace
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </main>
      </SidebarInset>
      <AssistantWidget />
    </SidebarProvider>
  );
}