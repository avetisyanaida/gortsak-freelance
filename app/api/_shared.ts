import { getAuthenticatedUser } from "../supabase-auth";
import { profileById } from "../../lib/market-store";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function identity() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, profile: null };
  const profile = await profileById(user.userId);
  return { user, profile };
}

export function unavailable() {
  return json({ error: "Supabase-ը դեռ կարգավորված չէ։ Ստուգիր միջավայրի փոփոխականները։" }, 503);
}
