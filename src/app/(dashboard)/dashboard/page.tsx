"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  TrendingUp, TrendingDown, ShoppingBag, Calendar, BarChart3,
  ArrowRight, Package, Tag, ClipboardList, Trophy, Flame, Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { DashboardStats } from "@/types";

// ── Shared stat card ────────────────────────────────────────────────────────────
function StatCard({
  title, value, subtitle, icon: Icon, color = "orange", trend,
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color?: string; trend?: "up" | "down" | "neutral";
}) {
  const colors: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    blue:   "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green:  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    red:    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    teal:   "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  };
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground leading-none mb-1.5">{title}</p>
            <p className="text-lg lg:text-xl font-bold text-foreground truncate">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
          </div>
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
            <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfitBadge({ profit }: { profit: number }) {
  const positive = profit >= 0;
  return (
    <Card className={positive ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40" : "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40"}>
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground leading-none mb-1.5">Month Profit</p>
            <p className={`text-lg lg:text-xl font-bold truncate ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(Math.abs(profit))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{positive ? "Net gain" : "Net loss"}</p>
          </div>
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${positive ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
            {positive ? <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" /> : <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold mb-1">Day {label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
        ))}
      </div>
    );
  }
  return null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ── Staff dashboard ─────────────────────────────────────────────────────────────
function StaffDashboard({ userName, stats, loading, month, year }: {
  userName: string; stats: DashboardStats | null; loading: boolean; month: number; year: number;
}) {
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" userName={userName} userRole="STAFF" />
      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 lg:pb-6">
        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold">Good {getGreeting()}, {userName.split(" ")[0]} 👋</h2>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>

        {/* Big CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/sales">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white cursor-pointer hover:from-emerald-600 hover:to-emerald-800 transition-all shadow-md active:scale-95">
              <ClipboardList className="w-6 h-6 mb-2 text-emerald-100" />
              <p className="font-bold text-sm leading-tight">Enter Sales</p>
              <p className="text-xs text-emerald-200 mt-0.5">Today's entry</p>
            </div>
          </Link>
          <Link href="/expenses">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 p-4 text-white cursor-pointer hover:from-red-600 hover:to-rose-800 transition-all shadow-md active:scale-95">
              <TrendingDown className="w-6 h-6 mb-2 text-red-100" />
              <p className="font-bold text-sm leading-tight">Log Expense</p>
              <p className="text-xs text-red-200 mt-0.5">Record costs</p>
            </div>
          </Link>
        </div>

        {/* Today stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <Card key={i}><CardContent className="p-3"><Skeleton className="h-3 w-12 mb-1" /><Skeleton className="h-5 w-16" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today</p>
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Sales</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats?.todaySales ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Expenses</p>
                  <p className="text-sm font-bold text-red-500">{formatCurrency(stats?.todayExpenses ?? 0)}</p>
                </CardContent>
              </Card>
              <Card className={(stats?.todayProfit ?? 0) >= 0 ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-red-200 bg-red-50/50"}>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Profit</p>
                  <p className={`text-sm font-bold ${(stats?.todayProfit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(Math.abs(stats?.todayProfit ?? 0))}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Month stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <Card key={i}><CardContent className="p-3"><Skeleton className="h-3 w-12 mb-1" /><Skeleton className="h-5 w-16" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{getMonthName(month)}</p>
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Sales</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats?.monthSales ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Expenses</p>
                  <p className="text-sm font-bold text-red-500">{formatCurrency(stats?.monthExpenses ?? 0)}</p>
                </CardContent>
              </Card>
              <Card className={(stats?.monthProfit ?? 0) >= 0 ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10" : "border-red-200 bg-red-50/50"}>
                <CardContent className="p-3">
                  <p className="text-[10px] text-muted-foreground font-medium mb-1">Profit</p>
                  <p className={`text-sm font-bold ${(stats?.monthProfit ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(Math.abs(stats?.monthProfit ?? 0))}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Items sold */}
        {!loading && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Items sold this month</p>
                <p className="font-bold">{stats?.monthQuantity ?? 0} items</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Admin dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const userName = session?.user?.name ?? "User";
  const userRole = (session?.user as any)?.role as string | undefined;

  if (status === "loading" || !userRole) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-14 border-b bg-background flex-shrink-0" />
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-7 w-44" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-3 w-20 mb-2" /><Skeleton className="h-6 w-24" /></CardContent></Card>)}
          </div>
        </div>
      </div>
    );
  }

  if (userRole === "STAFF") {
    return <StaffDashboard userName={userName} stats={stats} loading={loading} month={month} year={year} />;
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" userName={userName} userRole={userRole} />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto pb-24 lg:pb-6">
        {/* Welcome */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Good {getGreeting()}, {userName.split(" ")[0]} 👋</h2>
            <p className="text-sm text-muted-foreground">{getMonthName(month)} {year} overview</p>
          </div>
          <Link href="/sales">
            <Button size="sm" className="gap-1.5 hidden sm:flex">
              <ClipboardList className="w-4 h-4" />Add Sales
            </Button>
          </Link>
        </div>

        {/* Stats 3+3 grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="p-4"><Skeleton className="h-3 w-16 mb-2" /><Skeleton className="h-6 w-20" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today</p>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              <StatCard title="Sales" value={formatCurrency(stats?.todaySales ?? 0)} subtitle={`${stats?.todayQuantity ?? 0} items`} icon={TrendingUp} color="orange" />
              <StatCard title="Expenses" value={formatCurrency(stats?.todayExpenses ?? 0)} subtitle="Recorded today" icon={TrendingDown} color="red" />
              <ProfitBadge profit={stats?.todayProfit ?? 0} />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">{getMonthName(month)}</p>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              <StatCard title="Revenue" value={formatCurrency(stats?.monthSales ?? 0)} subtitle="Total sales" icon={Calendar} color="blue" />
              <StatCard title="Expenses" value={formatCurrency(stats?.monthExpenses ?? 0)} subtitle="Total costs" icon={TrendingDown} color="red" />
              <ProfitBadge profit={stats?.monthProfit ?? 0} />
            </div>
          </div>
        )}

        {/* Secondary stats row */}
        {!loading && (
          <div className="grid grid-cols-2 gap-2 lg:gap-3">
            <StatCard title="Items Sold" value={String(stats?.monthQuantity ?? 0)} subtitle="This month" icon={ShoppingBag} color="green" />
            <StatCard title="Top Category" value={stats?.topCategory?.name ?? "—"} subtitle={stats?.topCategory ? formatCurrency(stats.topCategory.amount) : "No data"} icon={Trophy} color="purple" />
          </div>
        )}

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Daily Revenue vs Expenses — {getMonthName(month)}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loading ? (
              <Skeleton className="h-44 w-full" />
            ) : stats?.monthlyTrend?.length ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={stats.monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} width={38} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="amount" name="Sales" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Category pie */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Category Revenue</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              {loading ? <Skeleton className="h-44 w-full" /> : stats?.categoryBreakdown?.length ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.categoryBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="amount">
                      {stats.categoryBreakdown.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No data</div>}
            </CardContent>
          </Card>

          {/* Top items */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />Top Selling Items
                </CardTitle>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">All <ArrowRight className="w-3 h-3" /></Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
              ) : stats?.recentEntries?.length ? (
                <TopItemsList entries={stats.recentEntries} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: "/sales",      icon: ClipboardList, label: "Add Sales",   color: "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400" },
            { href: "/expenses",   icon: TrendingDown,  label: "Expenses",    color: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400" },
            { href: "/reports",    icon: BarChart3,     label: "Reports",     color: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400" },
            { href: "/categories", icon: Tag,           label: "Categories",  color: "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={`p-3 rounded-xl transition-colors cursor-pointer active:scale-95 ${a.color}`}>
                <a.icon className="w-5 h-5 mb-1.5" />
                <p className="font-semibold text-sm">{a.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopItemsList({ entries }: { entries: any[] }) {
  const itemMap: Record<string, { name: string; quantity: number; amount: number; color: string }> = {};
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!itemMap[line.itemId]) {
        itemMap[line.itemId] = { name: line.item?.name ?? "Unknown", quantity: 0, amount: 0, color: line.category?.color ?? "#f97316" };
      }
      itemMap[line.itemId].quantity += line.quantity;
      itemMap[line.itemId].amount += Number(line.amount);
    }
  }
  const items = Object.values(itemMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxAmount = items[0]?.amount ?? 1;
  if (!items.length) return <p className="text-sm text-muted-foreground text-center py-4">No data</p>;
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate">{item.name}</span>
            <span className="text-muted-foreground ml-2 flex-shrink-0 text-xs">{formatCurrency(item.amount)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(item.amount / maxAmount) * 100}%`, backgroundColor: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
