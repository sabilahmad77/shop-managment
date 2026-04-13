"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { itemSchema, type ItemInput } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import type { Category, Item } from "@/types";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Item | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: { isActive: true, sortOrder: 0, defaultUnitPrice: 0 },
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/items").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([itms, cats]) => {
      setItems(itms);
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || item.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setEditTarget(null);
    reset({ isActive: true, sortOrder: 0, defaultUnitPrice: 0 });
    setDialogOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditTarget(item);
    reset({
      name: item.name,
      categoryId: item.categoryId,
      defaultUnitPrice: item.defaultUnitPrice,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ItemInput) => {
    const url = editTarget ? `/api/items/${editTarget.id}` : "/api/items";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to save item");
      return;
    }

    toast.success(editTarget ? "Item updated" : "Item created");
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (item: Item) => {
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    }
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Cannot delete item");
      return;
    }
    toast.success("Item deleted");
    load();
  };

  // Group by category for display
  const grouped = categories.reduce(
    (acc, cat) => {
      const catItems = filtered.filter((i) => i.categoryId === cat.id);
      if (catItems.length) acc[cat.id] = { category: cat, items: catItems };
      return acc;
    },
    {} as Record<string, { category: Category; items: Item[] }>
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Items" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((g) => (
              <div key={g} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Add your first menu item"}
            </p>
            {!search && (
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(grouped).map(({ category, items: catItems }) => (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-semibold">{category.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    ({catItems.length} item{catItems.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-card p-4 flex items-center justify-between group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-sm font-semibold text-primary">
                            {formatCurrency(item.defaultUnitPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={() => toggleActive(item)}
                          className="scale-75"
                        />
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cannot delete items with existing sales records.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input placeholder="e.g. Biryani Half" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch("categoryId") ?? ""}
                onValueChange={(v) => setValue("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.isActive).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Unit Price (₨)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("defaultUnitPrice", { valueAsNumber: true })}
              />
              {errors.defaultUnitPrice && <p className="text-xs text-destructive">{errors.defaultUnitPrice.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="itemActive"
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label htmlFor="itemActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editTarget ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
