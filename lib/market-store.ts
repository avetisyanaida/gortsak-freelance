import { hasSupabaseConfig, supabaseInsert, supabasePatch, supabaseRows } from "./supabase";

export type ProfileRow = { user_id: string; display_name: string; email: string; role: string; bio: string; resume_url: string | null };
export type JobRow = { id: string; employer_id: string; title: string; description: string; category: string; budget: number; duration_days: number; tags: string[] | string; status: string; created_at: string; is_seed?: boolean };
export type AppRow = { id: string; job_id: string; freelancer_id: string; proposal: string; bid: number; status: string; created_at: string };
export type ConversationRow = { id: string; job_id: string; employer_id: string; freelancer_id: string; application_id: string; created_at: string };
export type MessageRow = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

export function isSupabaseEnabled() { return hasSupabaseConfig(); }

const inFilter = (values: string[]) => `in.(${values.map((id) => `"${id.replaceAll('"', '')}"`).join(",")})`;

export async function profileById(userId: string): Promise<ProfileRow | null> {
  return (await supabaseRows<ProfileRow>("profiles", { select: "user_id,display_name,email,role,bio,resume_url", user_id: `eq.${userId}`, limit: "1" }))[0] || null;
}

export async function saveProfile(row: ProfileRow) {
  return supabaseInsert("profiles", row, { onConflict: "user_id", resolution: "merge-duplicates" });
}

export async function listJobs() {
  if (!hasSupabaseConfig()) return [];
  const jobs = await supabaseRows<JobRow>("jobs", { select: "id,employer_id,title,description,category,budget,duration_days,tags,status,created_at,is_seed", status: "eq.open", order: "created_at.desc", limit: "100" });
  if (!jobs.length) return [];
  const ids = [...new Set(jobs.map((job) => job.employer_id))];
  const [profiles, applications] = await Promise.all([
    supabaseRows<ProfileRow>("profiles", { select: "user_id,display_name,email,role,bio,resume_url", user_id: inFilter(ids) }),
    supabaseRows<{ job_id: string }>("applications", { select: "job_id", job_id: inFilter(jobs.map((job) => job.id)) }),
  ]);
  const people = new Map(profiles.map((p) => [p.user_id, p.display_name]));
  const counts = new Map<string, number>();
  applications.forEach((a) => counts.set(a.job_id, (counts.get(a.job_id) || 0) + 1));
  return jobs.map((job) => ({ id: job.id, title: job.title, desc: job.description, category: job.category, price: job.budget,
    days: job.duration_days, tags: Array.isArray(job.tags) ? job.tags : [], status: job.status, org: people.get(job.employer_id) || "Գործատու",
    applies: counts.get(job.id) || 0, posted: 0, sample: Boolean(job.is_seed) }));
}

export async function createJob(row: { id: string; employer_id: string; title: string; description: string; category: string; budget: number; duration_days: number; tags: string[] }) {
  return supabaseInsert("jobs", row);
}

export async function openJob(id: string): Promise<JobRow | null> {
  return (await supabaseRows<JobRow>("jobs", { select: "id,employer_id,title,description,category,budget,duration_days,tags,status,created_at,is_seed", id: `eq.${id}`, status: "eq.open", limit: "1" }))[0] || null;
}

export async function createApplication(row: { id: string; job_id: string; freelancer_id: string; proposal: string; bid: number }) {
  const existing = await supabaseRows<AppRow>("applications", { select: "id", job_id: `eq.${row.job_id}`, freelancer_id: `eq.${row.freelancer_id}`, limit: "1" });
  if (existing.length) throw new Error("duplicate_application");
  await supabaseInsert("applications", row);
  const [job] = await supabaseRows<JobRow>("jobs", { select: "id,employer_id", id: `eq.${row.job_id}`, limit: "1" });
  if (!job) throw new Error("job_missing_after_application");
  const conversationId = crypto.randomUUID();
  await supabaseInsert("conversations", { id: conversationId, job_id: row.job_id, employer_id: job.employer_id, freelancer_id: row.freelancer_id, application_id: row.id });
  return conversationId;
}

export async function applicationsForJob(jobId: string, employerId: string) {
  const [job] = await supabaseRows<JobRow>("jobs", { select: "id", id: `eq.${jobId}`, employer_id: `eq.${employerId}`, limit: "1" });
  if (!job) return null;
  const apps = await supabaseRows<AppRow>("applications", { select: "id,freelancer_id,proposal,bid,status,created_at", job_id: `eq.${jobId}`, order: "created_at.desc" });
  if (!apps.length) return [];
  const userIds = [...new Set(apps.map((a) => a.freelancer_id))];
  const people = await supabaseRows<ProfileRow>("profiles", { select: "user_id,display_name,bio,resume_url", user_id: inFilter(userIds) });
  const profiles = new Map(people.map((p) => [p.user_id, p]));
  return apps.map((a) => ({ id: a.id, proposal: a.proposal, bid: a.bid, status: a.status, created_at: a.created_at,
    display_name: profiles.get(a.freelancer_id)?.display_name, bio: profiles.get(a.freelancer_id)?.bio, resume_url: profiles.get(a.freelancer_id)?.resume_url }));
}

