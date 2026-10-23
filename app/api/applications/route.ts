import { identity, json } from "../_shared";
import { createApplication, openJob } from "../../../lib/market-store";

export async function POST(request: Request) {
  const { user, profile } = await identity();
  if (!user) return json({ error: "Մուտք գործիր որպես ֆրիլանսեր՝ դիմելու համար։" }, 401);
  if (profile?.role !== "freelancer") return json({ error: "Դիմելու համար անհրաժեշտ է ֆրիլանսերի հաշիվ։" }, 403);
  const body = await request.json().catch(() => null) as null | { jobId?: string; proposal?: string; bid?: number };
  const jobId = String(body?.jobId || ""); const proposal = String(body?.proposal || "").trim(); const bid = Math.floor(Number(body?.bid));
  if (!jobId || proposal.length < 8 || !Number.isFinite(bid) || bid < 1) return json({ error: "Լրացրու առաջարկն ու գինը։" }, 400);
  const job = await openJob(jobId);
  if (!job) return json({ error: "Աշխատանքը հասանելի չէ։" }, 404);
  if (job.is_seed) return json({ error: "Սա մեկնարկային օրինակ է։ Դիմելու համար ընտրիր գործատուի հրապարակած աշխատանք։" }, 400);
  const id = crypto.randomUUID();
  let conversationId: string;
  try { conversationId = await createApplication({ id, job_id: jobId, freelancer_id: user.userId, proposal: proposal.slice(0, 3000), bid }); }
  catch (error) { if (error instanceof Error && error.message === "duplicate_application") return json({ error: "Դու արդեն դիմել ես այս աշխատանքին։" }, 409); throw error; }
  return json({ ok: true, id, conversationId });
}
