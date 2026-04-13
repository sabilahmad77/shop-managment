import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shaahi.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@shaahi.com",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create staff user
  const staffHash = await bcrypt.hash("staff123", 12);
  await prisma.user.upsert({
    where: { email: "staff@shaahi.com" },
    update: {},
    create: {
      name: "Staff Member",
      email: "staff@shaahi.com",
      passwordHash: staffHash,
      role: "STAFF",
    },
  });
  console.log("✅ Staff user created");

  // Create settings
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "Shaahi Biryani",
      currency: "PKR",
      currencySymbol: "₨",
      address: "Main Boulevard, Gulberg, Lahore",
      phone: "+92 300 1234567",
    },
  });
  console.log("✅ Settings created");

  // Categories
  const categories = [
    { name: "Biryani", slug: "biryani", color: "#f97316", sortOrder: 1 },
    { name: "Burger", slug: "burger", color: "#8b5cf6", sortOrder: 2 },
    { name: "Shawarma", slug: "shawarma", color: "#06b6d4", sortOrder: 3 },
    { name: "Fast Food", slug: "fast-food", color: "#10b981", sortOrder: 4 },
    { name: "Drinks", slug: "drinks", color: "#f43f5e", sortOrder: 5 },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color, sortOrder: cat.sortOrder },
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
    console.log(`✅ Category: ${cat.name}`);
  }

  // Items
  const items = [
    // Biryani
    { categorySlug: "biryani", name: "Biryani Half", slug: "biryani-half", price: 350, sortOrder: 1 },
    { categorySlug: "biryani", name: "Biryani Full", slug: "biryani-full", price: 650, sortOrder: 2 },
    { categorySlug: "biryani", name: "Biryani Family", slug: "biryani-family", price: 1200, sortOrder: 3 },
    { categorySlug: "biryani", name: "Rice Plain", slug: "rice-plain", price: 150, sortOrder: 4 },
    { categorySlug: "biryani", name: "Rice Special", slug: "rice-special", price: 250, sortOrder: 5 },

    // Burger
    { categorySlug: "burger", name: "Zinger Burger", slug: "zinger-burger", price: 380, sortOrder: 1 },
    { categorySlug: "burger", name: "Chicken Burger", slug: "chicken-burger", price: 280, sortOrder: 2 },
    { categorySlug: "burger", name: "Beef Burger", slug: "beef-burger", price: 420, sortOrder: 3 },
    { categorySlug: "burger", name: "Double Patty Burger", slug: "double-patty-burger", price: 550, sortOrder: 4 },

    // Shawarma
    { categorySlug: "shawarma", name: "Zinger Cheese Shawarma", slug: "zinger-cheese-shawarma", price: 320, sortOrder: 1 },
    { categorySlug: "shawarma", name: "Chicken Shawarma", slug: "chicken-shawarma", price: 250, sortOrder: 2 },
    { categorySlug: "shawarma", name: "Special Shawarma", slug: "special-shawarma", price: 380, sortOrder: 3 },
    { categorySlug: "shawarma", name: "Shawarma Roll", slug: "shawarma-roll", price: 200, sortOrder: 4 },

    // Fast Food
    { categorySlug: "fast-food", name: "Nuggets 6pc", slug: "nuggets-6pc", price: 280, sortOrder: 1 },
    { categorySlug: "fast-food", name: "Nuggets 12pc", slug: "nuggets-12pc", price: 500, sortOrder: 2 },
    { categorySlug: "fast-food", name: "Fries Regular", slug: "fries-regular", price: 150, sortOrder: 3 },
    { categorySlug: "fast-food", name: "Fries Large", slug: "fries-large", price: 220, sortOrder: 4 },
    { categorySlug: "fast-food", name: "Sandwich", slug: "sandwich", price: 200, sortOrder: 5 },

    // Drinks
    { categorySlug: "drinks", name: "Pepsi Can", slug: "pepsi-can", price: 80, sortOrder: 1 },
    { categorySlug: "drinks", name: "7UP Can", slug: "7up-can", price: 80, sortOrder: 2 },
    { categorySlug: "drinks", name: "Water Bottle", slug: "water-bottle", price: 60, sortOrder: 3 },
    { categorySlug: "drinks", name: "Raita", slug: "raita", price: 80, sortOrder: 4 },
  ];

  for (const item of items) {
    const { categorySlug, price, ...rest } = item;
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: { defaultUnitPrice: price, sortOrder: item.sortOrder },
      create: {
        ...rest,
        categoryId: createdCategories[categorySlug],
        defaultUnitPrice: price,
      },
    });
    console.log(`  ✅ Item: ${item.name} @ ₨${price}`);
  }

  // Sample sales entries for current month
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const biriyaniHalf = await prisma.item.findUnique({ where: { slug: "biryani-half" } });
  const biryaniFull = await prisma.item.findUnique({ where: { slug: "biryani-full" } });
  const zingerBurger = await prisma.item.findUnique({ where: { slug: "zinger-burger" } });
  const chickenShawarma = await prisma.item.findUnique({ where: { slug: "chicken-shawarma" } });

  if (biriyaniHalf && biryaniFull && zingerBurger && chickenShawarma) {
    // Sample entry for day 1 of current month
    const day1 = new Date(year, month - 1, 1);
    await prisma.salesEntry.upsert({
      where: { entryDate: day1 },
      update: {},
      create: {
        entryDate: day1,
        month,
        year,
        createdById: admin.id,
        lines: {
          create: [
            {
              categoryId: createdCategories["biryani"],
              itemId: biriyaniHalf.id,
              quantity: 15,
              unitPrice: Number(biriyaniHalf.defaultUnitPrice),
              amount: 15 * Number(biriyaniHalf.defaultUnitPrice),
            },
            {
              categoryId: createdCategories["biryani"],
              itemId: biryaniFull.id,
              quantity: 8,
              unitPrice: Number(biryaniFull.defaultUnitPrice),
              amount: 8 * Number(biryaniFull.defaultUnitPrice),
            },
            {
              categoryId: createdCategories["burger"],
              itemId: zingerBurger.id,
              quantity: 20,
              unitPrice: Number(zingerBurger.defaultUnitPrice),
              amount: 20 * Number(zingerBurger.defaultUnitPrice),
            },
            {
              categoryId: createdCategories["shawarma"],
              itemId: chickenShawarma.id,
              quantity: 12,
              unitPrice: Number(chickenShawarma.defaultUnitPrice),
              amount: 12 * Number(chickenShawarma.defaultUnitPrice),
            },
          ],
        },
      },
    });
    console.log("✅ Sample sales entry created for day 1");
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\nLogin credentials:");
  console.log("  Admin: admin@shaahi.com / admin123");
  console.log("  Staff: staff@shaahi.com / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
