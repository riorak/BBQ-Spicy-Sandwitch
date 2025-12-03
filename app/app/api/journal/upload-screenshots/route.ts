import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const tradeId = formData.get("trade_id") as string;

    if (!tradeId || files.length === 0) {
      return NextResponse.json({ error: "Missing files or trade_id" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${tradeId}/${Date.now()}.${fileExt}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("trade-screenshots")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      // Get signed URL (valid for 1 year)
      const { data: signedData, error: signError } = await supabase.storage
        .from("trade-screenshots")
        .createSignedUrl(fileName, 31536000); // 365 days

      if (signError || !signedData) {
        console.error("Signed URL error:", signError);
        continue;
      }

      urls.push(signedData.signedUrl);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Screenshot upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
