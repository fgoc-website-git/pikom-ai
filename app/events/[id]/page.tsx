"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore, eventCounts, today } from "@/lib/store";
import { TIP } from "@/lib/help";
import { fmtDate, Tip } from "@/components/ui";
import { EventActions, icsFor, untilLabel } from "@/components/EventCard";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const { db, ready } = useStore();
  const [copied, setCopied] = useState(false);
  const e = db.events.find(x => x.id === id);
  if (!ready) return <div className="wrap page-head muted">Loading…</div>;
  if (!e) return <div className="wrap page-head"><div className="empty">Event not found. <Link href="/events">Back to events</Link></div></div>;
  const past = e.date < today();
  const { left, waitlist } = eventCounts(e);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${e.title} — ${e.dateLabel || fmtDate(e.date)}`;
  const agenda = (e.agenda || []).map(l => { const [t, ...r] = l.split("|"); return r.length ? [t.trim(), r.join("|").trim()] : ["", l.trim()]; });
  const speakers = (e.speakers || []).map(l => { const [n, ...r] = l.split(/\s+[—–-]\s+/); return [n.trim(), r.join(" — ").trim()]; });

  return (<>
    <section className="page-hero event-hero"><div className="wrap">
      <Link href="/events" className="back-link">← All events</Link>
      <div className="row" style={{ gap: 8, marginTop: 14 }}>
        <span className="badge dark-outline">{e.type}</span>
        <span className="badge dark-outline">{e.audience === "members" ? "Members only" : "Open to all"}</span>
        {e.status === "Cancelled" ? <span className="badge red">Cancelled</span> : past ? <span className="badge dark-outline">Past event</span> : <span className="badge orange">{untilLabel(e.date)}</span>}
      </div>
      <h1 className="h1" style={{ marginTop: 10 }}>{e.title}</h1>
      {e.tagline && <p style={{ fontSize: 18 }}>{e.tagline}</p>}
      <div className="fe-facts" style={{ marginTop: 14 }}><span>📅 {e.dateLabel || fmtDate(e.date)}{e.time ? ` · ${e.time}` : ""}</span><span>📍 {e.type === "Online" ? "Online" : e.venue}</span><span>🎤 {e.host || "PIKOM"}</span></div>
    </div></section>

    <section className="wrap section event-layout">
      <div className="stack" style={{ gap: 28 }}>
        <div className="stack" style={{ gap: 10 }}><h2 className="h2">About this event</h2><p className="event-text">{e.description}</p></div>
        {!!e.highlights?.length && <div className="stack" style={{ gap: 12 }}><h2 className="h2">Highlights</h2><ul className="ticks">{e.highlights.map(h => <li key={h}>{h}</li>)}</ul></div>}
        {!!agenda.length && <div className="stack" style={{ gap: 12 }}><h2 className="h2">Programme</h2><ol className="agenda">{agenda.map(([t, i], n) => <li key={n}><span className="ag-t">{t}</span><span>{i}</span></li>)}</ol></div>}
        {!!speakers.length && <div className="stack" style={{ gap: 12 }}><h2 className="h2">Speakers</h2><div className="speakers">{speakers.map(([n, r]) => <div key={n} className="speaker"><span className="sp-av">{n.split(/\s+/).map(w => w[0]).slice(0, 2).join("")}</span><div><b>{n}</b>{r && <div className="small muted">{r}</div>}</div></div>)}</div></div>}
        {e.whoShouldAttend && <div className="stack" style={{ gap: 10 }}><h2 className="h2">Who should attend</h2><p className="event-text">{e.whoShouldAttend}</p></div>}
        {!agenda.length && !speakers.length && !past && <p className="small muted">Programme and speakers will be added here when the organiser announces them.</p>}
      </div>

      <aside className="card stack event-side" style={{ gap: 14 }}>
        <h2 className="h3">{past ? "Event details" : "Register"}</h2>
        <dl className="kv" style={{ gridTemplateColumns: "96px 1fr", fontSize: 14 }}>
          <dt>Date</dt><dd>{e.dateLabel || fmtDate(e.date)}{e.time ? ` · ${e.time}` : ""}</dd>
          <dt>Venue</dt><dd>{e.type === "Online" ? "Online" : e.venue}</dd>
          <dt>Price</dt><dd>{e.price}</dd>
          {!past && !e.external && <><dt>Seats <Tip text={TIP.capacity} /></dt><dd>{left == null ? "No limit" : left > 0 ? `${left} of ${e.capacity} left` : `Full · ${waitlist} on waitlist`}{e.perCompany ? ` · max ${e.perCompany} per company` : ""}</dd></>}
          {e.external && <><dt>Registration</dt><dd>On the event website</dd></>}
          {e.contact && <><dt>Contact</dt><dd>{e.contact}</dd></>}
        </dl>
        <EventActions e={e} big />
        {e.url && e.external && !past && e.regUrl && <a className="small" href={e.url} target="_blank" rel="noreferrer">Event website ↗</a>}
        {e.url && !e.external && <a className="small" href={e.url} target="_blank" rel="noreferrer">Event website ↗</a>}
        {!past && <button className="btn sm" style={{ alignSelf: "flex-start" }} onClick={() => icsFor(e)}>Add to calendar</button>}
        <div className="share">
          <span className="small muted">Share</span>
          <a className="btn sm" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noreferrer">LinkedIn</a>
          <a className="btn sm" href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + pageUrl)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <button className="btn sm" onClick={() => { navigator.clipboard?.writeText(pageUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>{copied ? "Link copied" : "Copy link"}</button>
        </div>
      </aside>
    </section>
  </>);
}
