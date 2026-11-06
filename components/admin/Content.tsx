"use client";
import { useState } from "react";
import { useStore, eventCounts, newId, today, roleLabel, type PEvent, type Content, type ContentKind, type EventType } from "@/lib/store";
import { companies } from "@/lib/directory";
import { Field, Area, fmtDate } from "@/components/ui";

type Toast = (s: string) => void;
const SR = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" };
const downloadCsv = (name: string, rows: string[][]) => {
  const url = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

/* ---------------- Events ---------------- */
const blankEvent = (): PEvent => ({ id: "", title: "", type: "Physical", date: "", time: "", venue: "", link: "", capacity: 100, perCompany: null, audience: "members", price: "Free for members", description: "", regClose: "", status: "Draft", materials: "", registrations: [] });

function EventForm({ init, toast, done }: { init: PEvent; toast: Toast; done: () => void }) {
  const { saveEvent } = useStore();
  const [e, setE] = useState<PEvent>(init);
  const set = (p: Partial<PEvent>) => setE({ ...e, ...p });
  return (
    <form className="card hl stack" style={{ gap: 16 }} onSubmit={ev => { ev.preventDefault(); saveEvent({ ...e, id: e.id || newId(), regClose: e.regClose || e.date }); toast(e.status === "Published" ? "Event published" : "Event saved as draft"); done(); }}>
      <h2 className="h3">{init.id ? "Edit event" : "New event"}</h2>
      <div className="form-grid">
        <Field label="Event title" required value={e.title} onChange={x => set({ title: x.target.value })} />
        <fieldset><legend>Format</legend><div className="chips">{(["Online", "Physical", "Hybrid"] as EventType[]).map(t => <label key={t} className={`chip${e.type === t ? " on" : ""}`}><input type="radio" name="etype" checked={e.type === t} onChange={() => set({ type: t, capacity: t === "Online" ? null : e.capacity ?? 100 })} />{t}</label>)}</div></fieldset>
        <Field label="Date" type="date" required value={e.date} onChange={x => set({ date: x.target.value })} />
        <Field label="Time" placeholder="18:30 – 21:00" required value={e.time} onChange={x => set({ time: x.target.value })} />
        {e.type !== "Online" && <Field label="Venue" required value={e.venue} onChange={x => set({ venue: x.target.value })} />}
        {e.type !== "Physical" && <Field label="Online joining link" type="url" required value={e.link} onChange={x => set({ link: x.target.value })} hint="Only shown to people who registered" />}
        <Field label={e.type === "Online" ? "Seat limit (optional)" : "Capacity (seats)"} type="number" min={1} value={e.capacity ?? ""} onChange={x => set({ capacity: x.target.value ? Number(x.target.value) : null })} hint="When full, new sign-ups go to a waitlist" />
        <Field label="Max per company (optional)" type="number" min={1} value={e.perCompany ?? ""} onChange={x => set({ perCompany: x.target.value ? Number(x.target.value) : null })} />
        <label className="field">Who can register<select className="select" value={e.audience} onChange={x => set({ audience: x.target.value as "members" })}><option value="members">PIKOM members only</option><option value="all">Members and guests</option></select></label>
        <Field label="Price note" value={e.price} onChange={x => set({ price: x.target.value })} hint="Payment is handled outside the site" />
        <Field label="Registration closes" type="date" value={e.regClose} onChange={x => set({ regClose: x.target.value })} hint="Defaults to the event date" />
        <label className="field">Status<select className="select" value={e.status} onChange={x => set({ status: x.target.value as "Draft" })}><option>Draft</option><option>Published</option><option>Cancelled</option></select></label>
      </div>
      <Area label="Description" required value={e.description} onChange={x => set({ description: x.target.value })} />
      <Field label="After the event: slides / recording note (members only)" value={e.materials} onChange={x => set({ materials: x.target.value })} />
      <div className="row"><button className="btn primary">Save event</button><button type="button" className="btn" onClick={done}>Cancel</button></div>
    </form>
  );
}

function Attendees({ e }: { e: PEvent }) {
  const { db, markAttended } = useStore();
  const rows = e.registrations.filter(r => r.status !== "cancelled").map(r => ({ r, u: db.users.find(x => x.id === r.userId) }));
  const company = (orgId: string | null | undefined, fallback?: string) => db.orgs.find(o => o.id === orgId)?.name || fallback || "Individual";
  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row between"><h3 className="h3">Attendees — {e.title}</h3>
        <button className="btn sm" onClick={() => downloadCsv(`${e.title}-attendees.csv`, [["Name", "Email", "Company", "Role", "Status", "Registered", "Attended"], ...rows.map(({ r, u }) => [u?.name || "", u?.email || "", company(u?.orgId, u?.company), u ? roleLabel(u.role) : "", r.status, r.at, r.attended ? "Yes" : ""])])}>Export to Excel (CSV)</button></div>
      {rows.length === 0 ? <p className="muted">No registrations yet.</p> : <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Company</th><th>Status</th><th>Registered</th><th>Attended</th></tr></thead>
        <tbody>{rows.map(({ r, u }) => <tr key={r.userId}><td><b>{u?.name}</b><div className="small muted">{u?.email}</div></td><td>{company(u?.orgId, u?.company)}</td><td><span className={`badge ${r.status === "confirmed" ? "green" : "orange"}`}>{r.status === "confirmed" ? "Confirmed" : "Waitlist"}</span></td><td>{r.at}</td>
          <td><input type="checkbox" aria-label={`${u?.name} attended`} checked={!!r.attended} disabled={r.status !== "confirmed"} onChange={x => markAttended(e.id, r.userId, x.target.checked)} /></td></tr>)}</tbody>
      </table></div>}
    </div>
  );
}

