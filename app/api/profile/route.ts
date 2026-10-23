import { getAuthenticatedUser } from "../../supabase-auth";
import { json } from "../_shared";
import { saveProfile } from "../../../lib/market-store";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return json({ error: "Մուտք գործիր՝ պրոֆիլը լրացնելու համար։" }, 401);
  const input = await request.json().catch(() => null) as null | { role?: string; name?: string; bio?: string; resumeUrl?: string };
  const role = input?.role;
  const name = (input?.name || user.displayName).trim().slice(0, 100);
  if (role !== "employer" && role !== "freelancer") return json({ error: "Ընտրիր հաշվի տեսակը։" }, 400);
  if (name.length < 2) return json({ error: "Անունը պարտադիր է։" }, 400);
  await saveProfile({ user_id: user.userId, display_name: name, email: user.email, role, bio: (input?.bio || "").slice(0, 1500), resume_url: (input?.resumeUrl || "").slice(0, 500) || null });
  return json({ ok: true, role });
}
