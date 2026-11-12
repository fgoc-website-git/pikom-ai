"use client";
import Link from "next/link";
import { useStore, isSuper, seatsUsedIn, adminsOf, today, eventCounts, type DB } from "@/lib/store";
import { fmtDate } from "@/components/ui";

const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

export function todoCounts(db: DB, sup: boolean) {
  const t = today();
  const noDomain = sup ? db.orgs.filter(o => !o.domain).length : 0;
  const noAdmin = sup ? db.orgs.filter(o => o.domain && !adminsOf(db, o.id).length).length : 0;
  const full = sup ? db.orgs.filter(o => seatsUsedIn(db, o.id) >= o.seatLimit).length : 0;
  const renewals = sup ? db.orgs.filter(o => o.renewal && o.renewal >= t && o.renewal <= plus(90)).length : 0;
  const paused = sup ? db.orgs.filter(o => o.status === "suspended").length : 0;
  const hidden = db.jobs.filter(j => j.hidden).length + db.rfps.filter(r => r.hidden).length;
  const drafts = db.events.filter(e => e.status === "Draft").length + db.content.filter(c => !c.published).length;
  return { noDomain, noAdmin, full, renewals, paused, hidden, drafts, total: noDomain + noAdmin };
}

export function Overview() {
  const { db, me } = useStore();
  const sup = isSuper(me);
  const c = todoCounts(db, sup);
  const t = today();
  const week = db.events.filter(e => e.status === "Published" && e.date >= t && e.date <= plus(7));
  const upcoming = db.events.filter(e => e.status === "Published" && e.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const card = (n: number, label: string, href: string, hint: string, warn = true) => (
    <Link href={href} className={`card ${n && warn ? "warn" : "ok"}`}>
      <span className="n">{n}</span><b>{label}</b><span className="small muted">{n ? hint : "All clear"}</span>
    </Link>);
  return (
    <div className="stack" style={{ gap: 22 }}>
      <section className="stack" style={{ gap: 10 }}>
        <h2 className="h3">Needs attention</h2>
        <div className="todo">
          {sup && card(c.noDomain, "Companies missing a domain", "/admin/companies?filter=nodomain", "Add the email domain so their people can register.")}
          {sup && card(c.noAdmin, "Companies with no admin", "/admin/companies?filter=nomain", "Set the first company admin.")}
          {sup && card(c.full, "Companies with full seats", "/admin/companies?filter=full", "They can't add anyone until a seat is freed.", false)}
          {sup && card(c.renewals, "Renewals in the next 90 days", "/admin/companies?filter=renewal", "Check with the secretariat.", false)}
          {sup && c.paused > 0 && card(c.paused, "Paused companies", "/admin/companies?filter=paused", "Restore access once renewed.")}
          {card(week.length, "Events this week", "/admin/events?filter=upcoming", "Check attendees and joining links.", false)}
          {card(c.hidden, "Hidden posts", "/admin/posts", "Posts hidden by PIKOM — review or show again.", false)}
          {card(c.drafts, "Drafts", "/admin/insights?filter=draft", "Unpublished events and insights.", false)}
        </div>
      </section>
      <div className="grid2">
        <section className="card stack" style={{ gap: 8 }}>
          <div className="row between"><h2 className="h3">Upcoming events</h2><Link className="small" href="/admin/events/new">+ New event</Link></div>
          {upcoming.length === 0 ? <p className="small muted">No upcoming events.</p> : upcoming.map(e => { const k = eventCounts(e); return (
            <Link key={e.id} href={`/admin/events/${e.id}`} className="row between" style={{ color: "var(--ink)", borderTop: "1px solid var(--soft)", paddingTop: 8 }}>
              <span><b style={{ fontWeight: 600 }}>{e.title}</b><div className="small muted">{fmtDate(e.date)} · {e.type}</div></span>
              <span className="small nw">{k.confirmed}{e.capacity ? ` / ${e.capacity}` : ""}{k.waitlist ? ` · +${k.waitlist} waitlist` : ""}</span>
            </Link>); })}
        </section>
        <section className="card stack" style={{ gap: 8 }}>
          <h2 className="h3">Quick actions</h2>
          <div className="row" style={{ gap: 8 }}>
            {sup && <Link className="btn sm primary" href="/admin/companies?add=1">+ Whitelist a company</Link>}
            {sup && <Link className="btn sm" href="/admin/companies/import">Import companies (CSV)</Link>}
            {sup && <Link className="btn sm" href="/admin/individuals">+ Individual member</Link>}
            <Link className="btn sm" href="/admin/events/new">+ New event</Link>
            <Link className="btn sm" href="/admin/insights/new">+ New insight</Link>
            <Link className="btn sm" href="/admin/announcements">Announcement banner</Link>
          </div>
          {sup && <>
            <h2 className="h3" style={{ marginTop: 8 }}>Recent activity</h2>
            {db.log.slice(0, 5).map((l, i) => <div key={i} className="small" style={{ borderTop: "1px solid var(--soft)", paddingTop: 6 }}><span className="muted">{l.at} · {l.who}</span><div>{l.what}</div></div>)}
            <Link className="small" href="/admin/log">Full activity log →</Link>
          </>}
        </section>
      </div>
    </div>
  );
}
