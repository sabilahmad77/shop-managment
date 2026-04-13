import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { ChefHat, ShieldCheck, Users } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    const role = (session.user as any)?.role;
    redirect(role === "ADMIN" ? "/dashboard" : "/sales");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
          <ChefHat className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Shaahi Biryani</h1>
        <p className="text-slate-400 mt-1">Sales Management System</p>
      </div>

      {/* Portal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-lg">
        {/* Admin Portal */}
        <Link href="/login">
          <div className="group relative bg-slate-800/60 border border-slate-700 hover:border-orange-500/60 rounded-2xl p-7 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-orange-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/25 transition-colors">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-1">Admin Portal</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Full access — manage categories, items, reports & settings.
            </p>
            <div className="mt-5 text-xs font-semibold text-orange-400 flex items-center gap-1.5">
              Sign in as Admin
              <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
            </div>
          </div>
        </Link>

        {/* Staff Portal */}
        <Link href="/staff-login">
          <div className="group relative bg-slate-800/60 border border-slate-700 hover:border-emerald-500/60 rounded-2xl p-7 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/25 transition-colors">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold text-lg mb-1">Staff Portal</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Daily sales entry — enter quantities and track today's revenue.
            </p>
            <div className="mt-5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              Sign in as Staff
              <span className="transition-transform group-hover:translate-x-1 inline-block">→</span>
            </div>
          </div>
        </Link>
      </div>

      <p className="text-slate-600 text-xs mt-10">
        &copy; {new Date().getFullYear()} Shaahi Biryani. All rights reserved.
      </p>
    </div>
  );
}
