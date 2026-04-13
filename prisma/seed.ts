import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Wipe all transactional data first ─────────────────────────────────────
  await prisma.salesEntryLine.deleteMany();
  await prisma.salesEntry.deleteMany();
  await prisma.expense.deleteMany();
  console.log("🧹 Cleared all sales & expenses — starting from zero");

  // ─── Admin user ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@Shaahi24", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shaahirestaurant.com" },
    update: { passwordHash: adminHash, name: "Admin" },
    create: {
      name: "Admin",
      email: "admin@shaahirestaurant.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // ─── Staff user ─────────────────────────────────────────────────────────────
  const staffHash = await bcrypt.hash("Staff@Shaahi24", 12);
  await prisma.user.upsert({
    where: { email: "cashier@shaahirestaurant.com" },
    update: { passwordHash: staffHash, name: "Cashier" },
    create: {
      name: "Cashier",
      email: "cashier@shaahirestaurant.com",
      passwordHash: staffHash,
      role: "STAFF",
    },
  });
  console.log("✅ Staff created: cashier@shaahirestaurant.com");

  // Remove old demo accounts if they exist
  await prisma.user.deleteMany({
    where: { email: { in: ["admin@shaahi.com", "staff@shaahi.com"] } },
  });

  // ─── Settings ───────────────────────────────────────────────────────────────
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
  console.log("✅ Settings ready");

  // ─── Categories ─────────────────────────────────────────────────────────────
  const categories = [
    { name: "Biryani",   slug: "biryani",   color: "#f97316", sortOrder: 1 },
    { name: "Burger",    slug: "burger",    color: "#8b5cf6", sortOrder: 2 },
    { name: "Shawarma",  slug: "shawarma",  color: "#06b6d4", sortOrder: 3 },
    { name: "Fast Food", slug: "fast-food", color: "#10b981", sortOrder: 4 },
    { name: "Drinks",    slug: "drinks",    color: "#f43f5e", sortOrder: 5 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color, sortOrder: cat.sortOrder },
      create: cat,
    });
    createdCategories[cat.slug] = c.id;
  }
  console.log("✅ Categories ready (5)");

  // ─── Items ───────────────────────────────────────────────────────────────────
  const items = [
    { categorySlug: "biryani",   name: "Biryani Half",           slug: "biryani-half",           price: 350,  sortOrder: 1 },
    { categorySlug: "biryani",   name: "Biryani Full",           slug: "biryani-full",           price: 650,  sortOrder: 2 },
    { categorySlug: "biryani",   name: "Biryani Family",         slug: "biryani-family",         price: 1200, sortOrder: 3 },
    { categorySlug: "biryani",   name: "Rice Plain",             slug: "rice-plain",             price: 150,  sortOrder: 4 },
    { categorySlug: "biryani",   name: "Rice Special",           slug: "rice-special",           price: 250,  sortOrder: 5 },
    { categorySlug: "burger",    name: "Zinger Burger",          slug: "zinger-burger",          price: 380,  sortOrder: 1 },
    { categorySlug: "burger",    name: "Chicken Burger",         slug: "chicken-burger",         price: 280,  sortOrder: 2 },
    { categorySlug: "burger",    name: "Beef Burger",            slug: "beef-burger",            price: 420,  sortOrder: 3 },
    { categorySlug: "burger",    name: "Double Patty Burger",    slug: "double-patty-burger",    price: 550,  sortOrder: 4 },
    { categorySlug: "shawarma",  name: "Zinger Cheese Shawarma", slug: "zinger-cheese-shawarma", price: 320,  sortOrder: 1 },
    { categorySlug: "shawarma",  name: "Chicken Shawarma",       slug: "chicken-shawarma",       price: 250,  sortOrder: 2 },
    { categorySlug: "shawarma",  name: "Special Shawarma",       slug: "special-shawarma",       price: 380,  sortOrder: 3 },
    { categorySlug: "shawarma",  name: "Shawarma Roll",          slug: "shawarma-roll",          price: 200,  sortOrder: 4 },
    { categorySlug: "fast-food", name: "Nuggets 6pc",            slug: "nuggets-6pc",            price: 280,  sortOrder: 1 },
    { categorySlug: "fast-food", name: "Nuggets 12pc",           slug: "nuggets-12pc",           price: 500,  sortOrder: 2 },
    { categorySlug: "fast-food", name: "Fries Regular",          slug: "fries-regular",          price: 150,  sortOrder: 3 },
    { categorySlug: "fast-food", name: "Fries Large",            slug: "fries-large",            price: 220,  sortOrder: 4 },
    { categorySlug: "fast-food", name: "Sandwich",               slug: "sandwich",               price: 200,  sortOrder: 5 },
    { categorySlug: "drinks",    name: "Pepsi Can",              slug: "pepsi-can",              price: 80,   sortOrder: 1 },
    { categorySlug: "drinks",    name: "7UP Can",                slug: "7up-can",                price: 80,   sortOrder: 2 },
    { categorySlug: "drinks",    name: "Water Bottle",           slug: "water-bottle",           price: 60,   sortOrder: 3 },
    { categorySlug: "drinks",    name: "Raita",                  slug: "raita",                  price: 80,   sortOrder: 4 },
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
  }
  console.log("✅ Items ready (22)");

  console.log("\n🎉 Done — all transactions start from ZERO.\n");
  console.log("🔐 Production credentials:");
  console.log("  Admin  : admin@shaahirestaurant.com  /  Admin@Shaahi24");
  console.log("  Staff  : cashier@shaahirestaurant.com  /  Staff@Shaahi24");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
