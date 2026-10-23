"use client";

import { useState } from "react";

export default function RegisterForm({ name, email, defaultRole, returnTo, jobId }: { name: string; email: string; defaultRole: string; returnTo: string; jobId: string }) {
  const [role, setRole] = useState(defaultRole);
  const [displayName, setDisplayName] = useState(name);
  const [bio, setBio] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const res = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role, name: displayName, bio, resumeUrl }) });
    const result = await res.json().catch(() => ({})) as { error?: string }; setBusy(false);
    if (!res.ok) { setError(result.error || "Չհաջողվեց պահպանել պրոֆիլը։"); return; }
    location.href = jobId && role === "freelancer" ? `/market.html?apply=${encodeURIComponent(jobId)}` : returnTo;
  }
  return <form className="auth-form" onSubmit={submit}><label>Հաշվի տեսակ<select value={role} onChange={(e) => setRole(e.target.value)}><option value="freelancer">Ֆրիլանսեր</option><option value="employer">Գործատու</option></select></label><label>Անուն և ազգանուն<input required minLength={2} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label><label>Էլ․ փոստ<input readOnly value={email} /></label>{role === "freelancer" && <><label>Կարճ ներկայացում<textarea value={bio} maxLength={1500} onChange={(e) => setBio(e.target.value)} placeholder="Քո փորձը, մասնագիտությունը և ուժեղ կողմերը" /></label><label>Ռեզյումեի կամ պորտֆոլիոյի հղում <span>(ըստ ցանկության)</span><input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..." /></label></>}{error && <div className="auth-error">{error}</div>}<button disabled={busy} className="auth-primary">{busy ? "Պահպանվում է…" : "Պահպանել և շարունակել →"}</button><small className="auth-note">Դիմումները անվճար են։ Ամբողջ հաղորդակցությունը շարունակվում է Գործակ-ի ներսում։</small></form>;
}
