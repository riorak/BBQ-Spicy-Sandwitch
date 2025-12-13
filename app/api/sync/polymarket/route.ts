import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

// Placeholder sync route: reads linked wallet and accepts optional mock payload
export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Read user settings for wallet
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("polymarket_wallet")
    .eq("user_id", userId)
    .single();
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });
  const wallet = settings?.polymarket_wallet;
  if (!wallet) return NextResponse.json({ error: "No linked wallet" }, { status: 400 });

  // For Phase 1, accept mock fills via body JSON for testing
  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const fills: Array<any> = Array.isArray(payload?.fills) ? payload.fills : [];
  if (fills.length === 0) {
    return NextResponse.json({ message: "No fills provided (Phase 1 stub)." }, { status: 200 });
  }

  // Upsert provided fills into polymarket_fills and journal_trades
  const upserts = fills.map((f) => ({
    id: String(f.fill_id),
    user_id: userId,
    wallet,
    market_id: String(f.market_id),
    market_title: String(f.market_title),
    side: String(f.side).toLowerCase(),
    price: Number(f.price),
    quantity: Number(f.quantity),
    fee: Number(f.fee ?? 0),
    timestamp: f.timestamp,
    tx_hash: f.tx_hash ?? null,
    raw_json: f,
  }));

  const tradeUpserts = upserts.map((u) => ({
    user_id: userId,
    date: new Date(u.timestamp).toISOString().slice(0, 10),
    market_id: u.market_id,
    market_title: u.market_title,
    category: "science", // simple default; phase 2 mapping
    entry: u.side === "buy" ? u.price : undefined,
    exit: u.side === "sell" ? u.price : undefined,
    pnl: 0,
    outcome: "open",
    volume: Math.abs(Number(u.price) * Number(u.quantity)),
    source_fill_id: u.id,
  }));

  const { error: fillsError } = await supabase
    .from("polymarket_fills")
    .upsert(upserts, { onConflict: "id" });
  if (fillsError) return NextResponse.json({ error: fillsError.message }, { status: 500 });

  const { error: tradesError } = await supabase
    .from("journal_trades")
    .upsert(tradeUpserts, { onConflict: "source_fill_id" });
  if (tradesError) return NextResponse.json({ error: tradesError.message }, { status: 500 });

  return NextResponse.json({ synced: upserts.length });
}
