import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    // Gate onboarding (skip the redirect on the onboarding route itself)
    if (!location.pathname.startsWith("/onboarding")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile?.onboarded) throw redirect({ to: "/onboarding" });
    }
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isOnboarding) return <Outlet />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
