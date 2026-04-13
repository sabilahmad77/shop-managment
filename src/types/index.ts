export type Role = "ADMIN" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { items: number };
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  defaultUnitPrice: number;
  isActive: boolean;
  sortOrder: number;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesEntryLine {
  id: string;
  salesEntryId: string;
  categoryId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category?: Category;
  item?: Item;
}

export interface SalesEntry {
  id: string;
  entryDate: Date | string;
  month: number;
  year: number;
  notes?: string | null;
  isDraft: boolean;
  createdById?: string | null;
  updatedById?: string | null;
  lines: SalesEntryLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Setting {
  id: string;
  shopName: string;
  currency: string;
  currencySymbol: string;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  taxEnabled: boolean;
  taxRate: number;
}

export type ExpenseCategory = "FOOD" | "RENT" | "ELECTRICITY" | "SALARY" | "GAS" | "OTHER";

export interface Expense {
  id: string;
  expenseDate: Date | string;
  month: number;
  year: number;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard stats
export interface DashboardStats {
  todaySales: number;
  todayQuantity: number;
  todayExpenses: number;
  todayProfit: number;
  monthSales: number;
  monthQuantity: number;
  monthExpenses: number;
  monthProfit: number;
  topCategory: { name: string; amount: number } | null;
  topItem: { name: string; amount: number; quantity: number } | null;
  recentEntries: SalesEntry[];
  monthlyTrend: { day: number; amount: number; expenses: number }[];
  categoryBreakdown: { name: string; amount: number; color: string }[];
  expenseBreakdown: { category: string; amount: number }[];
}

// Report types
export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  color: string;
  totalAmount: number;
  totalQuantity: number;
  items: ItemReport[];
}

export interface ItemReport {
  itemId: string;
  itemName: string;
  categoryName: string;
  totalQuantity: number;
  totalAmount: number;
  unitPrice: number;
}

export interface DailyReport {
  date: string;
  totalAmount: number;
  totalQuantity: number;
  categories: {
    categoryName: string;
    amount: number;
    quantity: number;
  }[];
}

// Form types for sales entry
export interface SalesLineForm {
  id?: string;
  categoryId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface DaySalesForm {
  date: Date;
  lines: SalesLineForm[];
  notes?: string;
  isDraft: boolean;
  existingEntryId?: string;
}
