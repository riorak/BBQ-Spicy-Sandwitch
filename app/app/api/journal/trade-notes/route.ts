import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const tradeId = url.searchParams.get("trade_id");
  if (!tradeId) return NextResponse.json({ error: "Missing trade_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("trade_notes")
    .select("notes,screenshots,ai_analysis")
    .eq("user_id", userId)
    .eq("trade_id", tradeId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { notes: "", screenshots: [], ai_analysis: null });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { trade_id, notes, screenshots } = body;

  if (!trade_id) return NextResponse.json({ error: "Missing trade_id" }, { status: 400 });

  const { error } = await supabase
    .from("trade_notes")
    .upsert(
      {
        user_id: userId,
        trade_id,
        notes: notes || "",
        screenshots: screenshots || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,trade_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
