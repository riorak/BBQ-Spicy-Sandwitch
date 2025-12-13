import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// Simple CSV parser for server-side usage
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
  return { headers, rows };
}

function toNumber(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mapCategoryFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("bitcoin") || t.includes("eth") || t.includes("crypto")) return "crypto";
  if (
    t.includes("election") ||
    t.includes("president") ||
    t.includes("senate") ||
    t.includes("trump")
  )
    return "politics";
  if (t.includes("nfl") || t.includes("nba") || t.includes("sports")) return "sports";
  if (t.includes("space") || t.includes("ai") || t.includes("science")) return "science";
  return "science"; // default
}

export async function POST(req: NextRequest) {
  // Expect multipart/form-data with file and wallet; user must be authenticated
  const formData = await req.formData();
  const file = formData.get("file");
  const wallet = (formData.get("wallet") || "").toString();
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id || "";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!wallet || !userId) {
    return NextResponse.json({ error: "Missing wallet or user_id" }, { status: 400 });
  }

  const text = await file.text();
  const { headers, rows } = parseCSV(text);

  // Minimal header check
  const required = [
    "fill_id",
    "market_id",
    "market_title",
    "side",
    "price",
    "quantity",
    "fee",
    "timestamp",
    "tx_hash",
  ];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length) {
    return NextResponse.json({ error: "Missing columns", missing }, { status: 400 });
  }

  // use server-side supabase client with user session cookies

  const successes: number = 0;
  const errors: Array<{ row: number; message: string }> = [];
  const upserts: any[] = [];
  const tradeUpserts: any[] = [];

  rows.forEach((r, idx) => {
    const id = r["fill_id"];
    const market_id = r["market_id"];
    const market_title = r["market_title"];
    const side = r["side"].toLowerCase();
    const price = toNumber(r["price"]);
    const quantity = toNumber(r["quantity"]);
    const fee = toNumber(r["fee"]) ?? 0;
    const timestamp = r["timestamp"];
    const tx_hash = r["tx_hash"];

    if (
      !id ||
      !market_id ||
      !market_title ||
      !(side === "buy" || side === "sell") ||
      price == null ||
      quantity == null ||
      !timestamp
    ) {
      errors.push({ row: idx + 2, message: "Invalid or missing fields" });
      return;
    }

    const date = new Date(timestamp).toISOString().slice(0, 10);

    upserts.push({
      id,
      user_id: userId,
      wallet,
      market_id,
      market_title,
      side,
      price,
      quantity,
      fee,
      timestamp,
      tx_hash,
      raw_json: r,
    });

    tradeUpserts.push({
      user_id: userId,
      date,
      market_id,
      market_title,
      category: mapCategoryFromTitle(market_title),
      entry: side === "buy" ? price : undefined,
      exit: side === "sell" ? price : undefined,
      pnl: 0, // computed when market resolves in Phase 2
      outcome: "open",
      volume: Math.abs((price ?? 0) * (quantity ?? 0)),
      source_fill_id: id,
    });
  });

  if (upserts.length === 0) {
    return NextResponse.json({ error: "No valid rows" }, { status: 400 });
  }

  // Upsert fills
  const { error: fillsError } = await supabase
    .from("polymarket_fills")
    .upsert(upserts, { onConflict: "id" });
  if (fillsError) {
    return NextResponse.json({ error: fillsError.message }, { status: 500 });
  }

  // Upsert normalized trades
  const { error: tradesError } = await supabase
    .from("journal_trades")
    .upsert(tradeUpserts, { onConflict: "source_fill_id" });
  if (tradesError) {
    return NextResponse.json({ error: tradesError.message }, { status: 500 });
  }

  return NextResponse.json({ imported: upserts.length, errors });
}
