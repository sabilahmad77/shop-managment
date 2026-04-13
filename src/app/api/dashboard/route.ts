import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    // ── Today's sales ────────────────────────────────────────────────────────────
    const todayEntry = await prisma.salesEntry.findUnique({
      where: { entryDate: today },
      include: { lines: true },
    });
    const todaySales = todayEntry?.lines.reduce((s, l) => s + Number(l.amount), 0) ?? 0;
    const todayQuantity = todayEntry?.lines.reduce((s, l) => s + l.quantity, 0) ?? 0;

    // ── Today's expenses ─────────────────────────────────────────────────────────
    const todayExpenseRows = await prisma.expense.findMany({
      where: { expenseDate: today },
    });
    const todayExpenses = todayExpenseRows.reduce((s, e) => s + Number(e.amount), 0);
    const todayProfit = todaySales - todayExpenses;

    // ── Month sales ───────────────────────────────────────────────────────────────
    const monthEntries = await prisma.salesEntry.findMany({
      where: { month, year },
      include: { lines: { include: { category: true, item: true } } },
      orderBy: { entryDate: "asc" },
    });
    const monthSales = monthEntries.reduce(
      (s, e) => s + e.lines.reduce((ls, l) => ls + Number(l.amount), 0), 0
    );
    const monthQuantity = monthEntries.reduce(
      (s, e) => s + e.lines.reduce((ls, l) => ls + l.quantity, 0), 0
    );

    // ── Month expenses ─────────────────────────────────────────────────────────────
    const monthExpenseRows = await prisma.expense.findMany({ where: { month, year } });
    const monthExpenses = monthExpenseRows.reduce((s, e) => s + Number(e.amount), 0);
    const monthProfit = monthSales - monthExpenses;

    // ── Expense breakdown by category ─────────────────────────────────────────────
    const expenseCatMap: Record<string, number> = {};
    for (const e of monthExpenseRows) {
      expenseCatMap[e.category] = (expenseCatMap[e.category] ?? 0) + Number(e.amount);
    }
    const expenseBreakdown = Object.entries(expenseCatMap).map(([category, amount]) => ({ category, amount }));

    // ── Category breakdown for sales ─────────────────────────────────────────────
    const categoryMap: Record<string, { name: string; amount: number; color: string }> = {};
    for (const entry of monthEntries) {
      for (const line of entry.lines) {
        const catId = line.categoryId;
        if (!categoryMap[catId]) {
          categoryMap[catId] = { name: line.category.name, amount: 0, color: line.category.color };
        }
        categoryMap[catId].amount += Number(line.amount);
      }
    }
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
    const topCategory = categoryBreakdown[0] ?? null;

    // ── Item breakdown ─────────────────────────────────────────────────────────────
    const itemMap: Record<string, { name: string; amount: number; quantity: number }> = {};
    for (const entry of monthEntries) {
      for (const line of entry.lines) {
        const itemId = line.itemId;
        if (!itemMap[itemId]) {
          itemMap[itemId] = { name: line.item.name, amount: 0, quantity: 0 };
        }
        itemMap[itemId].amount += Number(line.amount);
        itemMap[itemId].quantity += line.quantity;
      }
    }
    const itemsSorted = Object.values(itemMap).sort((a, b) => b.amount - a.amount);
    const topItem = itemsSorted[0] ?? null;

    // ── Monthly trend (sales + expenses per day) ──────────────────────────────────
    const expenseByDay: Record<number, number> = {};
    for (const e of monthExpenseRows) {
      const day = new Date(e.expenseDate).getDate();
      expenseByDay[day] = (expenseByDay[day] ?? 0) + Number(e.amount);
    }
    const monthlyTrend = monthEntries.map((e) => {
      const day = new Date(e.entryDate).getDate();
      const sales = e.lines.reduce((s, l) => s + Number(l.amount), 0);
      return { day, amount: sales, expenses: expenseByDay[day] ?? 0 };
    });

    // ── Recent entries ─────────────────────────────────────────────────────────────
    const recentEntries = await prisma.salesEntry.findMany({
      orderBy: { entryDate: "desc" },
      take: 5,
      include: { lines: { include: { category: true, item: true } } },
    });

    return NextResponse.json({
      todaySales,
      todayQuantity,
      todayExpenses,
      todayProfit,
      monthSales,
      monthQuantity,
      monthExpenses,
      monthProfit,
      topCategory,
      topItem,
      categoryBreakdown,
      expenseBreakdown,
      monthlyTrend,
      recentEntries,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
