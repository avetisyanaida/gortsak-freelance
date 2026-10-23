import { identity, json } from "../_shared";

export async function GET() {
  const { user, profile } = await identity();
  return json({ signedIn: !!user, user: user ? { id: user.userId, name: user.displayName, email: user.email } : null, profile });
}