export function EventsAdmin({ toast }: { toast: Toast }) {
  const { db, deleteEvent } = useStore();
  const [edit, setEdit] = useState<PEvent | null>(null);
  const [view, setView] = useState<string | null>(null);
  const list = [...db.events].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between"><p className="muted">Create online, physical or hybrid events. Members register on the Events page.</p>{!edit && <button className="btn primary" onClick={() => setEdit(blankEvent())}>+ New event</button>}</div>
      {edit && <EventForm init={edit} toast={toast} done={() => setEdit(null)} />}
      <div className="table-wrap"><table>
        <thead><tr><th>Event</th><th>Date</th><th>Format</th><th>Registered</th><th>Waitlist</th><th>Status</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{list.map(e => { const c = eventCounts(e); return (
          <tr key={e.id}><td><b>{e.title}</b><div className="small muted">{e.audience === "members" ? "Members only" : "Members and guests"}{e.perCompany ? ` · max ${e.perCompany}/company` : ""}</div></td><td>{fmtDate(e.date)}{e.date < today() && <div className="small muted">Past</div>}</td><td>{e.type}</td>
            <td>{c.confirmed}{e.capacity ? ` / ${e.capacity}` : ""}</td><td>{c.waitlist || "—"}</td>
            <td><span className={`badge ${e.status === "Published" ? "green" : e.status === "Cancelled" ? "red" : ""}`}>{e.status}</span></td>
            <td><div className="row" style={{ gap: 6, flexWrap: "nowrap" }}><button className="btn sm" onClick={() => setView(view === e.id ? null : e.id)}>Attendees</button><button className="btn sm" onClick={() => setEdit(e)}>Edit</button><button className="btn sm danger" onClick={() => { if (confirm("Delete this event?")) { deleteEvent(e.id); toast("Event deleted"); } }}>Delete</button></div></td></tr>); })}</tbody>
      </table></div>
      {view && db.events.find(e => e.id === view) && <Attendees e={db.events.find(e => e.id === view)!} />}
    </div>
  );
}

/* ---------------- Insights ---------------- */
const KINDS: [ContentKind, string][] = [["policy", "Policy & governance"], ["research", "PIKOM research"], ["news", "News"]];
const blankContent = (): Content => ({ id: "", kind: "policy", title: "", summary: "", body: "", source: "PIKOM", url: "", file: "", date: today(), policyStatus: "", featured: false, published: false });

