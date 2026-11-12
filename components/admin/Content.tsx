"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, eventCounts, newId, today, roleLabel, isSuper, type PEvent, type Content, type ContentKind, type EventType } from "@/lib/store";
import { TIP } from "@/lib/help";
import { Field, Area, fmtDate, Tip, ListBar, Pager, usePaged, useQueryParam, ask, ErrorBox } from "@/components/ui";
import { downloadCsv } from "./Access";

type Toast = (s: string) => void;
const SR = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" };
const rowGo = (router: ReturnType<typeof useRouter>, href: string) => (e: React.MouseEvent) => { if (!(e.target as HTMLElement).closest("a,button,input,select,label")) router.push(href); };

/* ---------------- Events ---------------- */
const blankEvent = (): PEvent => ({ id: "", title: "", type: "Physical", date: "", time: "", venue: "", link: "", capacity: 100, perCompany: null, audience: "members", price: "Free for members", description: "", regClose: "", status: "Draft", materials: "", registrations: [], host: "PIKOM" });

function EventForm({ init, toast, onSaved }: { init: PEvent; toast: Toast; onSaved: (id: string) => void }) {
  const { saveEvent } = useStore();
  const [e, setE] = useState<PEvent>(init);
  const [dirty, setDirty] = useState(false);
  const set = (p: Partial<PEvent>) => { setE({ ...e, ...p }); setDirty(true); };
  return (
    <form className="card stack" style={{ gap: 16 }} onSubmit={ev => { ev.preventDefault(); const id = e.id || newId(); saveEvent({ ...e, id, regClose: e.regClose || e.date }); setDirty(false); toast(e.status === "Published" ? "Event published" : "Event saved"); onSaved(id); }}>
      <div className="form-grid">
        <Field label="Event title" required value={e.title} onChange={x => set({ title: x.target.value })} />
        <fieldset><legend>Format</legend><div className="chips">{(["Online", "Physical", "Hybrid"] as EventType[]).map(t => <label key={t} className={`chip${e.type === t ? " on" : ""}`}><input type="radio" name="etype" checked={e.type === t} onChange={() => set({ type: t, capacity: t === "Online" ? null : e.capacity ?? 100 })} />{t}</label>)}</div></fieldset>
        <Field label="Date" type="date" required value={e.date} onChange={x => set({ date: x.target.value })} />
        <Field label="Time" placeholder="18:30 – 21:00" required value={e.time} onChange={x => set({ time: x.target.value })} />
        {e.type !== "Online" && <Field label="Venue" required value={e.venue} onChange={x => set({ venue: x.target.value })} />}
        {e.type !== "Physical" && <Field label="Online joining link" tip={TIP.joinLink} type="url" required value={e.link} onChange={x => set({ link: x.target.value })} />}
        <Field label={e.type === "Online" ? "Seat limit (optional)" : "Capacity (seats)"} tip={TIP.capacity} type="number" min={1} value={e.capacity ?? ""} onChange={x => set({ capacity: x.target.value ? Number(x.target.value) : null })} />
        <Field label="Max per company (optional)" tip={TIP.perCompany} type="number" min={1} value={e.perCompany ?? ""} onChange={x => set({ perCompany: x.target.value ? Number(x.target.value) : null })} />
        <label className="field"><span className="lbl">Who can register<Tip text={TIP.audience} /></span><select className="select" value={e.audience} onChange={x => set({ audience: x.target.value as "members" })}><option value="members">PIKOM members only</option><option value="all">Members and guests</option></select></label>
        <Field label="Hosted by" value={e.host} onChange={x => set({ host: x.target.value })} hint="PIKOM or the member company running it" />
        <Field label="Price note" value={e.price} onChange={x => set({ price: x.target.value })} hint="Payment is handled outside the site" />
        <Field label="Registration closes" tip={TIP.regClose} type="date" value={e.regClose} onChange={x => set({ regClose: x.target.value })} />
        <label className="field"><span className="lbl">Status<Tip text={TIP.eventStatus} /></span><select className="select" value={e.status} onChange={x => set({ status: x.target.value as "Draft" })}><option>Draft</option><option>Published</option><option>Cancelled</option></select></label>
      </div>
      <Area label="Description" required value={e.description} onChange={x => set({ description: x.target.value })} />
      <Field label="After the event: slides / recording note (members only)" tip={TIP.materials} value={e.materials} onChange={x => set({ materials: x.target.value })} />
      <div className="row"><button className="btn primary">{init.id ? "Save changes" : "Create event"}</button>{dirty && <span className="small muted">Unsaved changes</span>}</div>
    </form>
  );
}

