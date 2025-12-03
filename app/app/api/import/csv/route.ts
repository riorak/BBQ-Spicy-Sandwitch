import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Expected CSV headers: market_id,title,category,side,price,quantity,fee,executed_at,tx_id
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);

  // Upsert markets and insert trades
  for (const row of rows) {
    const categorySlug = row.category?.toLowerCase();
    // fetch category id
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    // upsert market
    await supabase
      .from("markets")
      .upsert({
        id: row.market_id,
        title: row.title,
        category_id: cat?.id ?? null,
      });

    // insert trade
    await supabase.from("trades").insert({
      user_id: userId,
      market_id: row.market_id,
      side: row.side,
      price: Number(row.price),
      quantity: Number(row.quantity),
      fee: Number(row.fee || 0),
      executed_at: new Date(row.executed_at).toISOString(),
      tx_id: row.tx_id,
    });
  }

  // Recompute day_stats (simple approach: aggregate by date)
  const { error } = await supabase.rpc("recompute_day_stats", { p_user_id: userId });
  if (error) {
    // Fallback: best-effort compute in JS
    await recomputeDayStatsFallback(supabase, userId);
  }

  return NextResponse.json({ ok: true, inserted: rows.length });
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row as {
      market_id: string;
      title: string;
      category: string;
      side: string;
      price: string;
      quantity: string;
      fee?: string;
      executed_at: string;
      tx_id: string;
    };
  });
}

async function recomputeDayStatsFallback(supabase: any, userId: string) {
  // Fetch trades for user
  const { data: trades } = await supabase
    .from("trades")
    .select("*, markets(title, category_id)")
    .eq("user_id", userId);
  if (!trades) return;

  // Group by date (UTC)
  const byDate: Record<string, any[]> = {};
  for (const t of trades) {
    const d = new Date(t.executed_at);
    const dateKey = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toISOString()
      .slice(0, 10);
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(t);
  }

  for (const [date, ts] of Object.entries(byDate)) {
    const volume = ts.reduce((acc, t) => acc + Math.abs(Number(t.quantity) * Number(t.price)), 0);
    // naive pnl: buys negative, sells positive
    const pnl = ts.reduce((acc, t) => acc + (t.side === "sell" ? 1 : -1) * (Number(t.price) * Number(t.quantity)) - Number(t.fee || 0), 0);
    const categorySet = new Set<string>();
    for (const t of ts) {
      if (t.markets?.category_id) {
        // fetch slug by id if needed
      }
    }
    await supabase
      .from("day_stats")
      .upsert({ user_id: userId, date, pnl, volume, categories: Array.from(categorySet) });
  }
}
