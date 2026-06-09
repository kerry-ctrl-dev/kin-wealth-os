import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { AssistantWidget } from "@/components/AssistantWidget";
import { useEffect } from "react";
import { processDueRecurring } from "@/lib/recurring-runner";
import logo from "@/assets/logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => { processDueRecurring().catch(() => {}); }, []);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-background/60 backdrop-blur px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <img src={logo} alt="" className="h-6 w-6" />
              <span className="text-sm font-medium tracking-tight">Personal Wealth OS</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">· Cloud-powered investing</span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto pb-24 md:pb-8">
            {children}
          </main>
          <BottomNav />
          <AssistantWidget />
        </div>
      </div>
    </SidebarProvider>
  );
}