"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
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
import { categorySchema, type CategoryInput } from "@/lib/validators";
import type { Category } from "@/types";

const PRESET_COLORS = [
  "#f97316", "#8b5cf6", "#06b6d4", "#10b981",
  "#f43f5e", "#eab308", "#3b82f6", "#14b8a6",
  "#a855f7", "#ec4899", "#84cc16", "#f59e0b",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: { color: "#f97316", isActive: true, sortOrder: 0 } });

  const selectedColor = watch("color");

  const load = () => {
    setLoading(true);
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { setCategories(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    reset({ color: "#f97316", isActive: true, sortOrder: categories.length });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    reset({ name: cat.name, color: cat.color, icon: cat.icon ?? undefined, isActive: cat.isActive, sortOrder: cat.sortOrder });
    setDialogOpen(true);
  };

  const onSubmit = async (data: CategoryInput) => {
    const url = editTarget ? `/api/categories/${editTarget.id}` : "/api/categories";
    const method = editTarget ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to save category");
      return;
    }

    toast.success(editTarget ? "Category updated" : "Category created");
    setDialogOpen(false);
    load();
  };

  const toggleActive = async (cat: Category) => {
    const res = await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (res.ok) {
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c)));
    }
  };

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Cannot delete category");
      return;
    }
    toast.success("Category deleted");
    load();
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Categories" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{categories.length} Categories</h2>
            <p className="text-sm text-muted-foreground">Manage your food categories</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first food category</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border bg-card p-5 flex flex-col gap-3 group hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(cat as any)._count?.items ?? 0} items
                      </p>
                    </div>
                  </div>
                  <Badge variant={cat.isActive ? "success" : "secondary"}>
                    {cat.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cat.isActive}
                      onCheckedChange={() => toggleActive(cat)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {cat.isActive ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the category. Items and sales data using this category cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteCategory(cat.id)}
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
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input placeholder="e.g. Biryani" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("color", c)}
                    className={`w-8 h-8 rounded-lg transition-all ${selectedColor === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setValue("color", e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <span className="text-sm text-muted-foreground">Custom color: {selectedColor}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label htmlFor="isActive">Active</Label>
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
