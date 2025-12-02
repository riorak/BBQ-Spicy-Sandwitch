import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // This route is hit after OAuth callback from Supabase
  // Supabase sets the session cookie, so you can redirect to home or dashboard
  return NextResponse.redirect(new URL("/", request.url));
}
