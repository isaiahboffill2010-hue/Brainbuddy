"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/students", icon: Users, label: "My Students" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function ParentTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur px-4 h-14">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-gradient-brand flex items-center justify-center text-base">🧠</div>
        <span className="font-bold gradient-text">BrainBuddy</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:bg-white/5">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 bg-card border-white/5">
          <div className="flex items-center gap-2.5 mb-8 mt-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center text-lg">🧠</div>
            <span className="font-bold gradient-text">BrainBuddy</span>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  pathname === item.href
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 mt-4"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
