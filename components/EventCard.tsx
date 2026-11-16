"use client";
import { TIP } from "@/lib/help";
import Link from "next/link";
import { useState } from "react";
import { useStore, eventCounts, fullAccess, today, type PEvent } from "@/lib/store";
import { useToast, fmtDate, ErrorBox , Tip } from "@/components/ui";

export function icsFor(e: PEvent) {
  const d = e.date.replace(/-/g, "");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AI Xchange//EN", "BEGIN:VEVENT", `UID:${e.id}@aixchange`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${e.title}`, `LOCATION:${e.type === "Online" ? "Online" : e.venue}`, `DESCRIPTION:${e.description} ${e.time}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const a = document.createElement("a"); a.href = url; a.download = `${e.title.replace(/[^a-z0-9]+/gi, "-")}.ics`; a.click(); URL.revokeObjectURL(url);
}
const typeBadge = (t: string) => <span className={`badge ${t === "Online" ? "blue" : t === "Physical" ? "orange" : "green"}`}>{t}</span>;

/** Days until the event, as words: "Today", "Tomorrow", "In 5 days". */
export function untilLabel(date: string) {
  const d = Math.round((Date.parse(date) - Date.parse(today())) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`;
}
export const regHref = (e: PEvent) => e.regUrl || e.url || "";

/** Register / waitlist / external link / calendar — shared by event cards and the event page. */
export function EventActions({ e, big }: { e: PEvent; big?: boolean }) {
  const { me, registerEvent, cancelEvent } = useStore();
  const [err, setErr] = useState<{ code?: string; msg: string } | null>(null);
  const toast = useToast();
  const { left } = eventCounts(e);
  const mine = me ? e.registrations.find(r => r.userId === me.id && r.status !== "cancelled") : undefined;
  const past = e.date < today();
  const closed = !past && e.regClose < today();
  const allowed = e.audience !== "members" || fullAccess(me);
  const sz = big ? "" : " sm";
  if (e.external) {
    const href = past ? e.url : regHref(e);
    return href ? <a className={`btn${sz}${past ? "" : " primary"}`} style={{ alignSelf: "flex-start" }} href={href} target="_blank" rel="noreferrer">{past ? "Event website ↗" : `${e.regLabel || "Register on event website"} ↗`}</a> : null;
  }
  if (past) return e.materials ? (fullAccess(me) ? <span className="badge green" style={{ alignSelf: "flex-start" }}>{e.materials}</span> : <span className="badge" style={{ alignSelf: "flex-start" }}>Slides & recording: members only</span>) : null;
  if (e.status === "Cancelled") return null;
  if (mine) return (
    <div className="stack" style={{ gap: 8 }}>
      <div className={`alert ${mine.status === "confirmed" ? "ok" : "warn"} small`}>{mine.status === "confirmed" ? "You're registered." : "You're on the waitlist. We'll email you if a seat opens."}
        {mine.status === "confirmed" && e.type !== "Physical" && e.link && <> Join link: <a href={e.link} target="_blank" rel="noreferrer">{e.link}</a></>}</div>
      <div className="row"><button className="btn sm" onClick={() => icsFor(e)}>Add to calendar</button><button className="btn sm danger" onClick={() => { cancelEvent(e.id); toast.show("Registration cancelled"); }}>Cancel registration</button></div>
      {toast.node}
    </div>
  );
  return (
    <div className="stack" style={{ gap: 8 }}>
      {!me ? <Link className={`btn primary${sz}`} href="/signin" style={{ alignSelf: "flex-start" }}>Sign in to register</Link>
        : !allowed ? <><button className={`btn primary${sz}`} disabled style={{ alignSelf: "flex-start" }}>Register</button><span className="small muted">Members only · <Link href="/membership">become a member</Link></span></>
        : closed ? <button className={`btn${sz}`} disabled style={{ alignSelf: "flex-start" }}>Registration closed</button>
        : <button className={`btn primary${sz}`} style={{ alignSelf: "flex-start" }} onClick={() => { setErr(null); const r = registerEvent(e.id); if (!r.ok) setErr(r); else toast.show(r.msg || "Registered"); }}>{left === 0 ? "Join waitlist" : "Register"}</button>}
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      {toast.node}
    </div>
  );
}

export function EventCard({ e }: { e: PEvent }) {
  const { confirmed, waitlist, left } = eventCounts(e);
  const past = e.date < today();
  const membersOnly = e.audience === "members";
  return (
    <article className="card stack" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 6 }}>{typeBadge(e.type)}{membersOnly ? <span className="badge">Members only <Tip text={TIP.audience} /></span> : <span className="badge">Open to all <Tip text={TIP.audience} /></span>}{e.status === "Cancelled" && <span className="badge red">Cancelled</span>}{e.featured && !past && <span className="badge orange">Featured</span>}</div>
      <span className="small" style={{ fontWeight: 600, color: "var(--blue)" }}>{e.dateLabel || fmtDate(e.date)}{e.time ? ` · ${e.time}` : ""}</span>
      <h2 className="h3"><Link href={`/events/${e.id}`} className="card-title-link">{e.title}</Link></h2>
      <p className="small muted" style={{ fontSize: 14 }}>{e.description}</p>
      <dl className="kv" style={{ gridTemplateColumns: "90px 1fr", fontSize: 13 }}>
        <dt>Host</dt><dd>{e.host || "PIKOM"}</dd>
        <dt>Where</dt><dd>{e.type === "Online" ? "Online" : e.venue}</dd>
        <dt>Price</dt><dd>{e.price}</dd>
        {!past && !e.external && <><dt>Seats <Tip text={TIP.capacity} /></dt><dd>{left == null ? "No limit" : left > 0 ? `${left} of ${e.capacity} left` : `Full · ${waitlist} on waitlist`}{e.perCompany ? ` · max ${e.perCompany} per company` : ""}</dd></>}
        {past && !e.external && <><dt>Attended</dt><dd>{confirmed} registered</dd></>}
        {e.external && <><dt>Registration</dt><dd>On the event website</dd></>}
      </dl>
      <div className="row" style={{ marginTop: "auto", gap: 10, alignItems: "center" }}>
        <EventActions e={e} />
        <Link href={`/events/${e.id}`} className="more small">Event details →</Link>
      </div>
    </article>
  );
}
