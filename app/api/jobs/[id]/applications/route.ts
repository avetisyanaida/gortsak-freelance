import { identity, json } from "../../../_shared";
import { applicationsForJob } from "../../../../../lib/market-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await identity();
  if (!user) return json({ error: "Մուտք գործիր։" }, 401);
  if (profile?.role !== "employer") return json({ error: "Միայն գործատուն կարող է դիտել դիմումները։" }, 403);
  const { id } = await params;
  const result = await applicationsForJob(id, user.userId);
  if (!result) return json({ error: "Աշխատանքը չի գտնվել։" }, 404);
  return json({ applications: result });
}
