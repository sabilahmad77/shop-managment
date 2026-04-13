"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

/** Always redirects to /login on the CURRENT domain — never localhost */
function useSignOut() {
  return useCallback(() => {
    signOut({ callbackUrl: `${window.location.origin}/login` });
  }, []);
}
import {
  LayoutDashboard, ClipboardList, Tag, ShoppingBag, BarChart3,
  Settings, LogOut, ChefHat, Menu, X, ChevronRight,
  ShieldCheck, Users, TrendingDown, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ADMIN_NAV = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/sales",      label: "Daily Sales",  icon: ClipboardList },
  { href: "/expenses",   label: "Expenses",     icon: TrendingDown },
  { href: "/categories", label: "Categories",   icon: Tag },
  { href: "/items",      label: "Items",        icon: ShoppingBag },
  { href: "/reports",    label: "Reports",      icon: BarChart3 },
  { href: "/settings",   label: "Settings",     icon: Settings },
];

const STAFF_NAV = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/sales",     label: "Daily Sales", icon: ClipboardList },
  { href: "/expenses",  label: "Expenses",    icon: TrendingDown },
];

// Mobile bottom nav: primary tabs + "More" for admin extras
const ADMIN_BOTTOM_PRIMARY = [
  { href: "/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/sales",     label: "Sales",    icon: ClipboardList },
  { href: "/expenses",  label: "Expenses", icon: TrendingDown },
  { href: "/reports",   label: "Reports",  icon: BarChart3 },
];

const ADMIN_MORE_ITEMS = [
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/items",      label: "Items",       icon: ShoppingBag },
  { href: "/settings",   label: "Settings",    icon: Settings },
];

// ── Desktop nav link ───────────────────────────────────────────────────────────
function NavLink({ item, active, collapsed }: {
  item: { href: string; label: string; icon: React.ElementType };
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
      {!collapsed && active && <ChevronRight className="w-4 h-4 ml-auto text-white/70" />}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return link;
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname  = usePathname();
  const doSignOut = useSignOut();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "STAFF";
  const isAdmin = role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : STAFF_NAV;

  return (
    <aside className={cn("flex flex-col h-full bg-sidebar transition-all duration-300 ease-in-out", collapsed ? "w-16" : "w-60")}>
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border flex-shrink-0", collapsed && "justify-center")}>
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Shaahi Biryani</p>
            <p className="text-xs text-sidebar-foreground/50">Sales Manager</p>
          </div>
        )}
        <button onClick={onToggle} className={cn("text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors", collapsed ? "mt-0" : "ml-auto")}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-3">
          <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full w-fit", isAdmin ? "bg-orange-500/15 text-orange-400" : "bg-emerald-500/15 text-emerald-400")}>
            {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {isAdmin ? "Administrator" : "Staff"}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-none mt-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-sidebar-border">
        {collapsed ? (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={() => doSignOut()} className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/50 hover:text-red-400 hover:bg-sidebar-accent transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button onClick={() => doSignOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

// ── Mobile drawer sidebar (kept for legacy / fallback) ─────────────────────────
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname  = usePathname();
  const doSignOut = useSignOut();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "STAFF";
  const isAdmin = role === "ADMIN";
  const navItems = isAdmin ? ADMIN_NAV : STAFF_NAV;

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <div className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 lg:hidden flex flex-col", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground">Shaahi Biryani</p>
              <div className={cn("flex items-center gap-1 text-xs font-medium mt-0.5", isAdmin ? "text-orange-400" : "text-emerald-400")}>
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                {isAdmin ? "Administrator" : "Staff"}
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-sidebar-foreground/50 hover:text-sidebar-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" onClick={() => setOpen(false)}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all", active ? "bg-sidebar-primary text-white" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent")}>
                <Icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => doSignOut()} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground/60 hover:text-red-400 hover:bg-sidebar-accent transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />Sign out
          </button>
        </div>
      </div>
    </>
  );
}

// ── Mobile bottom tab bar ──────────────────────────────────────────────────────
export function MobileBottomNav() {
  const pathname  = usePathname();
  const doSignOut = useSignOut();
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const role = (session?.user as any)?.role ?? "STAFF";
  const isAdmin = role === "ADMIN";

  const primaryItems = isAdmin ? ADMIN_BOTTOM_PRIMARY : STAFF_NAV;

  const isMoreActive = isAdmin && ADMIN_MORE_ITEMS.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {/* More sheet backdrop */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMoreOpen(false)} />
      )}

      {/* More items slide-up sheet */}
      {moreOpen && (
        <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden bg-sidebar rounded-t-2xl shadow-2xl border-t border-sidebar-border p-4">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="grid grid-cols-3 gap-2">
            {ADMIN_MORE_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors", active ? "bg-sidebar-primary text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent")}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => { setMoreOpen(false); signOut({ callbackUrl: "/login" }); }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-sidebar border-t border-sidebar-border">
        <div className="flex items-center safe-area-pb">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors",
                  active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More tab (admin only) */}
          {isAdmin && (
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors",
                isMoreActive || moreOpen ? "text-sidebar-primary" : "text-sidebar-foreground/50"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