function Attendees({ e }: { e: PEvent }) {
  const { db, markAttended } = useStore();
  const [q, setQ] = useState("");
  const rows = e.registrations.filter(r => r.status !== "cancelled").map(r => ({ r, u: db.users.find(x => x.id === r.userId) })).filter(({ u }) => !q || (u?.name + " " + u?.email).toLowerCase().includes(q.toLowerCase()));
  const company = (orgId: string | null | undefined, fallback?: string) => db.orgs.find(o => o.id === orgId)?.name || fallback || "Individual";
  const c = eventCounts(e);
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row between"><h3 className="h3">Attendees · {c.confirmed}{e.capacity ? ` / ${e.capacity}` : ""} confirmed{c.waitlist ? ` · ${c.waitlist} waitlist` : ""}</h3>
        <div className="row" style={{ gap: 8 }}><input className="input" style={{ width: 220 }} type="search" placeholder="Find attendee" aria-label="Find attendee" value={q} onChange={x => setQ(x.target.value)} />
          <button className="btn sm" onClick={() => downloadCsv(`${e.title}-attendees.csv`, [["Name", "Email", "Company", "Role", "Status", "Registered", "Attended"], ...rows.map(({ r, u }) => [u?.name || "", u?.email || "", company(u?.orgId, u?.company), u ? roleLabel(u.role) : "", r.status, r.at, r.attended ? "Yes" : ""])])}>Export to Excel (CSV)</button></div></div>
      {rows.length === 0 ? <p className="muted">No registrations yet.</p> : <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Company</th><th>Status <Tip text={TIP.capacity} /></th><th>Registered</th><th>Attended</th></tr></thead>
        <tbody>{rows.map(({ r, u }) => <tr key={r.userId}><td><b>{u ? <Link href={`/admin/people/${u.id}`}>{u.name}</Link> : "—"}</b><div className="small muted">{u?.email}</div></td><td>{company(u?.orgId, u?.company)}</td><td><span className={`badge ${r.status === "confirmed" ? "green" : "orange"}`}>{r.status === "confirmed" ? "Confirmed" : "Waitlist"}</span></td><td className="small">{r.at}</td>
          <td><input type="checkbox" aria-label={`${u?.name} attended`} checked={!!r.attended} disabled={r.status !== "confirmed"} onChange={x => markAttended(e.id, r.userId, x.target.checked)} /></td></tr>)}</tbody>
      </table></div>}
    </div>
  );
}

export function EventsAdmin() {
  const { db } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useQueryParam("filter", "all");
  const t = today();
  const tests: Record<string, (e: PEvent) => boolean> = { all: () => true, upcoming: e => e.status === "Published" && e.date >= t, draft: e => e.status === "Draft", past: e => e.date < t, cancelled: e => e.status === "Cancelled" };
  const list = db.events.filter(tests[filter] || tests.all).filter(e => e.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) => filter === "past" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  const pg = usePaged(list, 20);
  const n = (k: string) => db.events.filter(tests[k]).length;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <ListBar q={q} setQ={setQ} placeholder="Search events" count={list.length} noun="event"
        filters={[["all", "All", n("all")], ["upcoming", "Upcoming", n("upcoming")], ["draft", "Drafts", n("draft")], ["past", "Past", n("past")], ["cancelled", "Cancelled", n("cancelled")]]} filter={filter} setFilter={setFilter}>
        <Link className="btn primary" href="/admin/events/new">+ New event</Link>
      </ListBar>
      {list.length === 0 ? <div className="empty">No events here. <Link href="/admin/events/new">Create one</Link></div> : <>
        <div className="table-wrap"><table>
          <thead><tr><th>Event</th><th>Date</th><th>Registered</th><th>Status <Tip text={TIP.eventStatus} /></th><th><span style={SR}>Open</span></th></tr></thead>
          <tbody>{pg.rows.map(e => { const c = eventCounts(e); return (
            <tr key={e.id} className="row-link" onClick={rowGo(router, `/admin/events/${e.id}`)}><td><b>{e.title}</b><div className="small muted">{e.type} · {e.audience === "members" ? "members only" : "members and guests"}{e.perCompany ? ` · max ${e.perCompany}/company` : ""}</div></td><td className="nw">{fmtDate(e.date)}{e.date < t && <div className="small muted">Past</div>}</td>
              <td className="nw">{c.confirmed}{e.capacity ? ` / ${e.capacity}` : ""}{c.waitlist > 0 && <div className="small muted">+{c.waitlist} waitlist</div>}</td>
              <td><span className={`badge ${e.status === "Published" ? "green" : e.status === "Cancelled" ? "red" : ""}`}>{e.status}</span></td>
              <td><Link className="btn sm" href={`/admin/events/${e.id}`}>Open</Link></td></tr>); })}</tbody>
        </table></div>
        <Pager {...pg} />
      </>}
    </div>
  );
}

