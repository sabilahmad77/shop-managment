"use client";

import { useEffect, useState } from "react";
import { BarChart3, Download, TrendingUp, Package, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  formatCurrency,
  getMonthName,
  getMonthOptions,
  getYearOptions,
  getCurrentMonthYear,
} from "@/lib/utils";
import type { CategoryReport, ItemReport, DailyReport } from "@/types";

export default function ReportsPage() {
  const { month: curMonth, year: curYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [activeTab, setActiveTab] = useState("daily");
  const [loading, setLoading] = useState(false);

  const [dailyData, setDailyData] = useState<DailyReport[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryReport[]>([]);
  const [itemData, setItemData] = useState<ItemReport[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?type=${activeTab}&month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        if (activeTab === "daily") setDailyData(data);
        else if (activeTab === "category") setCategoryData(data);
        else if (activeTab === "item") setItemData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month, year, activeTab]);

  const handleExportCSV = () => {
    let csv = "";
    if (activeTab === "daily") {
      csv = "Date,Total Amount,Total Quantity\n" +
        dailyData.map((d) => `${d.date},${d.totalAmount},${d.totalQuantity}`).join("\n");
    } else if (activeTab === "item") {
      csv = "Item,Category,Unit Price,Qty,Revenue\n" +
        itemData.map((i) => `${i.itemName},${i.categoryName},${i.unitPrice},${i.totalQuantity},${i.totalAmount}`).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shaahi-report-${getMonthName(month)}-${year}.csv`;
    a.click();
  };

  const monthTotal = dailyData.reduce((s, d) => s + d.totalAmount, 0);
  const monthQty = dailyData.reduce((s, d) => s + d.totalQuantity, 0);

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports & Analytics" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Month Revenue</p>
              <p className="text-xl font-bold text-primary mt-1">{formatCurrency(monthTotal)}</p>
              <p className="text-xs text-muted-foreground">{getMonthName(month)} {year}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Items Sold</p>
              <p className="text-xl font-bold mt-1">{monthQty.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Units</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Active Days</p>
              <p className="text-xl font-bold mt-1">{dailyData.length}</p>
              <p className="text-xs text-muted-foreground">Days with sales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg Daily Revenue</p>
              <p className="text-xl font-bold mt-1">
                {formatCurrency(dailyData.length ? monthTotal / dailyData.length : 0)}
              </p>
              <p className="text-xs text-muted-foreground">Per active day</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="daily" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-2">
              <Tag className="w-4 h-4" />
              Category
            </TabsTrigger>
            <TabsTrigger value="item" className="gap-2">
              <Package className="w-4 h-4" />
              Items
            </TabsTrigger>
          </TabsList>

          {/* Daily report */}
          <TabsContent value="daily" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Daily Revenue — {getMonthName(month)} {year}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : dailyData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                        labelFormatter={(l) => `Day ${l}`}
                      />
                      <Bar dataKey="totalAmount" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>

            {!loading && dailyData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Daily Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Day</th>
                          <th className="text-right py-2 pr-4 font-medium">Items</th>
                          <th className="text-right py-2 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.map((d, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 pr-4 font-medium">
                              {getMonthName(month).slice(0, 3)} {new Date(d.date).getDate()}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-muted-foreground">{d.totalQuantity}</td>
                            <td className="py-2.5 text-right font-semibold">{formatCurrency(d.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/50 font-semibold">
                          <td className="py-2.5 pr-4">Total</td>
                          <td className="py-2.5 pr-4 text-right">{monthQty}</td>
                          <td className="py-2.5 text-right text-primary">{formatCurrency(monthTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Category report */}
          <TabsContent value="category" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : categoryData.length ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={55}
                          paddingAngle={3}
                          dataKey="totalAmount"
                          nameKey="categoryName"
                        >
                          {categoryData.map((c, i) => (
                            <Cell key={i} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                        <Legend iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Category Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
                  ) : categoryData.length ? (
                    <div className="space-y-3">
                      {categoryData.map((cat, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{cat.categoryName}</span>
                              <span className="text-sm font-semibold ml-2">{formatCurrency(cat.totalAmount)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(cat.totalAmount / (categoryData[0]?.totalAmount || 1)) * 100}%`,
                                  backgroundColor: cat.color,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{cat.totalQuantity} items • {cat.items.length} products</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Per-category item breakdown */}
            {!loading && categoryData.map((cat, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.categoryName} — Item Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Item</th>
                          <th className="text-right py-2 pr-4 font-medium">Unit Price</th>
                          <th className="text-right py-2 pr-4 font-medium">Qty</th>
                          <th className="text-right py-2 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, j) => (
                          <tr key={j} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2 pr-4">{item.itemName}</td>
                            <td className="py-2 pr-4 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 pr-4 text-right">{item.totalQuantity}</td>
                            <td className="py-2 text-right font-semibold">{formatCurrency(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Item report */}
          <TabsContent value="item" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top Items by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : itemData.length ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        layout="vertical"
                        data={itemData.slice(0, 8)}
                        margin={{ top: 5, right: 10, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="itemName" type="category" tick={{ fontSize: 11 }} width={75} />
                        <Tooltip formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
                        <Bar dataKey="totalAmount" fill="#f97316" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10" />)}</div>
                  ) : itemData.length ? (
                    <div className="space-y-2">
                      {itemData.slice(0, 10).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-1.5">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                              i === 1 ? "bg-gray-100 text-gray-600" :
                              i === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">{item.categoryName} • {item.totalQuantity} sold</p>
                          </div>
                          <span className="text-sm font-semibold text-primary">{formatCurrency(item.totalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </CardContent>
              </Card>
            </div>

            {!loading && itemData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">All Items — {getMonthName(month)} {year}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">#</th>
                          <th className="text-left py-2 pr-4 font-medium">Item</th>
                          <th className="text-left py-2 pr-4 font-medium">Category</th>
                          <th className="text-right py-2 pr-4 font-medium">Unit Price</th>
                          <th className="text-right py-2 pr-4 font-medium">Qty</th>
                          <th className="text-right py-2 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemData.map((item, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
                            <td className="py-2.5 pr-4 font-medium">{item.itemName}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{item.categoryName}</td>
                            <td className="py-2.5 pr-4 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2.5 pr-4 text-right">{item.totalQuantity}</td>
                            <td className="py-2.5 text-right font-semibold">{formatCurrency(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground">
      <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
      <p className="text-sm">No data for this period</p>
    </div>
  );
}
