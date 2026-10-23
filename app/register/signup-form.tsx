"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function SignupForm({ role, returnTo, jobId }: { role: string; returnTo: string; jobId: string }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountRole, setAccountRole] = useState(role);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createSupabaseBrowserClient();
      const next = `/auth/callback?next=${encodeURIComponent(`/register?role=${accountRole}&return_to=${encodeURIComponent(returnTo)}${jobId ? `&jobId=${encodeURIComponent(jobId)}` : ""}`)}`;
      const { data, error: signupError } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: displayName, role: accountRole }, emailRedirectTo: `${location.origin}${next}` },
      });
      if (signupError) throw signupError;
      if (!data.session) {
        setNotice("Հաշիվը ստեղծելու հղումն ուղարկել ենք քո էլ․ փոստին։ Հաստատելուց հետո կարող ես շարունակել գրանցումը։");
        return;
      }
      const response = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: accountRole, name: displayName }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Չհաջողվեց ստեղծել պրոֆիլը։");
      location.href = jobId && accountRole === "freelancer" ? `/market.html?apply=${encodeURIComponent(jobId)}` : returnTo;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Գրանցումը չհաջողվեց։ Ստուգիր տվյալներն ու Supabase-ի կարգավորումները։");
    } finally { setBusy(false); }
  }

  return <form className="auth-form" onSubmit={submit}>
    <label>Հաշվի տեսակ<select value={accountRole} onChange={(e) => setAccountRole(e.target.value)}><option value="freelancer">Ֆրիլանսեր</option><option value="employer">Գործատու</option></select></label>
    <label>Անուն և ազգանուն<input required minLength={2} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
    <label>Էլ․ փոստ<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>Գաղտնաբառ<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Առնվազն 8 նիշ" /></label>
    {error && <div className="auth-error">{error}</div>}{notice && <div className="notice">{notice}</div>}
    <button disabled={busy} className="auth-primary">{busy ? "Ստեղծվում է…" : "Գրանցվել և շարունակել →"}</button>
    <small className="auth-note">Գաղտնաբառը պահպանում և ստուգում է Supabase Auth-ը։ Աշխատանքի դիմելը ֆրիլանսերի համար անվճար է։</small>
    <Link className="auth-register-button" href={`/login?role=${accountRole}&return_to=${encodeURIComponent(returnTo)}`}>Արդեն հաշիվ ունե՞ս․ մուտք գործիր</Link>
  </form>;
}
