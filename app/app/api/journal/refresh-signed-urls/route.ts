import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { paths } = await request.json();
    
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ urls: [] });
    }

    const signedUrls = await Promise.all(
      paths.map(async (path: string) => {
        // Extract path from existing URL or use as-is
        const fileName = path.includes("/trade-screenshots/") 
          ? path.split("/trade-screenshots/")[1].split("?")[0]
          : path;

        const { data, error } = await supabase.storage
          .from("trade-screenshots")
          .createSignedUrl(fileName, 31536000); // 365 days

        return error ? null : data.signedUrl;
      })
    );

    return NextResponse.json({ urls: signedUrls.filter(Boolean) });
  } catch (error) {
    console.error("Refresh signed URLs error:", error);
    return NextResponse.json({ error: "Failed to refresh URLs" }, { status: 500 });
  }
}