export function EventDetail({ id, toast }: { id: string; toast: Toast }) {
  const { db, deleteEvent } = useStore();
  const router = useRouter();
  const isNew = id === "new";
  const e = isNew ? null : db.events.find(x => x.id === id);
  if (!isNew && !e) return <div className="stack"><ErrorBox code="AX-404" msg="This event no longer exists." /><Link href="/admin/events">← Events</Link></div>;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <Link href="/admin/events" className="small">← Events</Link>
        {e && <div className="row" style={{ gap: 8 }}><Link className="btn sm" href="/events" target="_blank">View on site ↗</Link><button className="btn sm danger" onClick={async () => { if (await ask(`Delete “${e.title}”?`, { detail: `${eventCounts(e).confirmed} people are registered.` })) { deleteEvent(e.id); router.push("/admin/events"); } }}>Delete event</button></div>}
      </div>
      <h2 className="h2">{e ? e.title : "New event"}</h2>
      <EventForm key={e?.id || "new"} init={e || blankEvent()} toast={toast} onSaved={nid => { if (isNew) router.replace(`/admin/events/${nid}`); }} />
      {e && <Attendees e={e} />}
    </div>
  );
}

/* ---------------- Insights ---------------- */
const KINDS: [ContentKind, string][] = [["policy", "Policy & governance"], ["research", "PIKOM research"], ["news", "News"]];
const blankContent = (): Content => ({ id: "", kind: "policy", title: "", summary: "", body: "", source: "PIKOM", url: "", file: "", date: today(), policyStatus: "", featured: false, published: false });

