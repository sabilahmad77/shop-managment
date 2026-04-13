"use client";

import { useCallback, useEffect, useState } from "react";
import { format, getDaysInMonth } from "date-fns";
import { ChevronDown, ChevronUp, Plus, Trash2, Save, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  formatCurrency,
  getMonthName,
  getMonthOptions,
  getYearOptions,
  getCurrentMonthYear,
  calculateAmount,
  safeDecimal,
} from "@/lib/utils";
import type { Category, Item, SalesEntry, SalesLineForm } from "@/types";

interface DayState {
  date: Date;
  lines: SalesLineForm[];
  entryId?: string;
  isDraft: boolean;
  isSaving: boolean;
  isExpanded: boolean;
  hasData: boolean;
}

function newLine(): SalesLineForm {
  return { categoryId: "", itemId: "", quantity: 0, unitPrice: 0, amount: 0 };
}

export default function SalesPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [days, setDays] = useState<DayState[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  // Load categories & items
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/items?activeOnly=true").then((r) => r.json()),
    ]).then(([cats, itms]) => {
      setCategories(cats.filter((c: Category) => c.isActive));
      setItems(itms);
    });
  }, []);

  // Load sales entries when month/year changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((entries: SalesEntry[]) => {
        const daysInMonth = getDaysInMonth(new Date(year, month - 1));
        const today = new Date();
        const todayDay = today.getMonth() + 1 === month && today.getFullYear() === year ? today.getDate() : -1;

        const entryMap: Record<string, SalesEntry> = {};
        for (const e of entries) {
          const day = new Date(e.entryDate).getDate();
          entryMap[day] = e;
        }

        const newDays: DayState[] = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month - 1, day);
          const entry = entryMap[day];
          const lines: SalesLineForm[] = entry?.lines.map((l) => ({
            id: l.id,
            categoryId: l.categoryId,
            itemId: l.itemId,
            quantity: l.quantity,
            unitPrice: safeDecimal(l.unitPrice),
            amount: safeDecimal(l.amount),
          })) ?? [];

          return {
            date,
            lines: lines.length ? lines : [newLine()],
            entryId: entry?.id,
            isDraft: entry?.isDraft ?? false,
            isSaving: false,
            isExpanded: day === todayDay,
            hasData: lines.length > 0,
          };
        });

        setDays(newDays);
        // Expand today by default
        if (todayDay > 0) setExpandedDays(new Set([todayDay]));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex + 1)) next.delete(dayIndex + 1);
      else next.add(dayIndex + 1);
      return next;
    });
  };

  const updateLine = (dayIndex: number, lineIndex: number, field: keyof SalesLineForm, value: string | number) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      const lines = [...day.lines];
      const line = { ...lines[lineIndex] };

      if (field === "itemId" && value) {
        const item = items.find((i) => i.id === value);
        line.itemId = value as string;
        line.unitPrice = item ? safeDecimal(item.defaultUnitPrice) : 0;
        if (item) line.categoryId = item.categoryId;
        line.amount = calculateAmount(line.quantity, line.unitPrice);
      } else if (field === "quantity") {
        const qty = Math.max(0, parseInt(String(value)) || 0);
        line.quantity = qty;
        line.amount = calculateAmount(qty, line.unitPrice);
      } else if (field === "unitPrice") {
        const price = Math.max(0, parseFloat(String(value)) || 0);
        line.unitPrice = price;
        line.amount = calculateAmount(line.quantity, price);
      } else {
        (line as any)[field] = value;
      }

      lines[lineIndex] = line;
      day.lines = lines;
      updated[dayIndex] = day;
      return updated;
    });
  };

  const addLine = (dayIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.lines = [...day.lines, newLine()];
      updated[dayIndex] = day;
      return updated;
    });
  };

  const removeLine = (dayIndex: number, lineIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      if (day.lines.length === 1) {
        day.lines = [newLine()];
      } else {
        day.lines = day.lines.filter((_, i) => i !== lineIndex);
      }
      updated[dayIndex] = day;
      return updated;
    });
  };

  const saveDay = async (dayIndex: number, isDraft = false) => {
    const day = days[dayIndex];
    const validLines = day.lines.filter((l) => l.itemId && l.quantity > 0);

    if (!validLines.length) {
      toast.error("Add at least one item with quantity > 0");
      return;
    }

    setDays((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], isSaving: true };
      return updated;
    });

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: format(day.date, "yyyy-MM-dd"),
          isDraft,
          lines: validLines,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      const saved = await res.json();
      setDays((prev) => {
        const updated = [...prev];
        updated[dayIndex] = {
          ...updated[dayIndex],
          isSaving: false,
          isDraft,
          hasData: true,
          entryId: saved.id,
        };
        return updated;
      });
      toast.success(isDraft ? "Saved as draft" : "Sales saved successfully!");
    } catch (e: any) {
      setDays((prev) => {
        const updated = [...prev];
        updated[dayIndex] = { ...updated[dayIndex], isSaving: false };
        return updated;
      });
      toast.error(e.message ?? "Failed to save");
    }
  };

  const dayTotal = (lines: SalesLineForm[]) => lines.reduce((s, l) => s + l.amount, 0);
  const monthTotal = days.reduce((s, d) => s + dayTotal(d.lines.filter((l) => l.amount > 0)), 0);

  const itemsByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = items.filter((i) => i.categoryId === cat.id);
      return acc;
    },
    {} as Record<string, Item[]>
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Daily Sales Entry" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Month selector + summary */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Month Total</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(monthTotal)}</p>
            </div>
          </div>
        </div>

        {/* Days list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {days.map((day, dayIndex) => {
              const dayNum = dayIndex + 1;
              const isExpanded = expandedDays.has(dayNum);
              const total = dayTotal(day.lines.filter((l) => l.amount > 0));
              const validLines = day.lines.filter((l) => l.amount > 0).length;
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() + 1 === month &&
                new Date().getFullYear() === year;
              const isFuture = new Date(year, month - 1, dayNum) > new Date();

              return (
                <Card
                  key={dayIndex}
                  className={`overflow-hidden transition-all ${isToday ? "ring-2 ring-primary/30" : ""}`}
                >
                  {/* Day header */}
                  <button
                    className="w-full text-left"
                    onClick={() => toggleDay(dayIndex)}
                  >
                    <CardHeader className="p-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isToday
                                ? "bg-primary text-white"
                                : day.hasData
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <span className="text-base leading-none">{dayNum}</span>
                            <span className="text-[10px] opacity-70">
                              {format(day.date, "EEE")}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {format(day.date, "EEEE, MMMM d")}
                              {isToday && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  Today
                                </span>
                              )}
                            </p>
                            {day.hasData || total > 0 ? (
                              <p className="text-xs text-muted-foreground">
                                {validLines} line{validLines !== 1 ? "s" : ""} •{" "}
                                {formatCurrency(total)}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">No entries</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {day.isDraft && <Badge variant="warning">Draft</Badge>}
                          {day.hasData && !day.isDraft && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          {total > 0 && (
                            <span className="font-semibold text-sm hidden sm:block">
                              {formatCurrency(total)}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Expanded entry form */}
                  {isExpanded && (
                    <CardContent className="px-4 pb-4 pt-0 border-t">
                      <div className="pt-4 space-y-3">
                        {/* Lines */}
                        {day.lines.map((line, lineIndex) => (
                          <SalesLineRow
                            key={lineIndex}
                            line={line}
                            lineIndex={lineIndex}
                            categories={categories}
                            items={items}
                            itemsByCategory={itemsByCategory}
                            onChange={(field, value) => updateLine(dayIndex, lineIndex, field, value)}
                            onRemove={() => removeLine(dayIndex, lineIndex)}
                            canRemove={day.lines.length > 1}
                          />
                        ))}

                        {/* Add line + save */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addLine(dayIndex)}
                            className="text-primary hover:text-primary"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                          </Button>

                          <div className="flex items-center gap-2">
                            <div className="text-right mr-2">
                              <p className="text-xs text-muted-foreground">Day Total</p>
                              <p className="font-bold text-primary">
                                {formatCurrency(dayTotal(day.lines.filter((l) => l.amount > 0)))}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => saveDay(dayIndex, true)}
                              disabled={day.isSaving || isFuture}
                            >
                              {day.isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Draft"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveDay(dayIndex, false)}
                              disabled={day.isSaving || isFuture}
                            >
                              {day.isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Save className="w-3 h-3 mr-1" />
                              )}
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface SalesLineRowProps {
  line: SalesLineForm;
  lineIndex: number;
  categories: Category[];
  items: Item[];
  itemsByCategory: Record<string, Item[]>;
  onChange: (field: keyof SalesLineForm, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function SalesLineRow({
  line,
  categories,
  items,
  itemsByCategory,
  onChange,
  onRemove,
  canRemove,
}: SalesLineRowProps) {
  const categoryColor = categories.find((c) => c.id === line.categoryId)?.color;

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      {/* Category color bar */}
      {categoryColor && (
        <div
          className="col-span-1 h-8 w-1 rounded-full mx-auto"
          style={{ backgroundColor: categoryColor }}
        />
      )}

      {/* Item select */}
      <div className={categoryColor ? "col-span-5" : "col-span-6"}>
        <Select
          value={line.itemId || ""}
          onValueChange={(v) => onChange("itemId", v)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select item…" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => {
              const catItems = itemsByCategory[cat.id] ?? [];
              if (!catItems.length) return null;
              return (
                <div key={cat.id}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                  {catItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="pl-6">
                      {item.name}
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Qty */}
      <div className="col-span-2">
        <Input
          type="number"
          min={0}
          placeholder="Qty"
          value={line.quantity || ""}
          onChange={(e) => onChange("quantity", e.target.value)}
          className="h-9 text-sm text-center"
        />
      </div>

      {/* Unit price */}
      <div className="col-span-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Price"
          value={line.unitPrice || ""}
          onChange={(e) => onChange("unitPrice", e.target.value)}
          className="h-9 text-sm text-right"
        />
      </div>

      {/* Amount */}
      <div className="col-span-2 text-right">
        <span className="text-sm font-semibold text-foreground">
          {line.amount > 0 ? formatCurrency(line.amount) : "—"}
        </span>
      </div>

      {/* Remove */}
      {canRemove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="col-span-1 text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this line?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone locally.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRemove} className="bg-destructive hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
