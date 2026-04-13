import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { itemSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = itemSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data: any = { ...parsed.data };
    if (data.name) {
      data.slug = slugify(data.name);
      const existing = await prisma.item.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (existing) data.slug = `${data.slug}-${Date.now()}`;
    }

    const item = await prisma.item.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const linesCount = await prisma.salesEntryLine.count({
      where: { itemId: id },
    });
    if (linesCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete item with existing sales data" },
        { status: 400 }
      );
    }

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