function ContentForm({ init, toast, onSaved }: { init: Content; toast: Toast; onSaved: (id: string) => void }) {
  const { saveContent } = useStore();
  const [c, setC] = useState<Content>(init);
  const [dirty, setDirty] = useState(false);
  const set = (p: Partial<Content>) => { setC({ ...c, ...p }); setDirty(true); };
  return (
    <form className="card stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); const id = c.id || newId(); saveContent({ ...c, id }); setDirty(false); toast(c.published ? "Published" : "Saved as draft"); onSaved(id); }}>
      <div className="form-grid">
        <label className="field"><span className="lbl">Section</span><select className="select" value={c.kind} onChange={e => set({ kind: e.target.value as ContentKind })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <Field label="Title" required value={c.title} onChange={e => set({ title: e.target.value })} />
        <Field label="Source" value={c.source} onChange={e => set({ source: e.target.value })} hint="e.g. PIKOM, NAIO, Bank Negara" />
        <Field label="Date" type="date" value={c.date} onChange={e => set({ date: e.target.value })} />
        {c.kind === "policy" && <Field label="Policy status" tip={TIP.policyStatus} placeholder="In consultation, Active, Passed…" value={c.policyStatus} onChange={e => set({ policyStatus: e.target.value })} />}
        <Field label="Link (optional)" type="url" value={c.url} onChange={e => set({ url: e.target.value })} />
        <label className="field"><span className="lbl">Attach PDF (optional)</span><input className="input" style={{ paddingTop: 9 }} type="file" accept="application/pdf" onChange={e => set({ file: e.target.files?.[0]?.name || "" })} />{c.file && <span className="hint">Attached: {c.file} (downloads switch on once file storage is added)</span>}</label>
      </div>
      <Area label="Summary (shown on cards)" required maxLength={400} value={c.summary} onChange={e => set({ summary: e.target.value })} hint={`${c.summary.length}/400`} />
      <Area label="More detail (optional)" value={c.body} onChange={e => set({ body: e.target.value })} />
      <div className="row">
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={c.featured} onChange={e => set({ featured: e.target.checked })} />Feature on the home page<Tip text={TIP.featured} /></label>
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={c.published} onChange={e => set({ published: e.target.checked })} />Published<Tip text={TIP.published} /></label>
      </div>
      <div className="row"><button className="btn primary">{init.id ? "Save changes" : "Create item"}</button>{dirty && <span className="small muted">Unsaved changes</span>}</div>
    </form>
  );
}

export function InsightsAdmin() {
  const { db, saveContent } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useQueryParam("filter", "all");
  const tests: Record<string, (c: Content) => boolean> = { all: () => true, policy: c => c.kind === "policy", research: c => c.kind === "research", news: c => c.kind === "news", draft: c => !c.published, featured: c => c.featured };
  const list = db.content.filter(tests[filter] || tests.all).filter(c => (c.title + c.source).toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const pg = usePaged(list, 20);
  const n = (k: string) => db.content.filter(tests[k]).length;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <ListBar q={q} setQ={setQ} placeholder="Search title or source" count={list.length} noun="item"
        filters={[["all", "All", n("all")], ["policy", "Policy & governance", n("policy")], ["research", "Research", n("research")], ["news", "News", n("news")], ["featured", "Featured", n("featured")], ["draft", "Drafts", n("draft")]]} filter={filter} setFilter={setFilter}>
        <Link className="btn primary" href="/admin/insights/new">+ New item</Link>
      </ListBar>
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : <>
        <div className="table-wrap"><table>
          <thead><tr><th>Title</th><th>Section</th><th>Date</th><th>Home <Tip text={TIP.featured} /></th><th>Status <Tip text={TIP.published} /></th><th><span style={SR}>Open</span></th></tr></thead>
          <tbody>{pg.rows.map(c => <tr key={c.id} className="row-link" onClick={rowGo(router, `/admin/insights/${c.id}`)}><td><b>{c.title}</b><div className="small muted">{c.source}{c.policyStatus ? ` · ${c.policyStatus}` : ""}</div></td><td className="small">{KINDS.find(k => k[0] === c.kind)?.[1]}</td><td className="nw">{fmtDate(c.date)}</td>
            <td><input type="checkbox" aria-label="Feature on home" checked={c.featured} onChange={e => saveContent({ ...c, featured: e.target.checked })} /></td>
            <td><span className={`badge ${c.published ? "green" : ""}`}>{c.published ? "Published" : "Draft"}</span></td>
            <td><Link className="btn sm" href={`/admin/insights/${c.id}`}>Open</Link></td></tr>)}</tbody>
        </table></div>
        <Pager {...pg} />
      </>}
    </div>
  );
}

export function InsightDetail({ id, toast }: { id: string; toast: Toast }) {
  const { db, deleteContent } = useStore();
  const router = useRouter();
  const isNew = id === "new";
  const c = isNew ? null : db.content.find(x => x.id === id);
  if (!isNew && !c) return <div className="stack"><ErrorBox code="AX-404" msg="This item no longer exists." /><Link href="/admin/insights">← Insights & policy</Link></div>;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <Link href="/admin/insights" className="small">← Insights & policy</Link>
        {c && <div className="row" style={{ gap: 8 }}><Link className="btn sm" href={`/insights?tab=${c.kind}`} target="_blank">View on site ↗</Link><button className="btn sm danger" onClick={async () => { if (await ask(`Delete “${c.title}”?`)) { deleteContent(c.id); router.push("/admin/insights"); } }}>Delete</button></div>}
      </div>
      <h2 className="h2">{c ? c.title : "New item"}</h2>
      <ContentForm key={c?.id || "new"} init={c || blankContent()} toast={toast} onSaved={nid => { if (isNew) router.replace(`/admin/insights/${nid}`); }} />
      {c && <div className="card stack" style={{ gap: 6 }}><span className="small muted">Preview — how it looks on a card</span><span className="small muted" style={{ fontWeight: 600 }}>{KINDS.find(k => k[0] === c.kind)?.[1]} · {fmtDate(c.date)}</span><h3 className="h3">{c.title}</h3>{c.policyStatus && <span className="badge orange" style={{ alignSelf: "flex-start" }}>{c.policyStatus}</span>}<p className="small muted">{c.summary}</p></div>}
    </div>
  );
}

