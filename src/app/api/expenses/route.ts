import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { expenseDate, category, description, amount, notes } = parsed.data;
    const date = new Date(expenseDate);
    date.setHours(0, 0, 0, 0);

    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const userId = (session.user as any).id;

    const expense = await prisma.expense.create({
      data: {
        expenseDate: date,
        month,
        year,
        category,
        description,
        amount,
        notes,
        createdById: userId,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
