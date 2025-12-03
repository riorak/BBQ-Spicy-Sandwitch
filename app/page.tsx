import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Auth Elements - Top Right */}
      <div className="absolute top-4 right-4">
        {!hasEnvVars ? (
          <EnvVarWarning />
        ) : (
          <Suspense>
            <AuthButton />
          </Suspense>
        )}
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col gap-8 items-center justify-center text-center px-5">
        <h1 className="text-4xl md:text-6xl font-bold">
          Polyedge
        </h1>
        <p className="text-xl text-muted-foreground">
          Your Polymarket companion
        </p>
        
        <Button size="lg" variant="default" className="mt-8" asChild>
          <Link href="/app">To the App</Link>
        </Button>
      </div>

      {/* Theme Switcher - Bottom */}
      <div className="absolute bottom-8">
        <ThemeSwitcher />
      </div>
    </main>
  );
}
