"use client";

import { useCallback, useEffect, useState } from "react";
import { format, getDaysInMonth } from "date-fns";
import {
  ChevronDown, ChevronUp, Plus, Trash2, Save,
  CheckCircle2, Loader2, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  formatCurrency, getMonthOptions, getYearOptions,
  getCurrentMonthYear, calculateAmount, safeDecimal,
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
  const [year, setYear]   = useState(curYear);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems]           = useState<Item[]>([]);
  const [days, setDays]             = useState<DayState[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/items?activeOnly=true").then((r) => r.json()),
    ]).then(([cats, itms]) => {
      setCategories(cats.filter((c: Category) => c.isActive));
      setItems(itms);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((entries: SalesEntry[]) => {
        const daysInMonth = getDaysInMonth(new Date(year, month - 1));
        const today       = new Date();
        const todayDay    =
          today.getMonth() + 1 === month && today.getFullYear() === year
            ? today.getDate() : -1;

        const entryMap: Record<number, SalesEntry> = {};
        for (const e of entries) entryMap[new Date(e.entryDate).getDate()] = e;

        const newDays: DayState[] = Array.from({ length: daysInMonth }, (_, i) => {
          const day   = i + 1;
          const entry = entryMap[day];
          const lines: SalesLineForm[] =
            entry?.lines.map((l) => ({
              id: l.id, categoryId: l.categoryId, itemId: l.itemId,
              quantity: l.quantity, unitPrice: safeDecimal(l.unitPrice), amount: safeDecimal(l.amount),
            })) ?? [];
          return {
            date: new Date(year, month - 1, day), lines: lines.length ? lines : [newLine()],
            entryId: entry?.id, isDraft: entry?.isDraft ?? false,
            isSaving: false, isExpanded: day === todayDay, hasData: lines.length > 0,
          };
        });
        setDays(newDays);
        if (todayDay > 0) setExpandedDays(new Set([todayDay]));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year]);

  const toggleDay = (dayIndex: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayIndex + 1)) next.delete(dayIndex + 1); else next.add(dayIndex + 1);
      return next;
    });
  };

  const updateLine = useCallback(
    (dayIndex: number, lineIndex: number, field: keyof SalesLineForm, value: string | number) => {
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
          line.quantity = qty; line.amount = calculateAmount(qty, line.unitPrice);
        } else if (field === "unitPrice") {
          const price = Math.max(0, parseFloat(String(value)) || 0);
          line.unitPrice = price; line.amount = calculateAmount(line.quantity, price);
        } else { (line as any)[field] = value; }
        lines[lineIndex] = line; day.lines = lines; updated[dayIndex] = day;
        return updated;
      });
    }, [items]
  );

  const addLine = (dayIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.lines = [...day.lines, newLine()];
      updated[dayIndex] = day; return updated;
    });
  };

  const removeLine = (dayIndex: number, lineIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.lines = day.lines.length === 1 ? [newLine()] : day.lines.filter((_, i) => i !== lineIndex);
      updated[dayIndex] = day; return updated;
    });
  };

  const saveDay = async (dayIndex: number, isDraft = false) => {
    const day = days[dayIndex];
    const validLines = day.lines.filter((l) => l.itemId && l.quantity > 0);
    if (!validLines.length) { toast.error("Add at least one item with quantity > 0"); return; }
    setDays((prev) => { const u = [...prev]; u[dayIndex] = { ...u[dayIndex], isSaving: true }; return u; });
    try {
      const res = await fetch("/api/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryDate: format(day.date, "yyyy-MM-dd"), isDraft, lines: validLines }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Failed to save"); }
      const saved = await res.json();
      setDays((prev) => {
        const u = [...prev]; u[dayIndex] = { ...u[dayIndex], isSaving: false, isDraft, hasData: true, entryId: saved.id }; return u;
      });
      toast.success(isDraft ? "Saved as draft" : "Sales saved!");
    } catch (e: any) {
      setDays((prev) => { const u = [...prev]; u[dayIndex] = { ...u[dayIndex], isSaving: false }; return u; });
      toast.error(e.message ?? "Failed to save");
    }
  };

  const dayTotal   = (lines: SalesLineForm[]) => lines.reduce((s, l) => s + l.amount, 0);
  const monthTotal = days.reduce((s, d) => s + dayTotal(d.lines.filter((l) => l.amount > 0)), 0);
  const filledDays = days.filter((d) => d.hasData).length;

  const itemsByCategory = categories.reduce(
    (acc, cat) => { acc[cat.id] = items.filter((i) => i.categoryId === cat.id); return acc; },
    {} as Record<string, Item[]>
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Daily Sales Entry" />

      <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 flex-1">
              <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                <SelectTrigger className="h-9 flex-1 min-w-0 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="h-9 w-20 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getYearOptions().map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] text-muted-foreground leading-none">Month Total</p>
              <p className="text-lg font-bold text-primary leading-tight">{formatCurrency(monthTotal)}</p>
            </div>
          </div>
          {!loading && (
            <div className="flex gap-2 mt-2">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium">
                <CheckCircle2 className="w-3 h-3" />{filledDays} days entered
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full px-3 py-1 text-xs font-medium">
                <CalendarDays className="w-3 h-3" />{days.length} days total
              </div>
            </div>
          )}
        </div>

        {/* Days list */}
        <div className="px-3 pt-3 lg:px-6 space-y-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />)
          ) : (
            days.map((day, dayIndex) => {
              const dayNum     = dayIndex + 1;
              const isExpanded = expandedDays.has(dayNum);
              const total      = dayTotal(day.lines.filter((l) => l.amount > 0));
              const validCount = day.lines.filter((l) => l.amount > 0).length;
              const now        = new Date();
              const isToday    = now.getDate() === dayNum && now.getMonth() + 1 === month && now.getFullYear() === year;
              const isFuture   = new Date(year, month - 1, dayNum) > now;

              return (
                <div
                  key={dayIndex}
                  className={`rounded-2xl border bg-card overflow-hidden transition-all ${
                    isToday ? "ring-2 ring-primary border-primary/30 shadow-sm"
                    : day.hasData && !day.isDraft ? "border-emerald-200 dark:border-emerald-900/40"
                    : day.isDraft ? "border-amber-200 dark:border-amber-900/40"
                    : "border-border"
                  }`}
                >
                  {/* Header row */}
                  <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => toggleDay(dayIndex)}>
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isToday ? "bg-primary text-primary-foreground"
                      : day.hasData && !day.isDraft ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : day.isDraft ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="text-base font-bold leading-none">{dayNum}</span>
                      <span className="text-[10px] opacity-75">{format(day.date, "EEE")}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold">{format(day.date, "EEEE, MMM d")}</span>
                        {isToday && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Today</span>}
                        {day.isDraft && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Draft</span>}
                        {day.hasData && !day.isDraft && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {total > 0 ? `${validCount} item${validCount !== 1 ? "s" : ""} · ${formatCurrency(total)}` : "No entries yet"}
                      </p>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {/* Expanded form */}
                  {isExpanded && (
                    <div className="border-t px-3 pb-4 pt-3 space-y-2 bg-muted/20">
                      {day.lines.map((line, lineIndex) => (
                        <MobileLineRow
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

                      <div className="flex items-center justify-between pt-2 border-t border-dashed">
                        <Button variant="ghost" size="sm" onClick={() => addLine(dayIndex)} className="text-primary hover:text-primary h-9">
                          <Plus className="w-4 h-4 mr-1" />Add Item
                        </Button>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-1">
                            <p className="text-[10px] text-muted-foreground">Total</p>
                            <p className="text-sm font-bold text-primary">{formatCurrency(dayTotal(day.lines.filter((l) => l.amount > 0)))}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => saveDay(dayIndex, true)} disabled={day.isSaving || isFuture} className="h-9 text-xs">
                            {day.isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Draft"}
                          </Button>
                          <Button size="sm" onClick={() => saveDay(dayIndex, false)} disabled={day.isSaving || isFuture} className="h-9 text-xs">
                            {day.isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile line row ────────────────────────────────────────────────────────────
function MobileLineRow({
  line, lineIndex, categories, items, itemsByCategory, onChange, onRemove, canRemove,
}: {
  line: SalesLineForm; lineIndex: number; categories: Category[]; items: Item[];
  itemsByCategory: Record<string, Item[]>;
  onChange: (field: keyof SalesLineForm, value: string | number) => void;
  onRemove: () => void; canRemove: boolean;
}) {
  const catColor = categories.find((c) => c.id === line.categoryId)?.color;

  return (
    <div className="bg-card rounded-xl border p-3 space-y-2.5">
      {/* Item selector row */}
      <div className="flex items-center gap-2">
        <span className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: catColor ?? "#e5e7eb" }} />
        <Select value={line.itemId || ""} onValueChange={(v) => onChange("itemId", v)}>
          <SelectTrigger className="flex-1 h-10 text-sm">
            <SelectValue placeholder="Select item…" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => {
              const catItems = itemsByCategory[cat.id] ?? [];
              if (!catItems.length) return null;
              return (
                <div key={cat.id}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}
                  </div>
                  {catItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="pl-6 text-sm">
                      <span className="flex-1">{item.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">₨{safeDecimal(item.defaultUnitPrice)}</span>
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </SelectContent>
        </Select>
        {canRemove && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this line?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone locally.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Qty · Price · Amount */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Qty</p>
          <Input type="number" min={0} inputMode="numeric" placeholder="0"
            value={line.quantity || ""} onChange={(e) => onChange("quantity", e.target.value)}
            className="h-10 text-center text-sm font-bold" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Price ₨</p>
          <Input type="number" min={0} step="0.01" inputMode="decimal" placeholder="0"
            value={line.unitPrice || ""} onChange={(e) => onChange("unitPrice", e.target.value)}
            className="h-10 text-right text-sm" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">Amount</p>
          <div className={`h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
            line.amount > 0 ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
          }`}>
            {line.amount > 0 ? `₨${line.amount.toLocaleString()}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
