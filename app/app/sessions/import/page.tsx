"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/app/api/import/csv", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Import failed");
    } else {
      setMessage(`Imported ${json.inserted} rows`);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Import Polymarket CSV</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Expected headers: market_id,title,category,side,price,quantity,fee,executed_at,tx_id
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4"
      />
      <Button disabled={!file || isLoading} onClick={handleUpload}>
        {isLoading ? "Uploading..." : "Upload CSV"}
      </Button>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
