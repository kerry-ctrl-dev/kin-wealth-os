import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const APP_QUERY_STALE_TIME = 60_000;
const PROFILE_QUERY_STALE_TIME = 5 * 60_000;

export const assetsQuery = () =>
  queryOptions({
    queryKey: ["assets"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const incomeQuery = () =>
  queryOptions({
    queryKey: ["income"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const goalsQuery = () =>
  queryOptions({
    queryKey: ["goals"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const alertsQuery = () =>
  queryOptions({
    queryKey: ["alerts"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

export const snapshotsQuery = () =>
  queryOptions({
    queryKey: ["snapshots"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("snapshots")
        .select("*")
        .order("date", { ascending: true })
        .limit(120);
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    staleTime: PROFILE_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const remindersQuery = () =>
  queryOptions({
    queryKey: ["reminders"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("next_due", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const expensesQuery = () =>
  queryOptions({
    queryKey: ["expenses"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const budgetsQuery = () =>
  queryOptions({
    queryKey: ["budgets"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const recurringQuery = () =>
  queryOptions({
    queryKey: ["recurring"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring")
        .select("*")
        .order("next_run", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const documentsQuery = () =>
  queryOptions({
    queryKey: ["documents"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const personalAssetsQuery = () =>
  queryOptions({
    queryKey: ["personal_assets"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personal_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const loansQuery = () =>
  queryOptions({
    queryKey: ["loans"],
    staleTime: APP_QUERY_STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("borrowed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
