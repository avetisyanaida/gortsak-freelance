"use client";

import {useState} from "react";
import Link from "next/link";
import {createSupabaseBrowserClient} from "../../lib/supabase-browser";

export default function SignupForm({role, returnTo, jobId}: { role: string; returnTo: string; jobId: string }) {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [accountRole, setAccountRole] = useState(role);
    const [confirmationPending, setConfirmationPending] = useState(false);
    const [resendStatus, setResendStatus] = useState("");

    function confirmationRedirectUrl() {
        const destination = `/register?role=${encodeURIComponent(accountRole)}&return_to=${encodeURIComponent(returnTo)}${jobId ? `&jobId=${encodeURIComponent(jobId)}` : ""}`;
        return `${location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;
    }

    async function resendConfirmation() {
        setBusy(true);
        setError("");
        setResendStatus("");
        try {
            const supabase = createSupabaseBrowserClient();
            const {error: resendError} = await supabase.auth.resend({
                type: "signup",
                email,
                options: {emailRedirectTo: confirmationRedirectUrl()},
            });
            if (resendError) throw resendError;
            setResendStatus("Կրկնակի ուղարկման հարցումն ընդունվեց։ Ստուգիր նաև Spam/Junk թղթապանակը։");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Չհաջողվեց կրկին ուղարկել հաստատման նամակը։");
        } finally {
            setBusy(false);
        }
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const supabase = createSupabaseBrowserClient();
            const {data, error: signupError} = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {display_name: displayName, role: accountRole},
                    emailRedirectTo: confirmationRedirectUrl(),
                },
            });
            if (signupError) throw signupError;
            if (!data.session) {
                setConfirmationPending(true);
                return;
            }
            const response = await fetch("/api/profile", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({role: accountRole, name: displayName}),
            });
            const result = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(result.error || "Չհաջողվեց ստեղծել պրոֆիլը։");
            location.href = jobId && accountRole === "freelancer" ? `/market.html?apply=${encodeURIComponent(jobId)}` : returnTo;
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "Գրանցումը չհաջողվեց։ Ստուգիր տվյալներն ու Supabase-ի կարգավորումները։";
            setError(message.toLowerCase().includes("not authorized") || message.toLowerCase().includes("հասցեն թույլատրված չէ")
                ? "Supabase-ի լռելյայն փոստային ծառայությունը նամակ է ուղարկում միայն նախագծի թիմի հասցեներին։ Բոլոր օգտատերերին նամակ ուղարկելու համար միացրու custom SMTP-ը Supabase-ի Authentication → SMTP Settings բաժնում։"
                : message);
        } finally {
            setBusy(false);
        }
    }

    if (confirmationPending) {
        return <section className="auth-success" aria-live="polite">
            <h2>Գրանցումը սպասում է էլ․ փոստի հաստատմանը</h2>
            <p>Ստուգիր այս հասցեի մուտքային նամակները՝ <strong>{email}</strong>։ Նայիր նաև Spam/Junk թղթապանակում։
                Նամակի հղումը բացելուց հետո հաշիվը կհաստատվի։</p>
            <p>Եթե նամակը չես ստացել, Supabase-ում պետք է կարգավորված լինի SMTP ուղարկումը․ միայն կայքի
                հաղորդագրությունը չի հաստատում, որ փոստային սերվերն այն հասցրել է հասցեատիրոջը։</p>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {resendStatus && <div className="auth-status" role="status">{resendStatus}</div>}
            <button type="button" className="auth-secondary" disabled={busy} onClick={resendConfirmation}>
                {busy ? "Ուղարկվում է…" : "Կրկին ուղարկել հաստատման նամակը"}
            </button>
            <Link className="auth-register-button"
                  href={`/login?role=${accountRole}&return_to=${encodeURIComponent(returnTo)}`}>Արդեն հաստատե՞լ ես․
                մուտք գործիր</Link>
        </section>;
    }

    return <form className="auth-form" onSubmit={submit}>
        <label>Հաշվի տեսակ<select value={accountRole} onChange={(e) => setAccountRole(e.target.value)}>
            <option value="freelancer">Ֆրիլանսեր</option>
            <option value="employer">Գործատու</option>
        </select></label>
        <label>Անուն և ազգանուն<input required minLength={2} value={displayName}
                                      onChange={(e) => setDisplayName(e.target.value)}/></label>
        <label>Էլ․ փոստ<input type="email" autoComplete="email" required value={email}
                              onChange={(e) => setEmail(e.target.value)}/></label>
        <label>Գաղտնաբառ<input type="password" autoComplete="new-password" minLength={8} required value={password}
                               onChange={(e) => setPassword(e.target.value)} placeholder="Առնվազն 8 նիշ"/></label>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button disabled={busy} className="auth-primary">{busy ? "Ստեղծվում է…" : "Գրանցվել և շարունակել →"}</button>
        <small className="auth-note">Գաղտնաբառը պահպանում և ստուգում է Supabase Auth-ը։ Աշխատանքի դիմելը ֆրիլանսերի
            համար անվճար է։</small>
        <Link className="auth-register-button"
              href={`/login?role=${accountRole}&return_to=${encodeURIComponent(returnTo)}`}>Արդեն հաշիվ ունե՞ս․ մուտք
            գործիր</Link>
    </form>;
}