/* ---------------- Announcements ---------------- */
export function HomeAdmin({ toast }: { toast: Toast }) {
  const { db, saveAnnouncement, deleteAnnouncement } = useStore();
  const [a, setA] = useState({ text: "", link: "" });
  const show = (id: string, on: boolean) => { db.announcements.forEach(y => { if (y.id !== id && on && y.active) saveAnnouncement({ ...y, active: false }); }); const x = db.announcements.find(y => y.id === id)!; saveAnnouncement({ ...x, active: on }); toast(on ? "Banner is now showing" : "Banner hidden"); };
  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); if (!a.text) return; saveAnnouncement({ id: newId(), text: a.text, link: a.link, active: false }); setA({ text: "", link: "" }); toast("Announcement added — switch it on to show it"); }}>
        <h2 className="h3">New announcement</h2>
        <div className="form-grid">
          <Field label="Text" required value={a.text} onChange={e => setA({ ...a, text: e.target.value })} placeholder="e.g. Registration for the December meetup is open" />
          <Field label="Link (optional)" placeholder="/events" value={a.link} onChange={e => setA({ ...a, link: e.target.value })} hint="A page on this site, e.g. /events, or a full web address" />
        </div>
        <div><button className="btn primary">Add announcement</button></div>
      </form>
      <div className="card stack" style={{ gap: 0 }}>
        <h2 className="h3" style={{ marginBottom: 8 }}>All announcements</h2>
        {db.announcements.length === 0 && <p className="small muted">None yet.</p>}
        {db.announcements.map(x => (
          <div key={x.id} className="switch">
            <span style={{ flex: "1 1 300px" }}>{x.active && <span className="badge green" style={{ marginRight: 6 }}>Showing</span>}{x.text} <span className="small muted">{x.link}</span></span>
            <div className="row" style={{ gap: 6 }}>
              <button className={`btn sm${x.active ? "" : " primary"}`} onClick={() => show(x.id, !x.active)}>{x.active ? "Hide" : "Show"}</button>
              <button className="btn sm danger" onClick={async () => { if (await ask("Delete this announcement?", { ok: "Delete" })) { deleteAnnouncement(x.id); toast("Deleted"); } }}>Delete</button>
            </div>
          </div>))}
      </div>
    </div>
  );
}

