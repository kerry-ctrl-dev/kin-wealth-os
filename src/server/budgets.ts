import { createServerFn } from '@tanstack/react-start/server';
import { supabase } from '~/lib/supabase';
import type { Database } from '~/types/supabase';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];

export const getBudgets = createServerFn({ method: 'GET' })(
  async (userId: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  }
);

export const createBudget = createServerFn({ method: 'POST' })(
  async (userId: string, budget: BudgetInsert): Promise<Budget> => {
    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...budget, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const updateBudget = createServerFn({ method: 'POST' })(
  async (userId: string, budgetId: string, updates: Partial<BudgetInsert>): Promise<Budget> => {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', budgetId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const deleteBudget = createServerFn({ method: 'POST' })(
  async (userId: string, budgetId: string): Promise<void> => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)
      .eq('user_id', userId);

    if (error) throw error;
  }
);

export const getBudgetProgress = createServerFn({ method: 'GET' })(
  async (
    userId: string,
    category: string,
    year: number,
    month: number
  ): Promise<{ limit: number; spent: number; remaining: number; percentage: number }> => {
    // Get budget
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('monthly_limit')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (budgetError) throw budgetError;

    const limit = Number(budgetData?.monthly_limit || 0);

    // Get current month spending
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('category', category)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expenseError) throw expenseError;

    const spent = (expenses || []).reduce((sum, expense) => sum + Number(expense.amount), 0);
    const remaining = Math.max(0, limit - spent);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      limit,
      spent,
      remaining,
      percentage,
    };
  }
);

export const getBudgetStatusForMonth = createServerFn({ method: 'GET' })(
  async (
    userId: string,
    year: number,
    month: number
  ): Promise<
    Array<{
      category: string;
      limit: number;
      spent: number;
      remaining: number;
      percentage: number;
      isOverBudget: boolean;
    }>
  > => {
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('category, monthly_limit')
      .eq('user_id', userId);

    if (budgetError) throw budgetError;

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expenseError) throw expenseError;

    // Group expenses by category
    const expensesByCategory = (expenses || []).reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    // Map budgets with their spending
    return (budgets || []).map((budget) => {
      const limit = Number(budget.monthly_limit);
      const spent = expensesByCategory[budget.category] || 0;
      const remaining = Math.max(0, limit - spent);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        category: budget.category,
        limit,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > limit,
      };
    });
  }
);
