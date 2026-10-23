import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnPath } from "../lib/return-path";

export type AuthUser = { userId: string; displayName: string; email: string; fullName: string | null };

export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server components cannot write cookies; middleware/API routes refresh them. */ }
      },
    },
  });
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const fullName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null;
  return { userId: user.id, displayName: fullName || user.email, email: user.email, fullName };
}

export async function requireAuthenticatedUser(returnTo: string): Promise<AuthUser> {
  const user = await getAuthenticatedUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `/login?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`;
}
