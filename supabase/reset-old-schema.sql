-- WARNING: This permanently deletes the existing marketplace tables and their data.
-- It leaves Supabase Auth users intact. Run only if replacing the old Gortsak schema.
begin;

drop table if exists public.commissions;
drop table if exists public.messages;
drop table if exists public.conversations;
drop table if exists public.applications;
drop table if exists public.jobs;
drop table if exists public.profiles;

commit;
