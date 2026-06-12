import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { supabase, getUser } from '~/lib/supabase';
import { getBudgetStatusForMonth, createBudget, updateBudget, deleteBudget } from '~/server/budgets';

export const Route = createFileRoute('/budgets')({
  component: BudgetsPage,
});

export function BudgetsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [limitInput, setLimitInput] = useState('');

  const { data: user } = useSuspenseQuery({
    queryKey: ['user'],
    queryFn: () => getUser(),
  });

  const { data: budgetStatus } = useSuspenseQuery({
    queryKey: ['budgetStatus', user?.id, year, month],
    queryFn: () => (user ? getBudgetStatusForMonth(user.id, year, month) : Promise.resolve([])),
    enabled: !!user,
  });

  const handleCreateBudget = async () => {
    if (!user || !categoryInput || !limitInput) return;

    try {
      await createBudget(user.id, {
        category: categoryInput,
        monthly_limit: parseFloat(limitInput),
      });
      setCategoryInput('');
      setLimitInput('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return;
    try {
      await deleteBudget(user.id, budgetId);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const overBudgetItems = budgetStatus?.filter((b) => b.isOverBudget) || [];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Manage and track your spending limits</p>
        </div>
      </div>

      {/* Alerts */}
      {overBudgetItems.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are over budget in {overBudgetItems.length} categor{overBudgetItems.length !== 1 ? 'ies' : 'y'}
          </AlertDescription>
        </Alert>
      )}

      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Period</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Month</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Year</Label>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetStatus?.map((budget) => (
          <Card key={budget.category} className={budget.isOverBudget ? 'border-red-500' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                  <CardDescription>
                    ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBudget(budget.category)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className={budget.isOverBudget ? 'text-red-600 font-semibold' : ''}>
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(budget.percentage, 100)}
                  className={budget.isOverBudget ? 'h-2' : ''}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={budget.remaining > 0 ? 'text-green-600' : 'text-red-600'}>
                    ${budget.remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Budget Card */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Card className="flex cursor-pointer items-center justify-center border-dashed hover:bg-accent">
              <div className="text-center">
                <Plus className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Add Budget</p>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
              <DialogDescription>Set a spending limit for a category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Groceries, Entertainment"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="limit">Monthly Limit ($)</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="0.00"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  step="0.01"
                />
              </div>
              <Button onClick={handleCreateBudget} className="w-full">
                Create Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
