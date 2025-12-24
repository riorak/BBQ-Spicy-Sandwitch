"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PolymarketImport } from "@/components/journal/polymarket-import";
import { WalletLinking } from "@/components/profile/wallet-linking";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      await supabase.auth.getUser(); // just to confirm session; server will check
      setLoading(false);
    };
    run();
  }, []);

  return (
    <div className="container mx-auto px-6 py-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Wallet Linking</h2>
          <WalletLinking />
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-2">Import Settings</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Configure and run imports from Polymarket. CSV imports will be linked to your account.
          </p>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading user...</div>
          ) : (
            <PolymarketImport />
          )}
        </section>
      </div>
    </div>
  );
}
