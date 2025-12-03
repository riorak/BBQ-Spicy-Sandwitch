import type { Metadata } from "next";
import { ChartLine, LayoutDashboard, CalendarDays, BarChart3, Settings, Rocket } from "lucide-react";
import { ProfileDropdown } from "@/components/profile-dropdown";

export const metadata: Metadata = {
  title: "Polyedge App",
  description: "Trading journal and analytics for Polymarket",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-secondary/10 backdrop-blur-sm">
          <div className="px-4 py-5 border-b border-border/40 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-bold">Polyedge</span>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors" href="/app">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors" href="/app/journal">
              <CalendarDays className="h-4 w-4" />
              <span>Journal</span>
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors" href="/app/analytics">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </a>
            <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30 transition-colors" href="/app/sessions">
              <ChartLine className="h-4 w-4" />
              <span>Sessions</span>
            </a>
          </nav>
          <div className="px-2 py-4 border-t border-border/40">
            <ProfileDropdown />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
