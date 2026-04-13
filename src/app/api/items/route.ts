import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { itemSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (activeOnly) where.isActive = true;

    const items = await prisma.item.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { category: true },
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, categoryId, defaultUnitPrice, isActive, sortOrder } = parsed.data;
    let slug = slugify(name);

    const existing = await prisma.item.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const item = await prisma.item.create({
      data: { name, slug, categoryId, defaultUnitPrice, isActive, sortOrder },
      include: { category: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
