import { createServerFn } from '@tanstack/react-start/server';
import { supabase } from '~/lib/supabase';
import type { Database } from '~/types/supabase';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];

export const getExpenses = createServerFn({ method: 'GET' })(
  async (
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      category?: string;
    }
  ): Promise<Expense[]> => {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
);

export const createExpense = createServerFn({ method: 'POST' })(
  async (userId: string, expense: ExpenseInsert): Promise<Expense> => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const updateExpense = createServerFn({ method: 'POST' })(
  async (
    userId: string,
    expenseId: string,
    updates: Partial<ExpenseInsert>
  ): Promise<Expense> => {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const deleteExpense = createServerFn({ method: 'POST' })(
  async (userId: string, expenseId: string): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) throw error;
  }
);

export const getCategoryBreakdown = createServerFn({ method: 'GET' })(
  async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ category: string; total: number }[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // Group by category
    const breakdown = (data || []).reduce(
      (acc, expense) => {
        const existing = acc.find((item) => item.category === expense.category);
        if (existing) {
          existing.total += Number(expense.amount);
        } else {
          acc.push({ category: expense.category, total: Number(expense.amount) });
        }
        return acc;
      },
      [] as { category: string; total: number }[]
    );

    return breakdown.sort((a, b) => b.total - a.total);
  }
);

export const getMonthlyNetCashFlow = createServerFn({ method: 'GET' })(
  async (userId: string, year: number, month: number): Promise<number> => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expenseError) throw expenseError;

    const totalExpenses = (expenses || []).reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    // You'll need to add income tracking to calculate true net cash flow
    // For now, return negative expenses
    return -totalExpenses;
  }
);
