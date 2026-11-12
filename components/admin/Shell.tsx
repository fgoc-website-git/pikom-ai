"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useStore, isSuper, seatsUsedIn, type DB } from "@/lib/store";
import { PAGE_HELP } from "@/lib/help";
import { ErrorBox, MembersOnly } from "@/components/ui";
import { todoCounts } from "./Overview";

type Item = { href: string; label: string; key: string; superOnly?: boolean; badge?: (db: DB) => [number, boolean?] | null };
const NAV: { title: string; items: Item[] }[] = [
  { title: "", items: [{ href: "/admin", label: "Overview", key: "overview" }] },
  { title: "Members", items: [
    { href: "/admin/companies", label: "Companies", key: "companies", superOnly: true, badge: db => [db.orgs.length] },
    { href: "/admin/individuals", label: "Individual members", key: "individuals", superOnly: true, badge: db => [db.individuals.length] },
    { href: "/admin/people", label: "People", key: "people", superOnly: true, badge: db => [db.users.length] },
  ] },
  { title: "Content", items: [
    { href: "/admin/events", label: "Events", key: "events", badge: db => [db.events.filter(e => e.status === "Published" && e.date >= new Date().toISOString().slice(0, 10)).length] },
    { href: "/admin/insights", label: "Insights & policy", key: "insights", badge: db => [db.content.length] },
    { href: "/admin/announcements", label: "Announcements", key: "announcements" },
  ] },
  { title: "Moderation", items: [{ href: "/admin/posts", label: "Post checks", key: "posts", badge: db => { const n = db.jobs.filter(j => j.hidden).length + db.rfps.filter(r => r.hidden).length; return n ? [n, true] : null; } }] },
  { title: "Reports", items: [
    { href: "/admin/reports", label: "Reports", key: "reports" },
    { href: "/admin/log", label: "Activity log", key: "log", superOnly: true },
  ] },
  { title: "Settings", items: [
    { href: "/admin/site-admins", label: "Site admins", key: "siteAdmins", superOnly: true },
    { href: "/admin/settings", label: "Site settings", key: "settings", superOnly: true },
  ] },
];
const ALL = NAV.flatMap(g => g.items);
/** Which page (and help text) we're on. Detail pages map to their own help. */
function current(path: string): { item: Item; helpKey: string } {
  const exact = ALL.find(i => i.href === path);
  if (exact) return { item: exact, helpKey: exact.key };
  if (path.startsWith("/admin/companies/import")) return { item: ALL.find(i => i.key === "companies")!, helpKey: "import" };
  if (path.startsWith("/admin/companies/")) return { item: ALL.find(i => i.key === "companies")!, helpKey: "company" };
  if (path.startsWith("/admin/people/")) return { item: ALL.find(i => i.key === "people")!, helpKey: "person" };
  if (path.startsWith("/admin/events/")) return { item: ALL.find(i => i.key === "events")!, helpKey: "event" };
  if (path.startsWith("/admin/insights/")) return { item: ALL.find(i => i.key === "insights")!, helpKey: "insight" };
  return { item: ALL[0], helpKey: "overview" };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <MembersOnly staff><Inner>{children}</Inner></MembersOnly>;
}

function Inner({ children }: { children: React.ReactNode }) {
  const { db, me } = useStore();
  const path = usePathname();
  const sup = isSuper(me);
  const { item, helpKey } = current(path);
  const [help, setHelp] = useState(false);
  const todo = todoCounts(db, sup);
  return (
    <div className="wrap page-head">
      <div className="admin-top">
        <div className="stack" style={{ gap: 2 }}>
          <span className="eyebrow">{sup ? "Super admin" : "PIKOM admin"} · site management</span>
          <div className="row" style={{ gap: 10 }}>
            <h1 className="h1">{item.label}</h1>
            <button className="btn sm" aria-expanded={help} onClick={() => setHelp(!help)} title="What is this page for?">? Help</button>
          </div>
        </div>
        <AdminSearch />
      </div>
      {help && PAGE_HELP[helpKey] && <div className="help-panel stack" style={{ gap: 4, marginBottom: 16 }}>{PAGE_HELP[helpKey].map(t => <span key={t}>{t}</span>)}</div>}
      <div className="side-layout">
        <nav aria-label="Admin sections" className="card stack side-nav" style={{ gap: 14, padding: 14 }}>
          {NAV.map(g => {
            const items = g.items.filter(i => sup || !i.superOnly);
            if (!items.length) return null;
            return (
              <div key={g.title || "top"} className="stack" style={{ gap: 2 }}>
                {g.title && <span className="small muted" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 10px 4px" }}>{g.title}</span>}
                {items.map(i => {
                  const b = i.key === "overview" ? (todo.total ? [todo.total, true] as [number, boolean] : null) : i.badge?.(db);
                  const on = i.href === "/admin" ? path === "/admin" : path === i.href || path.startsWith(i.href + "/");
                  return <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}>{i.label}{b && <span className={`nav-n${b[1] ? " warn" : ""}`}>{b[0]}</span>}</Link>;
                })}
              </div>);
          })}
        </nav>
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}

/** Wrap super-admin-only pages. */
export function SuperOnly({ children }: { children: React.ReactNode }) {
  const { me } = useStore();
  if (!isSuper(me)) return <ErrorBox code="AX-403" msg="This page is for super admins." />;
  return <>{children}</>;
}

/** One search box across companies, people, events and insights. */
function AdminSearch() {
  const { db, me } = useStore();
  const sup = isSuper(me);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const res = useMemo(() => {
    const t = q.trim().toLowerCase(); if (t.length < 2) return [];
    const m = (s: string) => s.toLowerCase().includes(t);
    return [
      ...(sup ? db.orgs.filter(o => m(o.name + " " + o.domain)).slice(0, 5).map(o => ({ href: `/admin/companies/${o.id}`, label: o.name, kind: `Company · ${seatsUsedIn(db, o.id)}/${o.seatLimit} seats` })) : []),
      ...(sup ? db.users.filter(u => m(u.name + " " + u.email)).slice(0, 5).map(u => ({ href: `/admin/people/${u.id}`, label: u.name, kind: `Person · ${u.email}` })) : []),
      ...db.events.filter(e => m(e.title)).slice(0, 4).map(e => ({ href: `/admin/events/${e.id}`, label: e.title, kind: `Event · ${e.date}` })),
      ...db.content.filter(c => m(c.title)).slice(0, 4).map(c => ({ href: `/admin/insights/${c.id}`, label: c.title, kind: "Insight" })),
    ];
  }, [q, db, sup]);
  return (
    <div className="admin-search" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <input className="input" type="search" placeholder={sup ? "Search companies, people, events…" : "Search events and insights…"} aria-label="Search admin" value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} />
      {open && q.trim().length >= 2 && (
        <div className="results" role="listbox">
          {res.length === 0 ? <div className="small muted" style={{ padding: 12 }}>No matches.</div> : res.map(r => <Link key={r.href} href={r.href} onClick={() => { setOpen(false); setQ(""); }}><b style={{ fontWeight: 600 }}>{r.label}</b><span className="small muted" style={{ textAlign: "right" }}>{r.kind}</span></Link>)}
        </div>)}
    </div>
  );
}
