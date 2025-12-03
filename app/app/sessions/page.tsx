"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function SessionsPage() {
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
      setMessage(`✓ Imported ${json.inserted} rows successfully`);
      setFile(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">CSV Journal Upload</h1>
          <p className="text-muted-foreground">
            Import your Polymarket trades to track performance
          </p>
        </div>

        <div className="bg-secondary/20 rounded-lg border border-border/50 p-6">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Expected CSV Format</h3>
            <code className="text-xs bg-background px-2 py-1 rounded block">
              market_id,title,category,side,price,quantity,fee,executed_at,tx_id
            </code>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            <Button 
              disabled={!file || isLoading} 
              onClick={handleUpload}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? "Uploading..." : "Upload CSV"}
            </Button>

            {message && (
              <div className={`text-sm p-3 rounded-md ${
                message.includes("✓") 
                  ? "bg-green-500/10 text-green-500" 
                  : "bg-red-500/10 text-red-500"
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
