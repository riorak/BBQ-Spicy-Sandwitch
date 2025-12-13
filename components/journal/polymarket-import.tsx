"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PolymarketImport() {
  const [file, setFile] = useState<File | null>(null);
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);

  const onSubmit = async () => {
    if (!file || !wallet) {
      setStatus("Please select a CSV file and enter wallet.");
      return;
    }
    setStatus("Uploading...");
    setErrors([]);

    const form = new FormData();
    form.append("file", file);
    form.append("wallet", wallet);
    // user_id resolved on server via Supabase auth cookies

    const res = await fetch("/api/journal/import/polymarket", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      setStatus(`Error: ${data.error ?? "Unknown error"}`);
    } else {
      setStatus(`Imported ${data.imported} rows.`);
      setErrors(data.errors ?? []);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Input placeholder="Wallet address" value={wallet} onChange={(e) => setWallet(e.target.value)} />
        <Button onClick={onSubmit}>Import CSV</Button>
      </div>
      {status && <div className="text-sm">{status}</div>}
      {errors.length > 0 && (
        <div className="text-sm">
          <div className="font-semibold">Row errors:</div>
          <ul className="list-disc ml-4">
            {errors.map((e) => (
              <li key={e.row}>{`Row ${e.row}: ${e.message}`}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