function ContentForm({ init, toast, done }: { init: Content; toast: Toast; done: () => void }) {
  const { saveContent } = useStore();
  const [c, setC] = useState<Content>(init);
  const set = (p: Partial<Content>) => setC({ ...c, ...p });
  return (
    <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); saveContent({ ...c, id: c.id || newId() }); toast(c.published ? "Published" : "Saved as draft"); done(); }}>
      <h2 className="h3">{init.id ? "Edit item" : "New item"}</h2>
      <div className="form-grid">
        <label className="field">Section<select className="select" value={c.kind} onChange={e => set({ kind: e.target.value as ContentKind })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <Field label="Title" required value={c.title} onChange={e => set({ title: e.target.value })} />
        <Field label="Source" value={c.source} onChange={e => set({ source: e.target.value })} hint="e.g. PIKOM, NAIO, Bank Negara" />
        <Field label="Date" type="date" value={c.date} onChange={e => set({ date: e.target.value })} />
        {c.kind === "policy" && <Field label="Policy status" placeholder="In consultation, Active, Passed…" value={c.policyStatus} onChange={e => set({ policyStatus: e.target.value })} />}
        <Field label="Link (optional)" type="url" value={c.url} onChange={e => set({ url: e.target.value })} />
        <label className="field">Attach PDF (optional)<input className="input" style={{ paddingTop: 9 }} type="file" accept="application/pdf" onChange={e => set({ file: e.target.files?.[0]?.name || "" })} />{c.file && <span className="hint">Attached: {c.file}</span>}</label>
      </div>
      <Area label="Summary (shown on cards)" required maxLength={400} value={c.summary} onChange={e => set({ summary: e.target.value })} />
      <Area label="More detail (optional)" value={c.body} onChange={e => set({ body: e.target.value })} />
      <div className="row">
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={c.featured} onChange={e => set({ featured: e.target.checked })} />Feature on the home page</label>
        <label className="row" style={{ gap: 8 }}><input type="checkbox" checked={c.published} onChange={e => set({ published: e.target.checked })} />Published</label>
      </div>
      <div className="row"><button className="btn primary">Save</button><button type="button" className="btn" onClick={done}>Cancel</button></div>
    </form>
  );
}

