"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  PlusCircle,
  Trash2,
  Loader2,
  UtensilsCrossed,
  Home,
  Zap,
  Users,
  Flame,
  Package,
  TrendingDown,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/types";

const EXPENSE_CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { value: "FOOD",        label: "Staff Food",   icon: UtensilsCrossed, color: "text-orange-500",  bg: "bg-orange-100 dark:bg-orange-900/30" },
  { value: "RENT",        label: "Rent",         icon: Home,            color: "text-blue-500",    bg: "bg-blue-100 dark:bg-blue-900/30" },
  { value: "ELECTRICITY", label: "Electricity",  icon: Zap,             color: "text-yellow-500",  bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { value: "SALARY",      label: "Salary",       icon: Users,           color: "text-purple-500",  bg: "bg-purple-100 dark:bg-purple-900/30" },
  { value: "GAS",         label: "Gas",          icon: Flame,           color: "text-red-500",     bg: "bg-red-100 dark:bg-red-900/30" },
  { value: "OTHER",       label: "Other",        icon: Package,         color: "text-slate-500",   bg: "bg-slate-100 dark:bg-slate-800" },
];

function getCategoryMeta(cat: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat) ?? EXPENSE_CATEGORIES[5];
}

const formSchema = z.object({
  expenseDate: z.string().min(1, "Date required"),
  category: z.enum(["FOOD", "RENT", "ELECTRICITY", "SALARY", "GAS", "OTHER"]),
  description: z.string().min(1, "Description required").max(200),
  amount: z.number({ invalid_type_error: "Enter a valid amount" }).min(1, "Must be > 0"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

export default function ExpensesPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "User";
  const userRole = (session?.user as any)?.role ?? "STAFF";
  const isAdmin = userRole === "ADMIN";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expenseDate: now.toISOString().split("T")[0],
      category: "FOOD",
    },
  });

  function loadExpenses() {
    setLoading(true);
    fetch(`/api/expenses?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        setExpenses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadExpenses();
  }, [month, year]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Expense recorded");
      reset({
        expenseDate: now.toISOString().split("T")[0],
        category: "FOOD",
        description: "",
        amount: undefined,
        notes: "",
      });
      setShowForm(false);
      loadExpenses();
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Expense deleted");
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  // Totals
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Breakdown by category
  const breakdown = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.value).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: getMonthName(i + 1) }));
  const years = [year - 1, year, year + 1].filter((y) => y >= 2020);

  return (
    <div className="flex flex-col h-full">
      <Header title="Expenses" userName={userName} userRole={userRole} />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto pb-24 lg:pb-6">
        {/* Month/Year + Add button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-10 pl-3 pr-8 rounded-lg border bg-background text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
            </div>
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-10 pl-3 pr-8 rounded-lg border bg-background text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
            </div>
          </div>
          <Button onClick={() => setShowForm((v) => !v)} className="gap-2 h-10 flex-shrink-0">
            <PlusCircle className="w-4 h-4" />
            Add Expense
          </Button>
        </div>

        {/* Add Expense Form */}
        {showForm && (
          <Card className="border-primary/30 shadow-md">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                New Expense Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Date + Category row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      className={cn(
                        "w-full h-11 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                        errors.expenseDate && "border-destructive"
                      )}
                      {...register("expenseDate")}
                    />
                    {errors.expenseDate && <p className="text-xs text-destructive">{errors.expenseDate.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Category</label>
                    <div className="relative">
                      <select
                        className={cn(
                          "w-full h-11 pl-3 pr-8 rounded-lg border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50",
                          errors.category && "border-destructive"
                        )}
                        {...register("category")}
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
                    </div>
                    {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                  </div>
                </div>

                {/* Description + Amount row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Staff lunch, Monthly rent..."
                      className={cn(
                        "w-full h-11 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                        errors.description && "border-destructive"
                      )}
                      {...register("description")}
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Amount (₨)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      className={cn(
                        "w-full h-11 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
                        errors.amount && "border-destructive"
                      )}
                      {...register("amount", { valueAsNumber: true })}
                    />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="Any additional details..."
                    className="w-full h-11 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    {...register("notes")}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={submitting} className="flex-1 h-11">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Save Expense"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowForm(false); reset(); }}
                    className="h-11 px-4"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Total Expenses</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{getMonthName(month)} {year}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Entries</p>
              <p className="text-xl font-bold mt-0.5">{expenses.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Category breakdown */}
        {breakdown.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Category</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {breakdown.map((cat) => {
                const Icon = cat.icon;
                const pct = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
                return (
                  <div key={cat.value}>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cat.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", cat.color)} />
                      </div>
                      <span className="text-sm font-medium flex-1 truncate">{cat.label}</span>
                      <span className="text-sm font-semibold flex-shrink-0">{formatCurrency(cat.total)}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right flex-shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-9">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: getCategoryColorHex(cat.value) }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Expense list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
            {loading ? "Loading…" : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
          </h3>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <Card>
              <CardContent className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                <TrendingDown className="w-8 h-8 opacity-30" />
                <p className="text-sm">No expenses recorded for {getMonthName(month)} {year}</p>
                <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="mt-1">
                  Add first expense
                </Button>
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense) => {
              const meta = getCategoryMeta(expense.category as ExpenseCategory);
              const Icon = meta.icon;
              const dateStr = new Date(expense.expenseDate).toLocaleDateString("en-PK", {
                weekday: "short", day: "numeric", month: "short",
              });
              return (
                <Card key={expense.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 p-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
                        <Icon className={cn("w-5 h-5", meta.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{meta.label}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />{dateStr}
                          </span>
                        </div>
                        {expense.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{expense.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(Number(expense.amount))}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                          >
                            {deletingId === expense.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function getCategoryColorHex(cat: ExpenseCategory): string {
  const map: Record<ExpenseCategory, string> = {
    FOOD: "#f97316",
    RENT: "#3b82f6",
    ELECTRICITY: "#eab308",
    SALARY: "#8b5cf6",
    GAS: "#ef4444",
    OTHER: "#94a3b8",
  };
  return map[cat] ?? "#94a3b8";
}
