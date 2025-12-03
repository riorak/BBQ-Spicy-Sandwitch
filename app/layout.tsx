import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { ChartLine, LayoutDashboard, CalendarDays, BarChart3, Settings, Rocket } from "lucide-react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen w-full bg-background">
            <div className="flex h-screen">
              {/* Sidebar */}
              <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-secondary/10 backdrop-blur-sm">
                <div className="px-4 py-5 border-b border-border/40 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  <span className="font-bold">Spicy Journal</span>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1">
                  <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30" href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                  <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30" href="/journal">
                    <CalendarDays className="h-4 w-4" />
                    <span>Journal</span>
                  </a>
                  <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30" href="/protected">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </a>
                  <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30" href="/sessions">
                    <ChartLine className="h-4 w-4" />
                    <span>Sessions</span>
                  </a>
                </nav>
                <div className="px-4 py-4 border-t border-border/40 text-sm text-muted-foreground">
                  <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/30" href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </div>
              </aside>

              {/* Main content */}
              <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
                {/* Page content */}
                <div className="flex-1 min-h-0">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
