"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Settings, Save, Loader2, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";
import { settingsSchema, type SettingsInput } from "@/lib/validators";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        reset({
          shopName: data.shopName,
          currency: data.currency,
          currencySymbol: data.currencySymbol,
          address: data.address ?? "",
          phone: data.phone ?? "",
          taxEnabled: data.taxEnabled,
          taxRate: Number(data.taxRate),
        });
        setLoading(false);
      });
  }, [reset]);

  const onSubmit = async (data: SettingsInput) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Settings saved successfully");
      reset(data);
    } else {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-2xl space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Shop Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Shop Information
                  </CardTitle>
                  <CardDescription>Basic details about your shop</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Shop Name</Label>
                    <Input placeholder="Shaahi Biryani" {...register("shopName")} />
                    {errors.shopName && <p className="text-xs text-destructive">{errors.shopName.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Currency Code</Label>
                      <Input placeholder="PKR" {...register("currency")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency Symbol</Label>
                      <Input placeholder="₨" {...register("currencySymbol")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input placeholder="Shop address" {...register("address")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input placeholder="+92 300 1234567" {...register("phone")} />
                  </div>
                </CardContent>
              </Card>

              {/* Tax Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tax Settings</CardTitle>
                  <CardDescription>Configure tax for your sales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Tax</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Apply tax to sales entries</p>
                    </div>
                    <Switch
                      checked={watch("taxEnabled")}
                      onCheckedChange={(v) => setValue("taxEnabled", v)}
                    />
                  </div>

                  {watch("taxEnabled") && (
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        placeholder="17"
                        {...register("taxRate", { valueAsNumber: true })}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Version</span>
                    <span className="font-mono text-foreground">1.0.0</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <span className="text-foreground">PostgreSQL via Prisma</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span>Default Credentials</span>
                    <span className="text-foreground">admin@shaahi.com</span>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Settings
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
