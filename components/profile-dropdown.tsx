"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, CreditCard, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

export function ProfileDropdown() {
  const [email, setEmail] = useState<string>("");
  const [initials, setInitials] = useState<string>("U");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setEmail(data.user.email);
        const usernamePart = data.user.email.split("@")[0];
        setInitials(usernamePart.slice(0, 2).toUpperCase());
      }
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const username = email ? email.split("@")[0] : "User";

  return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/40 transition-colors w-full focus:outline-none">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {initials}
          </div>
          <div className="flex-1 text-left leading-tight">
            <div className="text-sm font-medium">{username}</div>
            <div className="text-[11px] text-muted-foreground">Pro Plan</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <div className="text-xs mb-2 text-muted-foreground">Appearance</div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/app/profile" className="cursor-pointer">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/billing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing & Payment</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