/* ---------------- Post checks ---------------- */
export function PostsAdmin({ toast }: { toast: Toast }) {
  const { db, toggleJob, deleteJob, updateRfp } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const m = (s: string) => s.toLowerCase().includes(q.toLowerCase());
  const rfps = db.rfps.filter(r => m(r.title + r.buyer) && (filter === "all" || (filter === "hidden" ? r.hidden : filter === "rfps")));
  const jobs = db.jobs.filter(j => m(j.title + j.company) && (filter === "all" || (filter === "hidden" ? j.hidden : filter === "jobs")));
  return (
    <div className="stack" style={{ gap: 16 }}>
      <ListBar q={q} setQ={setQ} placeholder="Search posts" count={rfps.length + jobs.length} noun="post"
        filters={[["all", "All"], ["rfps", "RFPs", db.rfps.length], ["jobs", "Jobs", db.jobs.length], ["hidden", "Hidden", db.rfps.filter(r => r.hidden).length + db.jobs.filter(j => j.hidden).length]]} filter={filter} setFilter={setFilter} />
      <p className="small muted">{TIP.postChecks}</p>
      {filter !== "jobs" && <><h2 className="h3">RFPs ({rfps.length})</h2>
        {rfps.length === 0 ? <div className="empty">No RFPs match.</div> : <div className="table-wrap"><table>
          <thead><tr><th>Title</th><th>Buyer</th><th>Closes</th><th>Status</th><th><span style={SR}>Actions</span></th></tr></thead>
          <tbody>{rfps.map(r => <tr key={r.id}><td><b>{r.title}</b><div className="small muted">posted by {r.postedBy || "—"}</div></td><td>{r.buyer}</td><td className="nw">{fmtDate(r.closes)}</td><td><span className="badge">{r.status}</span>{r.hidden && <> <span className="badge red">Hidden</span></>}</td>
            <td><button className="btn sm" onClick={() => { updateRfp(r.id, { hidden: !r.hidden }); toast(r.hidden ? "Shown again" : "Hidden from members"); }}>{r.hidden ? "Show" : "Hide"}</button></td></tr>)}</tbody>
        </table></div>}</>}
      {filter !== "rfps" && <><h2 className="h3">Jobs ({jobs.length})</h2>
        {jobs.length === 0 ? <div className="empty">No jobs match.</div> : <div className="table-wrap"><table>
          <thead><tr><th>Title</th><th>Company</th><th>Posted</th><th>Expires</th><th><span style={SR}>Actions</span></th></tr></thead>
          <tbody>{jobs.map(j => <tr key={j.id}><td><b>{j.title}</b>{j.hidden && <> <span className="badge red">Hidden</span></>}<div className="small muted">posted by {j.postedBy || "—"}</div></td><td>{j.company}</td><td className="nw">{fmtDate(j.postedOn)}</td><td className="nw">{fmtDate(new Date(+new Date(j.postedOn) + 30 * 864e5).toISOString().slice(0, 10))}</td>
            <td><div className="row" style={{ gap: 6, flexWrap: "nowrap" }}><button className="btn sm" onClick={() => { toggleJob(j.id); toast(j.hidden ? "Shown again" : "Hidden from members"); }}>{j.hidden ? "Show" : "Hide"}</button><button className="btn sm danger" onClick={async () => { if (await ask(`Remove “${j.title}”?`)) deleteJob(j.id); }}>Remove</button></div></td></tr>)}</tbody>
        </table></div>}</>}
    </div>
  );
}

