import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { salesEntrySchema } from "@/lib/validators";

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

    const entries = await prisma.salesEntry.findMany({
      where,
      orderBy: { entryDate: "asc" },
      include: {
        lines: {
          include: {
            category: true,
            item: true,
          },
          orderBy: [{ category: { sortOrder: "asc" } }, { item: { sortOrder: "asc" } }],
        },
      },
    });

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch sales entries" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = salesEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { entryDate, notes, isDraft, lines } = parsed.data;
    const date = new Date(entryDate);
    date.setHours(0, 0, 0, 0);

    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Check if entry already exists for this date
    const existing = await prisma.salesEntry.findUnique({
      where: { entryDate: date },
    });

    const userId = (session.user as any).id;

    if (existing) {
      // Update: delete old lines, insert new ones
      await prisma.salesEntryLine.deleteMany({
        where: { salesEntryId: existing.id },
      });

      const entry = await prisma.salesEntry.update({
        where: { id: existing.id },
        data: {
          notes,
          isDraft,
          updatedById: userId,
          lines: {
            create: lines
              .filter((l) => l.quantity > 0)
              .map((l) => ({
                categoryId: l.categoryId,
                itemId: l.itemId,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                amount: l.amount,
              })),
          },
        },
        include: {
          lines: { include: { category: true, item: true } },
        },
      });
      return NextResponse.json(entry);
    }

    // Create new entry
    const entry = await prisma.salesEntry.create({
      data: {
        entryDate: date,
        month,
        year,
        notes,
        isDraft,
        createdById: userId,
        lines: {
          create: lines
            .filter((l) => l.quantity > 0)
            .map((l) => ({
              categoryId: l.categoryId,
              itemId: l.itemId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              amount: l.amount,
            })),
        },
      },
      include: {
        lines: { include: { category: true, item: true } },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save sales entry" }, { status: 500 });
  }
}
