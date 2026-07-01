import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Award,
  Bell,
  BellRing,
  Calendar,
  Coins,
  FileText,
  FolderLock,
  Home as HomeIcon,
  LayoutDashboard,
  LineChart,
  LogOut,
  PieChart,
  ReceiptText,
  Repeat,
  Settings,
  Sparkles,
  Target,
  Wallet,
  Wallet as WalletIcon,
} from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileQuery } from "@/lib/queries";
import { useAvatarUrl } from "@/hooks/use-avatar-url";

const sections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, hint: "Daily summary" },
      { title: "Analytics", url: "/charts", icon: LineChart, hint: "Performance trends" },
      { title: "Reports", url: "/reports", icon: FileText, hint: "Exports and insights" },
      { title: "Alerts", url: "/alerts", icon: Bell, hint: "Watch important changes" },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Income", url: "/income", icon: Wallet, hint: "Track earnings" },
      { title: "Expenses", url: "/expenses", icon: ReceiptText, hint: "Monitor spending" },
      { title: "Budgets", url: "/budgets", icon: WalletIcon, hint: "Plan monthly limits" },
      { title: "Goals", url: "/goals", icon: Target, hint: "Save with purpose" },
      { title: "Recurring", url: "/recurring", icon: Repeat, hint: "Automate entries" },
      { title: "Reminders", url: "/reminders", icon: BellRing, hint: "Stay on top of tasks" },
      { title: "Calendar", url: "/calendar", icon: Calendar, hint: "See upcoming items" },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { title: "Investments", url: "/portfolio", icon: PieChart, hint: "Allocation and holdings" },
      {
        title: "Personal Assets",
        url: "/personal-assets",
        icon: HomeIcon,
        hint: "Property and valuables",
      },
      { title: "Loans", url: "/loans", icon: Coins, hint: "Debts and lending" },
      { title: "Projections", url: "/projections", icon: Activity, hint: "Forward planning" },
      { title: "Vault", url: "/vault", icon: FolderLock, hint: "Important documents" },
      { title: "Achievements", url: "/achievements", icon: Award, hint: "Progress milestones" },
      { title: "AI Assistant", url: "/assistant", icon: Sparkles, hint: "Ask Aria" },
      { title: "Settings", url: "/settings", icon: Settings, hint: "Profile and preferences" },
    ],
  },
] as const;

export function AppSidebar() {
  const { isMobile, setOpenMobile, state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery(profileQuery());

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
  const avatarUrl = useAvatarUrl(profile.data?.avatar_url).data;
  const memberLabel = profile.data?.full_name ?? "Your financial workspace";

  function handleNavigate() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-sidebar-border bg-sidebar-accent/40">
            <img src={logo} alt="Wealth OS logo" className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">Wealth OS</div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Calm money management
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="px-3 pb-4">
            <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/35 p-3.5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full border border-sidebar-border object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{first}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{profession}</div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-sidebar-border bg-background/35 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Workspace
                </div>
                <div className="mt-1 truncate text-sm text-sidebar-foreground">{memberLabel}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Start from the dashboard, then dive into the areas that need attention.
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="h-auto rounded-xl px-2.5 py-2.5 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                      >
                        <Link
                          to={item.url}
                          className="flex items-start gap-3"
                          onClick={handleNavigate}
                        >
                          <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{item.title}</span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {item.hint}
                              </span>
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="rounded-xl">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
