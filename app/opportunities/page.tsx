"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { RFP_LIST } from "@/lib/content";
import { PageHero } from "@/components/PageHero";

export default function Opportunities() {
  const { me } = useStore();
  return (<>
    <PageHero title="Opportunities (RFPs)" lead="AI requirements from industry and government buyers. Budgets, buyer contacts and responses are for members." />
    <section className="wrap section stack">
      {!me && <div className="alert info">You're browsing as a guest. <Link href="/signin">Sign in</Link> to see budgets and respond.</div>}
      {RFP_LIST.map(r => (
        <div key={r.id} className="card row between">
          <div className="stack" style={{ gap: 4, flex: "1 1 360px" }}><b style={{ fontSize: 17 }}>{r.title}</b><span className="small muted">{r.sector} · {r.type} · closes {r.closes}</span></div>
          {me ? <span className="badge green">{r.budget}</span> : <span className="badge">Budget: members only</span>}
          <Link className="btn sm" href={me ? "#" : "/signin"}>{me ? "Respond" : "Sign in to respond"}</Link>
        </div>))}
      <p className="small muted">Sample requirements for the demo.</p>
    </section>
  </>);
}
