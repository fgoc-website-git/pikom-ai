"use client";
import { useStore } from "@/lib/store";
import { EVENT_LIST } from "@/lib/content";
import { PageHero } from "@/components/PageHero";

export default function Events() {
  const { me } = useStore();
  return (<>
    <PageHero title="Events" lead="Member meetups, briefings and PIKOM flagship events. Dates to be confirmed by the secretariat." />
    <section className="wrap section grid">
      {EVENT_LIST.map(e => (
        <div key={e.id} className="card stack" style={{ gap: 8 }}>
          <span className="small" style={{ fontWeight: 600, color: "var(--blue)" }}>{e.when} · {e.where}</span>
          <h2 className="h3">{e.name}</h2><p className="muted small" style={{ fontSize: 14 }}>{e.d}</p>
          <span className="small" style={{ fontWeight: 600 }}>{me ? e.members : e.public}</span>
          <button className="btn sm" style={{ alignSelf: "flex-start", marginTop: "auto" }} disabled={!me && e.public === "Members only"}>{me ? "RSVP" : e.public === "Members only" ? "Members only" : "Register"}</button>
        </div>))}
    </section>
  </>);
}
