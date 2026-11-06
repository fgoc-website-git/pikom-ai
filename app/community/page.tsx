"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { FORUM_LIST } from "@/lib/content";
import { PageHero } from "@/components/PageHero";

export default function Community() {
  const { me } = useStore();
  return (<>
    <PageHero title="Community" lead="Member forums and special interest groups. Read as a guest; post as a member." />
    <section className="wrap section stack">
      {!me && <div className="alert info"><Link href="/signin">Sign in</Link> to post and join groups.</div>}
      {FORUM_LIST.map(f => (
        <div key={f.id} className="card row between">
          <div className="stack" style={{ gap: 2 }}><b style={{ fontSize: 17 }}>{f.name}</b><span className="small muted">{f.posts} posts · last activity {f.last}</span></div>
          <button className="btn sm" disabled={!me}>{me ? "Open" : "Members can post"}</button>
        </div>))}
      <p className="small muted">Forums are illustrative in this mock-up.</p>
    </section>
  </>);
}
