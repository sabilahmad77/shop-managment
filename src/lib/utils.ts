import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, getDaysInMonth, startOfMonth, endOfMonth } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, symbol = "₨"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol}0`;
  return `${symbol}${num.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function getMonthDays(year: number, month: number): Date[] {
  const count = getDaysInMonth(new Date(year, month - 1));
  return Array.from({ length: count }, (_, i) => new Date(year, month - 1, i + 1));
}

export function getDayLabel(date: Date): string {
  return format(date, "EEE, dd MMM");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export function getMonthName(month: number): string {
  return format(new Date(2000, month - 1, 1), "MMMM");
}

export function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), "MMMM"),
  }));
}

export function getYearOptions(yearsBack = 3) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: yearsBack + 1 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  }));
}

export function calculateAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function safeDecimal(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
}
