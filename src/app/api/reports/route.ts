import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "monthly";
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

    const entries = await prisma.salesEntry.findMany({
      where: { month, year },
      include: {
        lines: {
          include: { category: true, item: true },
        },
      },
      orderBy: { entryDate: "asc" },
    });

    if (type === "category") {
      // Category report
      const catMap: Record<string, any> = {};
      for (const entry of entries) {
        for (const line of entry.lines) {
          if (!catMap[line.categoryId]) {
            catMap[line.categoryId] = {
              categoryId: line.categoryId,
              categoryName: line.category.name,
              color: line.category.color,
              totalAmount: 0,
              totalQuantity: 0,
              items: {},
            };
          }
          catMap[line.categoryId].totalAmount += Number(line.amount);
          catMap[line.categoryId].totalQuantity += line.quantity;

          if (!catMap[line.categoryId].items[line.itemId]) {
            catMap[line.categoryId].items[line.itemId] = {
              itemId: line.itemId,
              itemName: line.item.name,
              categoryName: line.category.name,
              unitPrice: Number(line.unitPrice),
              totalQuantity: 0,
              totalAmount: 0,
            };
          }
          catMap[line.categoryId].items[line.itemId].totalQuantity += line.quantity;
          catMap[line.categoryId].items[line.itemId].totalAmount += Number(line.amount);
        }
      }

      const result = Object.values(catMap).map((cat) => ({
        ...cat,
        items: Object.values(cat.items).sort((a: any, b: any) => b.totalAmount - a.totalAmount),
      }));

      return NextResponse.json(result);
    }

    if (type === "item") {
      // Item report
      const itemMap: Record<string, any> = {};
      for (const entry of entries) {
        for (const line of entry.lines) {
          if (!itemMap[line.itemId]) {
            itemMap[line.itemId] = {
              itemId: line.itemId,
              itemName: line.item.name,
              categoryName: line.category.name,
              unitPrice: Number(line.unitPrice),
              totalQuantity: 0,
              totalAmount: 0,
            };
          }
          itemMap[line.itemId].totalQuantity += line.quantity;
          itemMap[line.itemId].totalAmount += Number(line.amount);
        }
      }
      return NextResponse.json(Object.values(itemMap).sort((a, b) => b.totalAmount - a.totalAmount));
    }

    // Default: daily report
    const dailyReport = entries.map((entry) => {
      const catMap: Record<string, any> = {};
      for (const line of entry.lines) {
        if (!catMap[line.categoryId]) {
          catMap[line.categoryId] = {
            categoryName: line.category.name,
            amount: 0,
            quantity: 0,
          };
        }
        catMap[line.categoryId].amount += Number(line.amount);
        catMap[line.categoryId].quantity += line.quantity;
      }
      return {
        date: entry.entryDate,
        day: new Date(entry.entryDate).getDate(),
        totalAmount: entry.lines.reduce((s, l) => s + Number(l.amount), 0),
        totalQuantity: entry.lines.reduce((s, l) => s + l.quantity, 0),
        categories: Object.values(catMap),
      };
    });

    return NextResponse.json(dailyReport);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
