import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Wallet, PieChart, Target, LineChart, Bell, LogOut, TrendingUp,
  Sparkles, BellRing, ListChecks, FileText, Calendar, Award, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileQuery, incomeQuery, remindersQuery, assetsQuery } from "@/lib/queries";
import { computeStreak, disciplineScore } from "@/lib/personalization";
import { byCategory, liquidityRatio, totalValue } from "@/lib/finance";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Income", url: "/income", icon: Wallet },
  { title: "Investments", url: "/portfolio", icon: PieChart },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Analytics", url: "/charts", icon: LineChart },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Reminders", url: "/reminders", icon: BellRing },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Achievements", url: "/achievements", icon: Award },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery(profileQuery());
  const income = useQuery(incomeQuery());
  const assets = useQuery(assetsQuery());
  const reminders = useQuery(remindersQuery());

  const a = assets.data ?? [];
  const total = totalValue(a) || 1;
  const stocksConc = byCategory(a).STOCKS / total;
  const streak = computeStreak((income.data ?? []).map((x) => x.date));
  const reminderTotal = (reminders.data ?? []).length || 1;
  const reminderDone = (reminders.data ?? []).filter((r) => r.completed).length;
  const { score } = disciplineScore({
    streakMonths: streak,
    liquidityRatio: liquidityRatio(a),
    avgGoalProgress: 0.4,
    reminderCompletionRate: reminderDone / reminderTotal,
    stocksConcentration: stocksConc,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const fullName = profile.data?.full_name ?? "Investor";
  const first = fullName.trim().split(/\s+/)[0];
  const initials = first.slice(0, 2).toUpperCase();
  const profession = profile.data?.profession ?? "—";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg grid place-items-center bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
            <TrendingUp className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">Wealth OS</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Fintech</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="px-2 pb-3">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex items-center gap-3">
                {profile.data?.avatar_url ? (
                  <img src={profile.data.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover border border-sidebar-border" />
                ) : (
                  <div className="h-9 w-9 rounded-full grid place-items-center bg-primary/15 text-primary text-xs font-semibold">{initials}</div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{first}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{profession}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-md bg-background/40 border border-sidebar-border px-2 py-1.5">
                  <div className="text-muted-foreground uppercase tracking-wider">Score</div>
                  <div className="text-sm font-semibold metric-value">{score}<span className="text-muted-foreground">/100</span></div>
                </div>
                <div className="rounded-md bg-background/40 border border-sidebar-border px-2 py-1.5">
                  <div className="text-muted-foreground uppercase tracking-wider">Streak</div>
                  <div className="text-sm font-semibold metric-value flex items-center gap-1">{streak}<span className="text-muted-foreground">mo</span> {streak >= 3 && <span>🔥</span>}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}