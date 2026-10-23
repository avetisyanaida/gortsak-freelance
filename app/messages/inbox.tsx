"use client";

import { useCallback, useEffect, useState } from "react";

type Conversation = { id: string; job_id: string; title: string; other_name: string; last_message: string | null; proposal: string; bid: number };
type Message = { id: string; sender_id: string; body: string; sender_name: string };

export default function Inbox() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [active, setActive] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const [c, me] = await Promise.all([fetch("/api/conversations"), fetch("/api/me")]);
    if (c.ok) { const data = await c.json() as { conversations?: Conversation[] }; const conversations = data.conversations || []; setItems(conversations); setActive((current) => current || conversations[0]?.id || ""); }
    if (me.ok) { const data = await me.json() as { user?: { id?: string } }; setMyId(data.user?.id || ""); }
  }, []);
  useEffect(() => { const first = setTimeout(() => { void refresh(); }, 0); const i = setInterval(refresh, 7000); return () => { clearTimeout(first); clearInterval(i); }; }, [refresh]);
  useEffect(() => {
    if (!active) return;
    let gone = false;
    const load = async () => { const res = await fetch(`/api/conversations/${active}/messages`); const data = await res.json().catch(() => ({})) as { messages?: Message[]; error?: string }; if (res.ok && !gone) setMessages(data.messages || []); else if (!res.ok && !gone) setError(data.error || "Չհաջողվեց բեռնել հաղորդագրությունները։"); };
    void load(); const i = setInterval(load, 4000); return () => { gone = true; clearInterval(i); };
  }, [active]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = draft.trim(); if (!active || !body) return;
    const res = await fetch(`/api/conversations/${active}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
    const data = await res.json().catch(() => ({})) as { error?: string };
    if (!res.ok) { setError(data.error || "Չհաջողվեց ուղարկել։"); return; }
    setDraft(""); setError(""); const refreshed = await fetch(`/api/conversations/${active}/messages`); if (refreshed.ok) { const data = await refreshed.json() as { messages?: Message[] }; setMessages(data.messages || []); } void refresh();
  }
  const selected = items.find((x) => x.id === active);
  return <main className="inbox-shell"><div className="inbox-wrap"><header className="inbox-header"><a href="/market.html">Գ Գործակ</a><a href="/market.html">Գտնել աշխատանք →</a></header><section className="inbox-grid"><aside className="inbox-list">{items.length ? items.map((item) => <button key={item.id} className={`inbox-row ${active === item.id ? "active" : ""}`} onClick={() => { setMessages([]); setActive(item.id); }}><strong>{item.other_name}</strong><small>{item.title}</small><small>Առաջարկ՝ {new Intl.NumberFormat("hy-AM").format(item.bid)} ֏</small></button>) : <div className="inbox-empty">Դեռ հաղորդագրություններ չկան։<br />Դիմիր աշխատանքին կամ ընտրիր ֆրիլանսերի առաջարկը՝ զրույցը սկսելու համար։</div>}</aside><section className="inbox-chat">{selected ? <><header className="inbox-chat-head"><strong>{selected.other_name}</strong><small>{selected.title} · Առաջարկ՝ {new Intl.NumberFormat("hy-AM").format(selected.bid)} ֏</small></header><div className="inbox-messages"><div className="inbox-msg"><small>Առաջարկը</small><br />{selected.proposal}</div>{messages.map((m) => <div key={m.id} className={`inbox-msg ${m.sender_id === myId ? "mine" : ""}`}><small>{m.sender_name}</small><br />{m.body}</div>)}</div><form className="inbox-composer" onSubmit={send}><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Գրիր հաղորդագրություն…" maxLength={5000} /><button>Ուղարկել</button></form>{error && <div className="auth-error">{error}</div>}</> : <div className="inbox-empty"><div><strong>Ընտրիր խոսակցությունը</strong>Քո աշխատանքի բոլոր պայմանավորվածությունները պահիր այստեղ։</div></div>}</section></section></div></main>;
}
