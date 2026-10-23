import { getAuthenticatedUser, signInPath } from "../supabase-auth";
import Inbox from "./inbox";

export default async function Messages() {
  const user = await getAuthenticatedUser();
  if (!user) return <main className="auth-shell"><section className="auth-card"><a className="auth-brand" href="/market.html">Գ <span>Գործակ</span></a><div className="auth-badge">ԱՇԽԱՏԱՆՔԱՅԻՆ ՆԱՄԱԿԱԳՐՈՒԹՅՈՒՆ</div><h1>Մուտք գործիր հաղորդագրությունները տեսնելու համար</h1><p>Խոսակցությունները կապված են աշխատանքի և դիմումի հետ, ու հասանելի են միայն գործատուին ու դիմած ֆրիլանսերին։</p><a className="auth-primary" href={signInPath("/messages")}>Մուտք գործել →</a><small className="auth-note">Պայմանավորվածությունները պահիր հարթակի ներսում, որպեսզի աշխատանքի ընթացքը գրանցված լինի։</small><a className="auth-back" href="/market.html">← Վերադառնալ</a></section></main>;
  return <Inbox />;
}
