"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
}

export function Header({ title, userName = "User", userRole = "STAFF" }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const isAdmin = userRole === "ADMIN";

  return (
    <header className="h-14 lg:h-16 border-b bg-background flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 sticky top-0 z-30">
      {/* Role badge — mobile only */}
      <div className={`lg:hidden flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isAdmin ? "bg-orange-500/15 text-orange-500" : "bg-emerald-500/15 text-emerald-500"}`}>
        {isAdmin ? "Admin" : "Staff"}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-base lg:text-lg font-semibold text-foreground truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground font-normal">{isAdmin ? "Administrator" : "Staff"}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && (
              <DropdownMenuItem asChild>
                <a href="/settings">Settings</a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
