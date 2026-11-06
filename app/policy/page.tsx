"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { POLICIES } from "@/lib/data";
import { POLICY_TIMELINE } from "@/lib/content";
import { PageHero } from "@/components/PageHero";

export default function Policy() {
  const { me } = useStore();
  return (<>
    <PageHero title="Policy watch" lead="Malaysian AI regulation and programmes that affect members, and how PIKOM is responding." />
    <section className="wrap section">
      <div className="card stack" style={{ gap: 12 }} id="working-group">
        <span className="eyebrow">Featured</span><h2 className="h2">Malaysia AI Governance Bill</h2>
        <p className="muted">National AI Office consultation closed 31 July 2026: three risk tiers, a Central AI Authority, incident reporting and an AI sandbox.</p>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>{POLICY_TIMELINE.map(t => <li key={t.what}><b>{t.what}</b> — <span className="muted">{t.when}</span></li>)}</ol>
        {me ? <button className="btn primary" style={{ alignSelf: "flex-start" }}>Join the working group</button> : <Link className="btn" style={{ alignSelf: "flex-start" }} href="/signin">Members: sign in to join the working group</Link>}
      </div>
    </section>
    <section className="wrap section">
      <h2 className="h2" style={{ marginBottom: 16 }}>Tracker</h2>
      <div className="grid2">{POLICIES.map(p => (
        <div key={p.id} className="card stack" style={{ gap: 6 }}>
          <div className="row between"><b>{p.title}</b><span className="badge" style={{ color: p.sc }}>{p.status}</span></div>
          <span className="small muted">{p.body} · {p.due}</span><p className="small" style={{ fontSize: 14 }}>{p.desc}</p>
        </div>))}</div>
    </section>
  </>);
}
