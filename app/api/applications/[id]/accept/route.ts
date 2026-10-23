import { identity, json } from "../../../_shared";
import { acceptApplication } from "../../../../../lib/market-store";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await identity();
  if (!user) return json({ error: "Մուտք գործիր։" }, 401);
  if (profile?.role !== "employer") return json({ error: "Միայն գործատուն կարող է ընտրել մասնագետի։" }, 403);
  const { id } = await params;
  const conversationId = await acceptApplication(id, user.userId);
  if (!conversationId) return json({ error: "Դիմումը չի գտնվել։" }, 404);
  return json({ ok: true, conversationId });
}
