import { identity, json } from "../../../_shared";
import { conversationForParticipant, messagesForConversation, sendMessage } from "../../../../../lib/market-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await identity();
  if (!user) return json({ error: "Մուտք գործիր։" }, 401);
  const { id } = await params;
  if (!await conversationForParticipant(id, user.userId)) return json({ error: "Այս խոսակցությունը հասանելի չէ։" }, 404);
  return json({ messages: await messagesForConversation(id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await identity();
  if (!user) return json({ error: "Մուտք գործիր։" }, 401);
  const { id } = await params;
  if (!await conversationForParticipant(id, user.userId)) return json({ error: "Այս խոսակցությունը հասանելի չէ։" }, 404);
  const body = await request.json().catch(() => null) as null | { body?: string };
  const text = String(body?.body || "").trim();
  if (!text || text.length > 5000) return json({ error: "Հաղորդագրությունը պետք է լինի 1–5000 նիշ։" }, 400);
  await sendMessage({ id: crypto.randomUUID(), conversation_id: id, sender_id: user.userId, body: text, created_at: new Date().toISOString() });
  return json({ ok: true });
}
