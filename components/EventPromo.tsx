"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore, promotedEvent, today, type PEvent } from "@/lib/store";
import { fmtDate } from "@/components/ui";
import { EventActions, untilLabel } from "@/components/EventCard";

const when = (e: PEvent) => e.dateLabel || fmtDate(e.date);
const where = (e: PEvent) => e.type === "Online" ? "Online" : e.venue.split(",")[0];

/** Thin bar under the header on every page, for everyone (visitors included), until the event date. */
export function PromoBar() {
  const { db } = useStore();
  const path = usePathname();
  const e = promotedEvent(db, today());
  const [hidden, setHidden] = useState(true);
  useEffect(() => { if (!e) return; try { setHidden(!!localStorage.getItem("ax-promo-" + e.id)); } catch { setHidden(false); } }, [e?.id]);
  if (!e || hidden || path === `/events/${e.id}` || path.startsWith("/admin")) return null;
  return (
    <div className="promo-bar"><div className="wrap">
      <span className="promo-when">{untilLabel(e.date)}</span>
      <Link href={`/events/${e.id}`} className="promo-text"><b>{e.title}</b><span className="promo-meta"> · {when(e)} · {where(e)}</span></Link>
      <Link href={`/events/${e.id}`} className="promo-cta">Details & registration →</Link>
      <button className="promo-x" aria-label="Hide this event" onClick={() => { setHidden(true); try { localStorage.setItem("ax-promo-" + e.id, "1"); } catch {} }}>×</button>
    </div></div>
  );
}

/** Big "Featured event" card for the home and Events pages. */
export function FeaturedEvent({ e }: { e?: PEvent }) {
  const { db } = useStore();
  const ev = e || promotedEvent(db, today());
  if (!ev) return null;
  return (
    <section className="feature-event">
      <div className="fe-main">
        <div className="row" style={{ gap: 8 }}><span className="fe-kicker">Featured event</span><span className="fe-until">{untilLabel(ev.date)}</span></div>
        <h2 className="fe-title"><Link href={`/events/${ev.id}`}>{ev.title}</Link></h2>
        {ev.tagline && <p className="fe-tag">{ev.tagline}</p>}
        <div className="fe-facts"><span>📅 {when(ev)}{ev.time ? ` · ${ev.time}` : ""}</span><span>📍 {ev.type === "Online" ? "Online" : ev.venue}</span><span>🎤 {ev.host || "PIKOM"}</span></div>
        <div className="row" style={{ gap: 10, alignItems: "center" }}><EventActions e={ev} big /><Link className="btn ghost-dark" href={`/events/${ev.id}`}>Event details</Link></div>
      </div>
      {!!ev.highlights?.length && <ul className="fe-high">{ev.highlights.slice(0, 4).map(h => <li key={h}>{h}</li>)}</ul>}
    </section>
  );
}
