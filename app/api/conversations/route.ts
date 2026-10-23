import { identity, json } from "../_shared";
import { conversationsForUser } from "../../../lib/market-store";

export async function GET() {
  const { user } = await identity();
  if (!user) return json({ error: "Մուտք գործիր։" }, 401);
  return json({ conversations: await conversationsForUser(user.userId) });
}
