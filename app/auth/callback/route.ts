import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "../../supabase-auth";
import { safeReturnPath } from "../../../lib/return-path";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safeNext = safeReturnPath(url.searchParams.get("next") || "/market.html");
  const supabase = await getSupabaseServerClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/login?auth_error=callback", url.origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?auth_error=callback", url.origin));
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
