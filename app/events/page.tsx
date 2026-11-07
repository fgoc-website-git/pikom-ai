"use client";
import { useState } from "react";
import { useStore, today } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import { EventCard } from "@/components/EventCard";

export default function Events() {
  const { db } = useStore();
  const [tab, setTab] = useState<"up" | "past">("up");
  const list = db.events.filter(e => e.status !== "Draft").filter(e => tab === "up" ? e.date >= today() : e.date < today()).sort((a, b) => tab === "up" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  return (<>
    <PageHero title="Events" lead="Member meetups, briefings and PIKOM events — online, in person or both." />
    <section className="wrap" style={{ paddingTop: 24 }}>
      <div className="tabs" role="tablist">{([["up", "Upcoming"], ["past", "Past events"]] as const).map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {list.length === 0 ? <div className="empty">No events here yet.</div> : <div className="grid">{list.map(e => <EventCard key={e.id} e={e} />)}</div>}
    </section>
  </>);
}
