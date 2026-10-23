import Link from "next/link";
import { getAuthenticatedUser } from "../supabase-auth";
import RegisterForm from "./register-form";
import SignupForm from "./signup-form";
import { safeReturnPath } from "../../lib/return-path";

export default async function Register({ searchParams }: { searchParams: Promise<{ role?: string; jobId?: string; return_to?: string }> }) {
  const q = await searchParams;
  const role = q.role === "employer" ? "employer" : "freelancer";
  const returnTo = safeReturnPath(q.return_to || "/market.html");
  const user = await getAuthenticatedUser();
  return <main className="auth-shell"><section className="auth-card auth-card-wide">
    <a className="auth-brand" href="/market.html">Գ <span>Գործակ</span></a>
    <div className="auth-badge">ՄԻԱՑԻՐ ՀԱՅԿԱԿԱՆ ՇՈՒԿԱՅԻՆ</div>
    <h1>{user ? "Կարգավորիր քո հաշիվը" : "Ստեղծիր Գործակ հաշիվ"}</h1>
    <p>{role === "freelancer" ? "Ներկայացրու հմտություններդ ու դիմիր աշխատանքներին անվճար։" : "Տեղադրիր առաջադրանքներ և ընտրիր մասնագետին։"}</p>
    {user ? <RegisterForm name={user.displayName} email={user.email} defaultRole={role} returnTo={returnTo} jobId={q.jobId || ""} /> : <SignupForm role={role} returnTo={returnTo} jobId={q.jobId || ""} />}
    <Link className="auth-back" href="/market.html">← Վերադառնալ աշխատանքներին</Link>
  </section></main>;
}
