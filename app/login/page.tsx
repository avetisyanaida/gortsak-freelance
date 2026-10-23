import Link from "next/link";
import { getAuthenticatedUser } from "../supabase-auth";
import { safeReturnPath } from "../../lib/return-path";
import LoginForm from "./login-form";

export default async function Login({ searchParams }: { searchParams: Promise<{ return_to?: string; role?: string }> }) {
  const query = await searchParams;
  const returnTo = safeReturnPath(query.return_to || "/market.html");
  const role = query.role === "employer" ? "employer" : "freelancer";
  const user = await getAuthenticatedUser();
  return <main className="auth-shell"><section className="auth-card">
    <a className="auth-brand" href="/market.html">Գ <span>Գործակ</span></a>
    <div className="auth-badge">ԱՊԱՀՈՎ ՄՈՒՏՔ</div>
    <h1>{user ? "Բարի վերադարձ" : "Մուտք գործիր Գործակ"}</h1>
    <p>Շարունակիր նախագծի էջը, առաջարկները և հարթակի ներսի հաղորդագրությունները մեկ տեղում։</p>
    {user ? <><div className="auth-user"><strong>{user.displayName}</strong><small>{user.email}</small></div><a className="auth-primary" href={`/register?role=${role}&return_to=${encodeURIComponent(returnTo)}`}>Շարունակել պրոֆիլի կարգավորմամբ →</a></> : <>
      <div className="auth-role-pick"><a className={role === "freelancer" ? "selected" : ""} href={`/login?role=freelancer&return_to=${encodeURIComponent(returnTo)}`}>Ֆրիլանսեր</a><a className={role === "employer" ? "selected" : ""} href={`/login?role=employer&return_to=${encodeURIComponent(returnTo)}`}>Գործատու</a></div>
      <LoginForm role={role} returnTo={returnTo} />
    </>}
    <small className="auth-note">Մուտքն ու գաղտնաբառի ստուգումն ապահովում է Supabase Auth-ը։</small>
    <Link className="auth-back" href="/market.html">← Վերադառնալ աշխատանքներին</Link>
  </section></main>;
}
