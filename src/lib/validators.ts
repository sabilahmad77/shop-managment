import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").default("#f97316"),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const itemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required").max(150),
  defaultUnitPrice: z.number().min(0, "Price must be non-negative"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const salesEntryLineSchema = z.object({
  categoryId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().min(0),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

export const salesEntrySchema = z.object({
  entryDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  isDraft: z.boolean().default(false),
  lines: z.array(salesEntryLineSchema).min(0),
});

export const settingsSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  taxEnabled: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
});

export const expenseSchema = z.object({
  expenseDate: z.string().min(1, "Date is required"),
  category: z.enum(["FOOD", "RENT", "ELECTRICITY", "SALARY", "GAS", "OTHER"]),
  description: z.string().min(1, "Description is required").max(200),
  amount: z.number().min(1, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

export const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type SalesEntryInput = z.infer<typeof salesEntrySchema>;
export type SalesEntryLineInput = z.infer<typeof salesEntryLineSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type UserInput = z.infer<typeof userSchema>;
