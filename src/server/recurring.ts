import { createServerFn } from '@tanstack/react-start/server';
import { supabase } from '~/lib/supabase';
import type { Database } from '~/types/supabase';

type Recurring = Database['public']['Tables']['recurring']['Row'];
type RecurringInsert = Database['public']['Tables']['recurring']['Insert'];

export const getRecurring = createServerFn({ method: 'GET' })(
  async (userId: string, activeOnly = false): Promise<Recurring[]> => {
    let query = supabase
      .from('recurring')
      .select('*')
      .eq('user_id', userId);

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query.order('next_run', { ascending: true });

    if (error) throw error;
    return data || [];
  }
);

export const createRecurring = createServerFn({ method: 'POST' })(
  async (userId: string, recurring: RecurringInsert): Promise<Recurring> => {
    const { data, error } = await supabase
      .from('recurring')
      .insert({ ...recurring, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const updateRecurring = createServerFn({ method: 'POST' })(
  async (userId: string, recurringId: string, updates: Partial<RecurringInsert>): Promise<Recurring> => {
    const { data, error } = await supabase
      .from('recurring')
      .update(updates)
      .eq('id', recurringId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

export const deleteRecurring = createServerFn({ method: 'POST' })(
  async (userId: string, recurringId: string): Promise<void> => {
    const { error } = await supabase
      .from('recurring')
      .delete()
      .eq('id', recurringId)
      .eq('user_id', userId);

    if (error) throw error;
  }
);

export const toggleRecurringActive = createServerFn({ method: 'POST' })(
  async (userId: string, recurringId: string, active: boolean): Promise<Recurring> => {
    const { data, error } = await supabase
      .from('recurring')
      .update({ active })
      .eq('id', recurringId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
);

// Process due recurring transactions (client-side, idempotent)
export const processDueRecurring = createServerFn({ method: 'POST' })(
  async (userId: string): Promise<{ processed: number; errors: string[] }> => {
    const today = new Date().toISOString().split('T')[0];

    // Get all active recurring transactions due today
    const { data: recurring, error: recurringError } = await supabase
      .from('recurring')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .lte('next_run', today);

    if (recurringError) throw recurringError;

    const errors: string[] = [];
    let processed = 0;

    // Process each due recurring transaction
    for (const transaction of recurring || []) {
      try {
        // For income: add to expenses table with negative amount (or create separate income tracking)
        // For now, we'll treat income as negative expenses for simplicity
        const amountToRecord = transaction.type === 'income' ? -transaction.amount : transaction.amount;

        // Create expense/income record
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            amount: amountToRecord,
            category: transaction.source_or_category,
            date: today,
            method: 'recurring',
            notes: `Auto-processed recurring ${transaction.type}`,
          });

        if (insertError) {
          errors.push(`Failed to process ${transaction.id}: ${insertError.message}`);
          continue;
        }

        // Calculate next run date based on frequency
        const nextRun = calculateNextRunDate(today, transaction.frequency);

        // Update recurring transaction with new next_run date
        const { error: updateError } = await supabase
          .from('recurring')
          .update({ next_run: nextRun })
          .eq('id', transaction.id)
          .eq('user_id', userId);

        if (updateError) {
          errors.push(`Failed to update next_run for ${transaction.id}: ${updateError.message}`);
          continue;
        }

        processed++;
      } catch (error) {
        errors.push(`Unexpected error processing ${transaction.id}: ${String(error)}`);
      }
    }

    return { processed, errors };
  }
);

// Helper function to calculate next run date
function calculateNextRunDate(currentDate: string, frequency: string): string {
  const date = new Date(currentDate);

  switch (frequency.toLowerCase()) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setDate(date.getDate() + 1); // Default to daily
  }

  return date.toISOString().split('T')[0];
}

export const getDueRecurringCount = createServerFn({ method: 'GET' })(
  async (userId: string): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('recurring')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('active', true)
      .lte('next_run', today);

    if (error) throw error;
    return data?.length || 0;
  }
);