/* ---------------- Reports ---------------- */
export function Reports() {
  const { db, seatsUsed } = useStore();
  const now = Date.now();
  const active30 = db.users.filter(u => u.lastSignIn && now - +new Date(u.lastSignIn.replace(" ", "T")) < 30 * 864e5).length;
  const due = [...db.orgs.map(o => ({ name: o.name, renewal: o.renewal, kind: "Company" })), ...db.individuals.map(i => ({ name: i.name, renewal: i.renewal, kind: "Individual" }))]
    .filter(x => x.renewal && +new Date(x.renewal) >= now - 864e5 && +new Date(x.renewal) - now < 90 * 864e5).sort((a, b) => a.renewal.localeCompare(b.renewal));
  const byRole = (["main", "editor", "member", "individual", "guest"] as const).map(r => [roleLabel(r), db.users.filter(u => u.role === r).length] as const);
  const kpis: [string, number, string][] = [
    ["Companies in directory", db.orgs.length, "/admin/companies"], ["Companies with domain set", db.orgs.filter(o => o.domain).length, "/admin/companies?filter=nodomain"],
    ["Companies with people signed up", db.orgs.filter(o => seatsUsed(o.id) > 0).length, "/admin/companies"], ["Seats used", db.orgs.reduce((n, o) => n + seatsUsed(o.id), 0), "/admin/people"],
    ["Signed in last 30 days", active30, "/admin/people"], ["Open RFPs", db.rfps.filter(r => r.status === "Open").length, "/admin/posts"], ["Live jobs", db.jobs.filter(j => !j.hidden).length, "/admin/posts"], ["Event registrations", db.events.reduce((n, e) => n + eventCounts(e).confirmed, 0), "/admin/events"],
  ];
  const exportAll = () => downloadCsv("ai-xchange-report.csv", [["Measure", "Value"], ...kpis.map(([l, n]) => [l, n]), [], ["Accounts by type", ""], ...byRole.map(([l, n]) => [l, n]), [], ["Event", "Date", "Registered", "Waitlist", "Attended"], ...db.events.map(e => { const c = eventCounts(e); return [e.title, e.date, c.confirmed, c.waitlist, e.registrations.filter(r => r.attended).length]; })]);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={exportAll}>Export report (CSV)</button></div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>{kpis.map(([l, n, h]) => <Link key={l} href={h} className="card tight stack" style={{ gap: 2, color: "var(--ink)" }}><span className="small muted">{l}</span><span style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontWeight: 800, fontSize: 28 }}>{n}</span></Link>)}</div>
      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card stack" style={{ gap: 8 }}><h2 className="h3">Accounts by type</h2>{byRole.map(([l, n]) => <div key={l} className="row between" style={{ borderTop: "1px solid var(--soft)", paddingTop: 8 }}><span>{l}</span><b>{n}</b></div>)}</div>
        <div className="card stack" style={{ gap: 8 }}><h2 className="h3">Renewals in the next 90 days <Tip text={TIP.renewal} /></h2>{due.length === 0 ? <p className="muted">None.</p> : due.map(d => <div key={d.name} className="row between" style={{ borderTop: "1px solid var(--soft)", paddingTop: 8 }}><span>{d.name} <span className="small muted">{d.kind}</span></span><b>{fmtDate(d.renewal)}</b></div>)}</div>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Event</th><th>Date</th><th>Registered</th><th>Waitlist</th><th>Attended</th></tr></thead>
        <tbody>{[...db.events].sort((a, b) => b.date.localeCompare(a.date)).map(e => { const c = eventCounts(e); return <tr key={e.id}><td><Link href={`/admin/events/${e.id}`}>{e.title}</Link></td><td className="nw">{fmtDate(e.date)}</td><td>{c.confirmed}{e.capacity ? ` / ${e.capacity}` : ""}</td><td>{c.waitlist}</td><td>{e.registrations.filter(r => r.attended).length}</td></tr>; })}</tbody>
      </table></div>
    </div>
  );
}

/* ---------------- Activity log + recently removed ---------------- */
export function ActivityLog({ toast }: { toast: Toast }) {
  const { db, me, restore } = useStore();
  const [q, setQ] = useState("");
  const list = db.log.filter(l => (l.who + " " + l.what).toLowerCase().includes(q.toLowerCase()));
  const pg = usePaged(list, 40);
  const trash = db.trash || [];
  const KIND: Record<string, string> = { user: "Person", org: "Company", event: "Event", content: "Insight", job: "Job", individual: "Individual member" };
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card stack" style={{ gap: 8 }}>
        <h2 className="h3">Recently removed <Tip text={TIP.undo} /></h2>
        {trash.length === 0 ? <p className="small muted">Nothing removed in the last 30 days.</p> : trash.map(t => (
          <div key={t.id} className="row between" style={{ borderTop: "1px solid var(--soft)", paddingTop: 8 }}>
            <span><span className="badge">{KIND[t.kind]}</span> <b style={{ fontWeight: 600 }}>{t.label}</b><div className="small muted">Removed {t.at} by {t.by}</div></span>
            {(isSuper(me) || t.kind !== "org") && <button className="btn sm" onClick={async () => { const r = await restore(t.id); if (r.ok) toast(r.msg || "Restored"); else window.alert(`${r.code}: ${r.msg}`); }}>Restore</button>}
          </div>))}
      </div>
      <ListBar q={q} setQ={setQ} placeholder="Search the log (name, company, action)" count={list.length} noun="entry">
        <button className="btn" onClick={() => downloadCsv("ai-xchange-activity-log.csv", [["When", "Who", "What"], ...list.map(l => [l.at, l.who, l.what])])}>Export</button>
      </ListBar>
      <div className="table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>{pg.rows.map((l, i) => <tr key={i}><td className="nw small">{l.at}</td><td>{l.who}</td><td>{l.what}</td></tr>)}</tbody></table></div>
      <Pager {...pg} />
    </div>
  );
}
