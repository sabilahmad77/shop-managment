"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, ChefHat, Loader2, ArrowLeft, ClipboardList } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function StaffLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        // Fetch session to verify role
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;

        if (role === "ADMIN") {
          toast.error("Please use the Admin Portal to sign in.");
          await fetch("/api/auth/signout", { method: "POST" });
          return;
        }

        toast.success("Welcome! Ready to log today's sales.");
        router.push("/sales");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center p-5">
      {/* Back to portal */}
      <div className="w-full max-w-sm mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portal selection
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Staff Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Shaahi Biryani — Daily Sales</p>
        </div>

        {/* Info badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-300">Staff accounts can only enter and view daily sales.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Email address</label>
            <input
              type="email"
              placeholder="staff@shaahi.com"
              autoComplete="email"
              className={cn(
                "w-full h-11 bg-slate-900/80 border rounded-lg px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
                errors.email ? "border-red-500" : "border-slate-600 hover:border-slate-500"
              )}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  "w-full h-11 bg-slate-900/80 border rounded-lg px-3 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
                  errors.password ? "border-red-500" : "border-slate-600 hover:border-slate-500"
                )}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in to Staff Portal"
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 rounded-lg bg-slate-900/60 border border-slate-700 p-3 text-xs text-slate-400">
          <p className="font-medium text-slate-300 mb-1">Demo staff credentials</p>
          <p>staff@shaahi.com / staff123</p>
        </div>
      </div>

      {/* Admin link */}
      <p className="mt-6 text-xs text-slate-500">
        Are you an admin?{" "}
        <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
          Use Admin Portal
        </Link>
      </p>
    </div>
  );
}
