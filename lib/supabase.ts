export class SupabaseError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function hasSupabaseConfig() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export async function supabaseRows<T>(table: string, query: Record<string, string>) {
  const rows = await supabaseRequest<T[]>(table, query);
  return rows;
}

export async function supabaseInsert<T>(table: string, rows: unknown | unknown[], options: { onConflict?: string; resolution?: "merge-duplicates" | "ignore-duplicates" } = {}) {
  const query: Record<string, string> = {};
  if (options.onConflict) query.on_conflict = options.onConflict;
  const resolution = options.resolution ? `resolution=${options.resolution},` : "";
  return supabaseRequest<T[]>(table, query, { method: "POST", body: rows, prefer: `${resolution}return=representation` });
}

export async function supabasePatch<T>(table: string, query: Record<string, string>, body: unknown) {
  return supabaseRequest<T[]>(table, query, { method: "PATCH", body, prefer: "return=representation" });
}

async function supabaseRequest<T>(table: string, query: Record<string, string>, options: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const root = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!root || !key) throw new SupabaseError("Supabase URL և server secret-ը կարգավորված չեն։", 503);
  const url = new URL(`${root}/rest/v1/${table}`);
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
  const headers: Record<string, string> = { apikey: key, "content-type": "application/json", "accept-profile": "public", "content-profile": "public" };
  if (key.startsWith("eyJ")) headers.authorization = `Bearer ${key}`;
  if (options.prefer) headers.prefer = options.prefer;
  let response: Response;
  try { response = await fetch(url, { method: options.method || "GET", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) }); }
  catch { throw new SupabaseError("Չհաջողվեց կապվել Supabase-ի հետ։ Ստուգիր URL-ը և ցանցը։", 503); }
  const raw = await response.text();
  if (!response.ok) {
    let message = "Supabase հարցումը չհաջողվեց։";
    try { const parsed = JSON.parse(raw) as { message?: string; code?: string }; message = parsed.message || message; } catch {}
    throw new SupabaseError(message, response.status);
  }
  if (!raw) return [] as T;
  try { return JSON.parse(raw) as T; }
  catch { throw new SupabaseError("Supabase-ը վերադարձրել է անհասկանալի պատասխան։", 502); }
}
