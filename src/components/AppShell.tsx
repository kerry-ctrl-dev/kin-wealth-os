import { Suspense, lazy, type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import logo from "@/assets/logo.png";

const AssistantWidget = lazy(async () => {
  const mod = await import("@/components/AssistantWidget");
  return { default: mod.AssistantWidget };
});

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 sm:px-5">
            <SidebarTrigger />
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-2xl border border-border/70 bg-card/80 shadow-[var(--shadow-card)]">
                <img src={logo} alt="" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight sm:text-base">
                  MalinGu
                </div>
                <div className="hidden text-xs text-muted-foreground sm:block">
                  Cleaner investing workflows, portfolio tracking, and planning
                </div>
              </div>
            </div>
            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                Focus mode
              </div>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:py-8 md:pb-8">
            {children}
          </main>
          <BottomNav />
          <Suspense fallback={null}>
            <AssistantWidget />
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}
