import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Expected CSV headers: market_id,title,category,side,price,quantity,fee,executed_at,tx_id
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const userEmail = claims?.claims?.email;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure user row exists in public.users
    await supabase
      .from("users")
      .upsert({ id: userId, email: userEmail }, { onConflict: "id" });

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

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
    }

    // Fetch all categories upfront
    const { data: categories } = await supabase.from("categories").select("id,slug");
    const categoryMap = new Map((categories || []).map(c => [c.slug, c.id]));

    // Check for existing tx_ids to prevent duplicates
    const txIds = rows.map(r => r.tx_id).filter(Boolean);
    const { data: existingTrades } = await supabase
      .from("trades")
      .select("tx_id")
      .in("tx_id", txIds);
    const existingTxIds = new Set((existingTrades || []).map(t => t.tx_id));

    // Prepare batch data
    const marketsToUpsert: any[] = [];
    const tradesToInsert: any[] = [];
    const seenMarkets = new Set<string>();

    for (const row of rows) {
      // Skip if trade already exists
      if (existingTxIds.has(row.tx_id)) {
        continue;
      }

      const categorySlug = row.category?.toLowerCase();
      const categoryId = categoryMap.get(categorySlug) ?? null;

      // Collect unique markets for batch upsert
      if (!seenMarkets.has(row.market_id)) {
        marketsToUpsert.push({
          id: row.market_id,
          title: row.title,
          category_id: categoryId,
        });
        seenMarkets.add(row.market_id);
      }

      // Collect trades for batch insert
      tradesToInsert.push({
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

    // Batch upsert markets (much faster)
    if (marketsToUpsert.length > 0) {
      const { error: marketError } = await supabase
        .from("markets")
        .upsert(marketsToUpsert, { onConflict: "id" });
      if (marketError) {
        console.error("Market upsert error:", marketError);
        return NextResponse.json({ error: `Failed to upsert markets: ${marketError.message}` }, { status: 500 });
      }
    }

    // Batch insert trades (much faster)
    if (tradesToInsert.length > 0) {
      const { error: tradeError } = await supabase
        .from("trades")
        .insert(tradesToInsert);
      if (tradeError) {
        console.error("Trade insert error:", tradeError);
        return NextResponse.json({ error: `Failed to insert trades: ${tradeError.message}` }, { status: 500 });
      }
    }

    // Recompute day_stats in JS (since RPC doesn't exist)
    await recomputeDayStatsFallback(supabase, userId);

    return NextResponse.json({ 
      ok: true, 
      inserted: tradesToInsert.length,
      skipped: rows.length - tradesToInsert.length,
      total: rows.length 
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(",").map((h) => h.trim());
  
  return lines.slice(1).map((line) => {
    // Simple CSV parser - handles quoted fields with commas
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    
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
  }).filter(row => row.market_id && row.tx_id); // Filter out invalid rows
}

async function recomputeDayStatsFallback(supabase: any, userId: string) {
  try {
    // Fetch trades for user with market categories
    const { data: trades } = await supabase
      .from("trades")
      .select("*, markets(title, category_id, categories(slug))")
      .eq("user_id", userId);
    if (!trades || trades.length === 0) return;

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

    // Batch upsert day stats
    const dayStatsToUpsert = [];
    for (const [date, ts] of Object.entries(byDate)) {
      const volume = ts.reduce((acc, t) => acc + Math.abs(Number(t.quantity) * Number(t.price)), 0);
      // naive pnl: buys negative, sells positive
      const pnl = ts.reduce((acc, t) => acc + (t.side === "sell" ? 1 : -1) * (Number(t.price) * Number(t.quantity)) - Number(t.fee || 0), 0);
      
      const categorySet = new Set<string>();
      for (const t of ts) {
        const categorySlug = t.markets?.categories?.slug;
        if (categorySlug) {
          categorySet.add(categorySlug);
        }
      }
      
      dayStatsToUpsert.push({
        user_id: userId,
        date,
        pnl: Math.round(pnl * 100) / 100, // Round to 2 decimals
        volume: Math.round(volume * 100) / 100,
        categories: Array.from(categorySet),
      });
    }

    if (dayStatsToUpsert.length > 0) {
      await supabase
        .from("day_stats")
        .upsert(dayStatsToUpsert, { onConflict: "user_id,date" });
    }
  } catch (error) {
    console.error("Failed to recompute day stats:", error);
  }
}
