import { identity, json } from "../_shared";
import { createJob, isSupabaseEnabled, listJobs } from "../../../lib/market-store";

export async function GET() {
  return json({ jobs: await listJobs(), supabase: isSupabaseEnabled() });
}

export async function POST(request: Request) {
  const { user, profile } = await identity();
  if (!user) return json({ error: "Մուտք գործիր որպես գործատու՝ աշխատանք տեղադրելու համար։" }, 401);
  if (profile?.role !== "employer") return json({ error: "Այս գործողությունը հասանելի է միայն գործատուին։" }, 403);
  const body = await request.json().catch(() => null) as null | { title?: string; desc?: string; category?: string; price?: number; days?: number; tags?: string[] };
  const title = (body?.title || "").trim(); const desc = (body?.desc || "").trim();
  const price = Math.floor(Number(body?.price)); const days = Math.floor(Number(body?.days));
  if (title.length < 5 || desc.length < 15 || !Number.isFinite(price) || price < 1000 || !Number.isFinite(days) || days < 1)
    return json({ error: "Լրացրու վերնագիրը, նկարագրությունը, բյուջեն ու ժամկետը։" }, 400);
  const id = crypto.randomUUID();
  const tags = Array.isArray(body?.tags) ? body.tags.slice(0, 10).map((x) => String(x).slice(0, 40)) : [];
  await createJob({ id, employer_id: user.userId, title: title.slice(0, 150), description: desc.slice(0, 4000), category: String(body?.category || "Այլ").slice(0, 80), budget: price, duration_days: days, tags });
  return json({ ok: true, id });
}
