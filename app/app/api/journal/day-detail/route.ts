import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  // Fetch stats
  const { data: stats } = await supabase
    .from("day_stats")
    .select("date,pnl,volume,categories")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  // Fetch trades for day
  const { data: trades } = await supabase
    .from("trades")
    .select("id, market_id, side, price, quantity, executed_at, fee, markets(title), tx_id")
    .eq("user_id", userId)
    .gte("executed_at", new Date(date + "T00:00:00Z").toISOString())
    .lte("executed_at", new Date(date + "T23:59:59Z").toISOString())
    .order("executed_at", { ascending: true });

  // Group by category (from markets)
  const grouped: Record<string, any[]> = {};
  for (const t of trades || []) {
    const category = (t as any).markets?.category_id ? "unknown" : "unknown"; // placeholder; could join categories
    const key = category;
    if (!grouped[key]) grouped[key] = [];
    // compute naive realized pnl per fill sign
    const fillPnl = (t.side === "sell" ? 1 : -1) * (Number(t.price) * Number(t.quantity)) - Number(t.fee || 0);
    grouped[key].push({
      id: t.id,
      market: (t as any).markets?.title ?? t.market_id,
      category,
      entry: t.side === "buy" ? Number(t.price) : undefined,
      exit: t.side === "sell" ? Number(t.price) : undefined,
      outcome: fillPnl >= 0 ? "win" : "loss",
      pnl: fillPnl,
    });
  }

  return NextResponse.json({
    date,
    pnl: stats?.pnl ?? 0,
    volume: stats?.volume ?? 0,
    categories: stats?.categories ?? [],
    trades: grouped,
  });
}