export async function acceptApplication(applicationId: string, employerId: string) {
  const [app] = await supabaseRows<AppRow>("applications", { select: "id,job_id,freelancer_id", id: `eq.${applicationId}`, limit: "1" });
  if (!app) return null;
  const [job] = await supabaseRows<JobRow>("jobs", { select: "id,employer_id", id: `eq.${app.job_id}`, employer_id: `eq.${employerId}`, limit: "1" });
  if (!job) return null;
  await supabasePatch("applications", { id: `eq.${applicationId}` }, { status: "selected" });
  const current = await supabaseRows<ConversationRow>("conversations", { select: "id", application_id: `eq.${applicationId}`, limit: "1" });
  if (current[0]) return current[0].id;
  const id = crypto.randomUUID();
  await supabaseInsert("conversations", { id, job_id: app.job_id, employer_id: employerId, freelancer_id: app.freelancer_id, application_id: applicationId }, { onConflict: "application_id", resolution: "ignore-duplicates" });
  const after = await supabaseRows<ConversationRow>("conversations", { select: "id", application_id: `eq.${applicationId}`, limit: "1" });
  return after[0]?.id || id;
}

export async function conversationsForUser(userId: string) {
  const rows = await supabaseRows<ConversationRow>("conversations", { select: "id,job_id,employer_id,freelancer_id,application_id,created_at", or: `(employer_id.eq.${userId},freelancer_id.eq.${userId})`, order: "created_at.desc" });
  if (!rows.length) return [];
  const [jobs, apps, people, messages] = await Promise.all([
    supabaseRows<JobRow>("jobs", { select: "id,title", id: inFilter([...new Set(rows.map((r) => r.job_id))]) }),
    supabaseRows<AppRow>("applications", { select: "id,proposal,bid", id: inFilter([...new Set(rows.map((r) => r.application_id))]) }),
    supabaseRows<ProfileRow>("profiles", { select: "user_id,display_name", user_id: inFilter([...new Set(rows.flatMap((r) => [r.employer_id, r.freelancer_id]))]) }),
    supabaseRows<MessageRow>("messages", { select: "conversation_id,body,created_at", conversation_id: inFilter(rows.map((r) => r.id)), order: "created_at.desc" }),
  ]);
  const jobMap = new Map(jobs.map((x) => [x.id, x])); const appMap = new Map(apps.map((x) => [x.id, x])); const personMap = new Map(people.map((x) => [x.user_id, x.display_name]));
  const lastMap = new Map<string, string>(); for (const message of messages) if (!lastMap.has(message.conversation_id)) lastMap.set(message.conversation_id, message.body);
  return rows.map((r) => ({ id: r.id, job_id: r.job_id, title: jobMap.get(r.job_id)?.title || "Աշխատանք",
    proposal: appMap.get(r.application_id)?.proposal || "", bid: appMap.get(r.application_id)?.bid || 0,
    other_name: personMap.get(r.employer_id === userId ? r.freelancer_id : r.employer_id) || "Մասնակից",
    last_message: lastMap.get(r.id) || null, created_at: r.created_at }));
}

export async function conversationForParticipant(id: string, userId: string): Promise<ConversationRow | null> {
  return (await supabaseRows<ConversationRow>("conversations", { select: "id,job_id,employer_id,freelancer_id,application_id,created_at", id: `eq.${id}`, or: `(employer_id.eq.${userId},freelancer_id.eq.${userId})`, limit: "1" }))[0] || null;
}

export async function messagesForConversation(id: string) {
  const messages = await supabaseRows<MessageRow>("messages", { select: "id,sender_id,body,created_at", conversation_id: `eq.${id}`, order: "created_at.asc", limit: "300" });
  if (!messages.length) return [];
  const senderIds = [...new Set(messages.map((m) => m.sender_id))];
  const people = await supabaseRows<ProfileRow>("profiles", { select: "user_id,display_name", user_id: inFilter(senderIds) });
  const names = new Map(people.map((p) => [p.user_id, p.display_name]));
  return messages.map((m) => ({ ...m, sender_name: names.get(m.sender_id) || "Մասնակից" }));
}

export async function sendMessage(row: MessageRow) { return supabaseInsert("messages", row); }