export function InsightsAdmin({ toast }: { toast: Toast }) {
  const { db, deleteContent, saveContent } = useStore();
  const [edit, setEdit] = useState<Content | null>(null);
  const [kind, setKind] = useState<ContentKind | "">("");
  const list = db.content.filter(c => !kind || c.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <select className="select" style={{ width: "auto" }} aria-label="Section" value={kind} onChange={e => setKind(e.target.value as ContentKind)}><option value="">All sections</option>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        {!edit && <button className="btn primary" onClick={() => setEdit(blankContent())}>+ New item</button>}
      </div>
      {edit && <ContentForm init={edit} toast={toast} done={() => setEdit(null)} />}
      <div className="table-wrap"><table>
        <thead><tr><th>Title</th><th>Section</th><th>Date</th><th>Home</th><th>Status</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{list.map(c => <tr key={c.id}><td><b>{c.title}</b><div className="small muted">{c.source}{c.policyStatus ? ` · ${c.policyStatus}` : ""}</div></td><td>{KINDS.find(k => k[0] === c.kind)?.[1]}</td><td>{fmtDate(c.date)}</td>
          <td><input type="checkbox" aria-label="Feature on home" checked={c.featured} onChange={e => saveContent({ ...c, featured: e.target.checked })} /></td>
          <td><span className={`badge ${c.published ? "green" : ""}`}>{c.published ? "Published" : "Draft"}</span></td>
          <td><div className="row" style={{ gap: 6, flexWrap: "nowrap" }}><button className="btn sm" onClick={() => setEdit(c)}>Edit</button><button className="btn sm danger" onClick={() => { if (confirm("Delete?")) { deleteContent(c.id); toast("Deleted"); } }}>Delete</button></div></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

/* ---------------- Announcements + spotlight ---------------- */
export function HomeAdmin({ toast }: { toast: Toast }) {
  const { db, saveAnnouncement, deleteAnnouncement, setSpotlight } = useStore();
  const [a, setA] = useState({ text: "", link: "" });
  const [q, setQ] = useState("");
  const all = companies(db);
  const pick = (id: string) => { const s = db.spotlight.includes(id) ? db.spotlight.filter(x => x !== id) : [...db.spotlight, id]; if (s.length > 4) return toast("Spotlight shows up to 4 companies"); setSpotlight(s); };
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="card stack" style={{ gap: 12 }}>
        <h2 className="h3">Announcement banner</h2>
        <p className="small muted">Shown under the menu on every page. Turn on one at a time.</p>
        {db.announcements.map(x => (
          <div key={x.id} className="row between" style={{ borderTop: "1px solid var(--soft)", paddingTop: 10 }}>
            <span style={{ flex: "1 1 300px" }}>{x.text} <span className="small muted">{x.link}</span></span>
            <div className="row" style={{ gap: 6 }}>
              <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={x.active} onChange={e => { db.announcements.forEach(y => y.id !== x.id && e.target.checked && y.active && saveAnnouncement({ ...y, active: false })); saveAnnouncement({ ...x, active: e.target.checked }); }} />Showing</label>
              <button className="btn sm danger" onClick={() => deleteAnnouncement(x.id)}>Delete</button>
            </div>
          </div>))}
        <form className="row" style={{ alignItems: "flex-end" }} onSubmit={e => { e.preventDefault(); if (!a.text) return; saveAnnouncement({ id: newId(), text: a.text, link: a.link, active: false }); setA({ text: "", link: "" }); toast("Announcement added"); }}>
          <div style={{ flex: "2 1 300px" }}><Field label="New announcement" value={a.text} onChange={e => setA({ ...a, text: e.target.value })} /></div>
          <div style={{ flex: "1 1 200px" }}><Field label="Link (optional)" placeholder="/events" value={a.link} onChange={e => setA({ ...a, link: e.target.value })} /></div>
          <button className="btn">Add</button>
        </form>
      </div>
      <div className="card stack" style={{ gap: 12 }}>
        <div className="row between"><h2 className="h3">Member spotlight ({db.spotlight.length}/4)</h2><input className="input" style={{ maxWidth: 260 }} aria-label="Search companies" placeholder="Search companies" value={q} onChange={e => setQ(e.target.value)} /></div>
        <p className="small muted">Pick up to 4 companies for the home page this month. Choose members with complete profiles.</p>
        <div className="chips">{all.filter(c => db.spotlight.includes(c.org.id) || !q || c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40).map(c => (
          <label key={c.org.id} className={`chip${db.spotlight.includes(c.org.id) ? " on" : ""}`}><input type="checkbox" checked={db.spotlight.includes(c.org.id)} onChange={() => pick(c.org.id)} />{c.name}</label>))}</div>
      </div>
    </div>
  );
}

/* ---------------- Post checks ---------------- */
export function PostsAdmin({ toast }: { toast: Toast }) {
  const { db, toggleJob, deleteJob, updateRfp } = useStore();
  return (
    <div className="stack" style={{ gap: 16 }}>
      <p className="muted">Everything members have posted. Hide anything inappropriate; jobs close automatically after 30 days.</p>
      <h2 className="h3">RFPs</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Title</th><th>Buyer</th><th>Closes</th><th>Status</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{db.rfps.map(r => <tr key={r.id}><td><b>{r.title}</b></td><td>{r.buyer}</td><td>{fmtDate(r.closes)}</td><td><span className="badge">{r.status}</span>{r.hidden && <span className="badge red">Hidden</span>}</td>
          <td><button className="btn sm" onClick={() => { updateRfp(r.id, { hidden: !r.hidden }); toast(r.hidden ? "Shown" : "Hidden"); }}>{r.hidden ? "Show" : "Hide"}</button></td></tr>)}</tbody>
      </table></div>
      <h2 className="h3">Jobs</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Title</th><th>Company</th><th>Posted</th><th>Expires</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{db.jobs.map(j => <tr key={j.id}><td><b>{j.title}</b>{j.hidden && <> <span className="badge red">Hidden</span></>}</td><td>{j.company}</td><td>{fmtDate(j.postedOn)}</td><td>{fmtDate(new Date(+new Date(j.postedOn) + 30 * 864e5).toISOString().slice(0, 10))}</td>
          <td><div className="row" style={{ gap: 6, flexWrap: "nowrap" }}><button className="btn sm" onClick={() => toggleJob(j.id)}>{j.hidden ? "Show" : "Hide"}</button><button className="btn sm danger" onClick={() => { deleteJob(j.id); toast("Removed"); }}>Remove</button></div></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

/* ---------------- Reports ---------------- */
export function Reports() {
  const { db, seatsUsed } = useStore();
  const now = Date.now();
  const active30 = db.users.filter(u => u.lastSignIn && now - +new Date(u.lastSignIn.replace(" ", "T")) < 30 * 864e5).length;
  const due = [...db.orgs.map(o => ({ name: o.name, renewal: o.renewal, kind: "Company" })), ...db.individuals.map(i => ({ name: i.name, renewal: i.renewal, kind: "Individual" }))]
    .filter(x => x.renewal && +new Date(x.renewal) - now < 90 * 864e5).sort((a, b) => a.renewal.localeCompare(b.renewal));
  const byRole = (["main", "member", "individual", "guest"] as const).map(r => [roleLabel(r), db.users.filter(u => u.role === r).length] as const);
  const kpis = [
    ["Companies in directory", db.orgs.length], ["Companies with domain set", db.orgs.filter(o => o.domain).length],
    ["Companies with people signed in", db.orgs.filter(o => seatsUsed(o.id) > 0).length], ["Seats used", db.orgs.reduce((n, o) => n + seatsUsed(o.id), 0)],
    ["Signed in last 30 days", active30], ["Open RFPs", db.rfps.filter(r => r.status === "Open").length], ["Live jobs", db.jobs.filter(j => !j.hidden).length], ["Event registrations", db.events.reduce((n, e) => n + eventCounts(e).confirmed, 0)],
  ];
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>{kpis.map(([l, n]) => <div key={l as string} className="card tight stack" style={{ gap: 2 }}><span className="small muted">{l}</span><span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 28 }}>{n}</span></div>)}</div>
      <div className="grid2" style={{ alignItems: "start" }}>
        <div className="card stack" style={{ gap: 8 }}><h2 className="h3">Accounts by type</h2>{byRole.map(([l, n]) => <div key={l} className="row between" style={{ borderTop: "1px solid var(--soft)", paddingTop: 8 }}><span>{l}</span><b>{n}</b></div>)}</div>
        <div className="card stack" style={{ gap: 8 }}><h2 className="h3">Renewals in the next 90 days</h2>{due.length === 0 ? <p className="muted">None.</p> : due.map(d => <div key={d.name} className="row between" style={{ borderTop: "1px solid var(--soft)", paddingTop: 8 }}><span>{d.name} <span className="small muted">{d.kind}</span></span><b>{fmtDate(d.renewal)}</b></div>)}</div>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>Event</th><th>Date</th><th>Registered</th><th>Waitlist</th><th>Attended</th></tr></thead>
        <tbody>{[...db.events].sort((a, b) => b.date.localeCompare(a.date)).map(e => { const c = eventCounts(e); return <tr key={e.id}><td>{e.title}</td><td>{fmtDate(e.date)}</td><td>{c.confirmed}{e.capacity ? ` / ${e.capacity}` : ""}</td><td>{c.waitlist}</td><td>{e.registrations.filter(r => r.attended).length}</td></tr>; })}</tbody>
      </table></div>
    </div>
  );
}
