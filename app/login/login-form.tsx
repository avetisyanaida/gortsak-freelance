"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function LoginForm({ role, returnTo }: { role: string; returnTo: string }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { profile?: unknown };
      location.href = data.profile ? returnTo : `/register?role=${role}&return_to=${encodeURIComponent(returnTo)}`;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Մուտքը չհաջողվեց։"); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}>
    <label>Էլ․ փոստ<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label>Գաղտնաբառ<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <div className="auth-error">{error}</div>}
    <button disabled={busy} className="auth-primary">{busy ? "Մուտք է կատարվում…" : "Մուտք գործել →"}</button>
    <Link className="auth-register-button" href={`/register?role=${role}&return_to=${encodeURIComponent(returnTo)}`}>Գրանցվել</Link>
  </form>;
}
