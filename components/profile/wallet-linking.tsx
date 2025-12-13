"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WalletLinking() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("user_settings")
        .select("polymarket_wallet")
        .eq("user_id", auth.user.id)
        .single();
      setWallet(data?.polymarket_wallet ?? "");
    };
    load();
  }, []);

  const save = async () => {
    setStatus("Saving...");
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setStatus("Please sign in."); return; }
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: auth.user.id, polymarket_wallet: wallet });
    setStatus(error ? `Error: ${error.message}` : "Saved");
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">Link your Polymarket wallet to enable syncing.</div>
      <div className="flex items-center gap-2">
        <Input placeholder="0x..." value={wallet} onChange={(e) => setWallet(e.target.value)} />
        <Button onClick={save}>Save</Button>
      </div>
      {status && <div className="text-xs">{status}</div>}
    </div>
  );
}
