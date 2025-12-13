import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// Resolution updater: marks trades as resolved when fills have resolution_price
export async function POST() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch fills for user that have resolution_price set
  const { data: resolvedFills, error: fillsError } = await supabase
    .from("polymarket_fills")
    .select("id, market_id, market_title, side, price, quantity, resolution_price, timestamp")
    .eq("user_id", userId)
    .not("resolution_price", "is", null);
  if (fillsError) return NextResponse.json({ error: fillsError.message }, { status: 500 });

  const updates = [] as any[];
  for (const f of resolvedFills ?? []) {
    const date = new Date(f.timestamp as string).toISOString().slice(0, 10);
    const entry = f.side === "buy" ? Number(f.price) : undefined;
    const exit = f.side === "sell" ? Number(f.price) : undefined;
    const res = Number(f.resolution_price);
    // Simple PnL calc: if bought, profit = (res - entry) * qty; if sold, profit = (entry - res) * qty
    let pnl = 0;
    if (entry !== undefined) pnl = (res - entry) * Number(f.quantity);
    if (exit !== undefined) pnl = (exit - res) * Number(f.quantity);
    const outcome = pnl >= 0 ? "win" : "loss";

    updates.push({
      user_id: userId,
      date,
      market_id: f.market_id,
      market_title: f.market_title,
      pnl,
      outcome,
      source_fill_id: f.id,
    });
  }

  if (updates.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  // Upsert outcome + pnl on journal_trades (keeping other fields as-is)
  const { error: tradesError } = await supabase
    .from("journal_trades")
    .upsert(updates, { onConflict: "source_fill_id" });
  if (tradesError) return NextResponse.json({ error: tradesError.message }, { status: 500 });

  return NextResponse.json({ updated: updates.length });
}
