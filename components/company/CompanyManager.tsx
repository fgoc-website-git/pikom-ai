"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore, roleLabel, isSuper, canManageCompany, canEditCompany, MAX_COMPANY_ADMINS, COMPANY_ROLES, eventCounts, type Org, type CompanyProfile, type Role } from "@/lib/store";
import { CAPABILITIES, COMPANY_CATEGORIES, INDUSTRIES_SERVED, STATES, EMPLOYEES } from "@/lib/options";
import { slugify } from "@/lib/directory";
import { Field, Area, SelectOther, MultiOther, ErrorBox, SeatDots, Avatar, fmtDate } from "@/components/ui";

type Toast = (s: string) => void;
type Err = { code: string; msg: string } | null;
const SR = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" };

export const ROLE_HELP: Record<string, string> = {
  main: "Manages seats and roles, edits the company profile, posts jobs and RFPs.",
  editor: "Keeps the company profile, jobs and RFPs up to date.",
  member: "Full member access: directory, contacts, apply, respond, events.",
};

/* ---------------- People & seats ---------------- */
export function CompanyPeople({ org, toast }: { org: Org; toast: Toast }) {
  const { me, orgUsers, removeUser, setCompanyRole, addUserAsAdmin } = useStore();
  const users = orgUsers(org.id);
  const manage = canManageCompany(me, org.id);
  const admins = users.filter(u => u.role === "main").length;
  const [add, setAdd] = useState({ email: "", name: "", role: "member" as Role });
  const [err, setErr] = useState<Err>(null);
  const seatsLeft = org.seatLimit - users.length;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card row between" style={{ gap: 16 }}>
        <div className="stack" style={{ gap: 6 }}>
          <span className="small muted" style={{ fontWeight: 600 }}>{org.domain ? `@${org.domain}` : "Email domain not set yet"}</span>
          <SeatDots used={users.length} limit={org.seatLimit} />
        </div>
        <div className="stack small muted" style={{ gap: 4, maxWidth: 520 }}>
          <span>Up to {org.seatLimit} people. {MAX_COMPANY_ADMINS} company admins at most; any number of content admins within the seats.</span>
          {org.domain && <span>Anyone with an @{org.domain} email can join until the seats are used.</span>}
        </div>
      </div>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="table-wrap"><table>
        <thead><tr><th>Person</th><th>Role</th><th>Activity</th>{manage && <th><span style={SR}>Actions</span></th>}</tr></thead>
        <tbody>{users.length === 0 ? <tr><td colSpan={4} className="muted">Nobody has registered from this company yet.</td></tr> : users.map(u => (
          <tr key={u.id}>
            <td><div className="row" style={{ flexWrap: "nowrap", gap: 10 }}><Avatar name={u.name} round /><div style={{ minWidth: 0 }}><b>{u.name}</b>{u.staff && <span className="badge dark" style={{ marginLeft: 6 }}>{u.staff === "super" ? "Super admin" : "PIKOM admin"}</span>}<div className="small muted">{u.jobTitle || "—"}</div><div className="small" style={{ wordBreak: "break-all" }}>{u.email}</div></div></div></td>
            <td style={{ minWidth: 190 }}>
              {manage ? <label><span style={SR}>Role for {u.name}</span>
                <select className="select" value={u.role} onChange={e => { setErr(null); const r = setCompanyRole(u.id, e.target.value as Role); if (!r.ok) setErr(r); else toast(r.msg || "Role updated"); }}>
                  {COMPANY_ROLES.map(r => <option key={r} value={r} disabled={r === "main" && u.role !== "main" && admins >= MAX_COMPANY_ADMINS}>{roleLabel(r)}</option>)}
                </select></label>
                : <span className={`badge ${u.role === "main" ? "blue" : u.role === "editor" ? "green" : ""}`}>{roleLabel(u.role)}</span>}
            </td>
            <td className="small"><div>Joined {fmtDate(u.createdOn)}</div><div className="muted">Last sign-in {u.lastSignIn || "—"}</div></td>
            {manage && <td>{u.id !== me!.id && !(u.staff && !isSuper(me)) && <button className="btn sm danger" onClick={() => { if (confirm(`Remove ${u.name}? They lose access and the seat is freed.`)) { setErr(null); removeUser(u.id); toast("Removed — seat freed"); } }}>Remove</button>}</td>}
          </tr>))}
        </tbody>
      </table></div>
      {manage && (seatsLeft > 0 ? (
        <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addUserAsAdmin(org.id, add.email, add.name, add.role); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setAdd({ email: "", name: "", role: "member" }); }}>
          <h3 className="h3">Add a colleague <span className="small muted" style={{ fontWeight: 400 }}>· {seatsLeft} seat{seatsLeft === 1 ? "" : "s"} left</span></h3>
          <div className="form-grid">
            <Field label="Work email" type="email" required placeholder={`name@${org.domain || "company.com.my"}`} value={add.email} onChange={e => setAdd({ ...add, email: e.target.value })} />
            <Field label="Name" value={add.name} onChange={e => setAdd({ ...add, name: e.target.value })} />
            <label className="field">Role<select className="select" value={add.role} onChange={e => setAdd({ ...add, role: e.target.value as Role })}>{COMPANY_ROLES.map(r => <option key={r} value={r} disabled={r === "main" && admins >= MAX_COMPANY_ADMINS}>{roleLabel(r)}</option>)}</select><span className="hint">{ROLE_HELP[add.role]}</span></label>
          </div>
          <div><button className="btn primary" disabled={!org.domain}>Add colleague</button>{!org.domain && <span className="small muted" style={{ marginLeft: 10 }}>Set the email domain first.</span>}</div>
          <p className="small muted">They get the temporary password <b>demo1234</b> and should change it after signing in.</p>
        </form>
      ) : <div className="alert warn">All {org.seatLimit} seats are used. Remove someone to add a colleague. For more seats, contact PIKOM.</div>)}
      <div className="card stack" style={{ gap: 6 }}>
        <h3 className="h3" style={{ fontSize: 15 }}>Company roles</h3>
        {COMPANY_ROLES.map(r => <p key={r} className="small"><b>{roleLabel(r)}</b> — {ROLE_HELP[r]}</p>)}
      </div>
    </div>
  );
}

/* ---------------- Company profile ---------------- */
export function CompanyProfileForm({ org, toast }: { org: Org; toast: Toast }) {
  const { me, updateOrgProfile } = useStore();
  const [p, setP] = useState<CompanyProfile>(org.profile);
  const canEdit = canEditCompany(me, org.id);
  if (!canEdit) return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="alert info">Company admins and content admins edit this profile. This is how other members see it.</div>
      <dl className="kv">
        <dt>Company</dt><dd>{org.name}</dd><dt>Category</dt><dd>{p.category || "—"}</dd><dt>About</dt><dd>{p.about || "—"}</dd>
        <dt>Capabilities</dt><dd>{p.capabilities.join(", ") || "—"}</dd><dt>Industries served</dt><dd>{p.industries.join(", ") || "—"}</dd>
        <dt>Website</dt><dd>{p.website || "—"}</dd><dt>Location</dt><dd>{p.state || "—"}</dd><dt>Size</dt><dd>{p.employees || "—"}</dd>
      </dl>
      <Link className="btn" style={{ alignSelf: "flex-start" }} href={`/members/${slugify(org.name)}`}>View public profile</Link>
    </div>
  );
  const done = [p.about, p.website, p.category, p.capabilities.length, p.industries.length, p.state, p.employees].filter(Boolean).length;
  return (
    <form className="card stack" style={{ gap: 18 }} onSubmit={e => { e.preventDefault(); updateOrgProfile(org.id, p); toast("Company profile saved"); }}>
      <div className="row between">
        <div className="stack" style={{ gap: 6, minWidth: 240 }}><span className="small" style={{ fontWeight: 600 }}>Profile {Math.round(done / 7 * 100)}% complete</span><div className="bar" style={{ width: 240 }}><i style={{ width: `${done / 7 * 100}%`, background: "var(--green)" }} /></div></div>
        <Link href={`/members/${slugify(org.name)}`}>View public profile</Link>
      </div>
      <div className="form-grid">
        <Field label="Company name" value={org.name} readOnly hint="As registered with PIKOM. Contact PIKOM to change." />
        <Field label="Website" type="url" value={p.website} onChange={e => setP({ ...p, website: e.target.value })} />
        <SelectOther label="Main category" options={COMPANY_CATEGORIES} value={p.category} onChange={v => setP({ ...p, category: v })} />
        <SelectOther label="Headquarters" options={STATES} value={p.state} onChange={v => setP({ ...p, state: v })} />
        <SelectOther label="Number of employees" options={EMPLOYEES} value={p.employees} onChange={v => setP({ ...p, employees: v })} />
        <Field label="General enquiries phone" type="tel" value={p.phone} onChange={e => setP({ ...p, phone: e.target.value })} />
        <Field label="Company LinkedIn page" type="url" placeholder="https://www.linkedin.com/company/…" value={p.linkedin} onChange={e => setP({ ...p, linkedin: e.target.value })} />
      </div>
      <Area label="What does your company do? (shown in the directory)" maxLength={500} value={p.about} onChange={e => setP({ ...p, about: e.target.value })} hint={`${p.about.length}/500`} />
      <MultiOther legend="AI capabilities" max={5} options={CAPABILITIES} value={p.capabilities} onChange={v => setP({ ...p, capabilities: v })} />
      <MultiOther legend="Industries you serve" options={INDUSTRIES_SERVED} value={p.industries} onChange={v => setP({ ...p, industries: v })} />
      <div><button className="btn primary">Save company profile</button></div>
    </form>
  );
}

/* ---------------- Posts (jobs + RFPs) ---------------- */
export function CompanyPosts({ org, toast }: { org: Org; toast: Toast }) {
  const { db, me, deleteJob, updateRfp } = useStore();
  const edit = canEditCompany(me, org.id);
  const jobs = db.jobs.filter(j => j.orgId === org.id);
  const rfps = db.rfps.filter(r => r.orgId === org.id);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row between"><h2 className="h3">RFPs ({rfps.length})</h2>{edit && me!.orgId === org.id && <Link className="btn sm" href="/opportunities">+ Post an RFP</Link>}</div>
      {rfps.length === 0 ? <div className="empty">No RFPs posted.</div> : rfps.map(r => (
        <div key={r.id} className="card tight row between">
          <div className="stack" style={{ gap: 2 }}><b>{r.title}</b><span className="small muted">Closes {fmtDate(r.closes)} · posted by {r.postedBy || "—"}{r.hidden ? " · hidden by PIKOM" : ""}</span></div>
          {edit ? <label className="row small" style={{ gap: 8, flexWrap: "nowrap" }}>Status<select className="select" style={{ width: "auto" }} value={r.status} onChange={e => { updateRfp(r.id, { status: e.target.value as "Open" }); toast("RFP updated"); }}><option>Open</option><option>Closed</option><option>Awarded</option></select></label> : <span className="badge">{r.status}</span>}
        </div>))}
      <div className="row between" style={{ marginTop: 12 }}><h2 className="h3">Jobs ({jobs.length})</h2>{edit && me!.orgId === org.id && <Link className="btn sm accent" href="/opportunities?tab=jobs&post=1">+ Post a job</Link>}</div>
      {jobs.length === 0 ? <div className="empty">No job posts.</div> : jobs.map(j => (
        <div key={j.id} className="card tight row between">
          <div className="stack" style={{ gap: 2 }}><b>{j.title}</b><span className="small muted">{j.location} · {j.mode} · posted {fmtDate(j.postedOn)}{j.postedBy ? ` by ${j.postedBy}` : ""}{j.hidden ? " · hidden by PIKOM" : ""}</span></div>
          <div className="row">{j.linkedinUrl && <a className="btn sm" href={j.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn post</a>}{edit && <button className="btn sm danger" onClick={() => { if (confirm(`Close “${j.title}”?`)) { deleteJob(j.id); toast("Job closed"); } }}>Close post</button>}</div>
        </div>))}
    </div>
  );
}

/* ---------------- Event sign-ups ---------------- */
export function CompanyEvents({ org }: { org: Org }) {
  const { db } = useStore();
  const people = db.users.filter(u => u.orgId === org.id);
  const rows = db.events.map(e => ({ e, who: e.registrations.filter(r => r.status !== "cancelled" && people.some(p => p.id === r.userId)).map(r => ({ r, u: people.find(p => p.id === r.userId)! })) })).filter(x => x.who.length);
  if (!rows.length) return <div className="empty">Nobody from {org.name} has registered for an event yet. <Link href="/events">See events</Link></div>;
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>Event</th><th>Date</th><th>Who</th></tr></thead>
      <tbody>{rows.sort((a, b) => b.e.date.localeCompare(a.e.date)).map(({ e, who }) => (
        <tr key={e.id}><td><b>{e.title}</b><div className="small muted">{e.type} · {eventCounts(e).confirmed}{e.capacity ? ` / ${e.capacity}` : ""} registered{e.perCompany ? ` · max ${e.perCompany} per company` : ""}</div></td><td className="nw">{fmtDate(e.date)}</td>
          <td>{who.map(({ r, u }) => <div key={u.id} className="small">{u.name} <span className={`badge ${r.status === "confirmed" ? "green" : "orange"}`}>{r.status === "confirmed" ? "Confirmed" : "Waitlist"}</span></div>)}</td></tr>))}
      </tbody>
    </table></div>
  );
}

/* ---------------- Settings (super admin only) ---------------- */
export function CompanySettings({ org, toast, onRemoved }: { org: Org; toast: Toast; onRemoved: () => void }) {
  const { updateOrg, removeOrg, setMainHolder, orgUsers } = useStore();
  const [dom, setDom] = useState(org.domain);
  const [adminEmail, setAdminEmail] = useState(org.mainEmail);
  const [meta, setMeta] = useState({ name: org.name, pikomNo: org.pikomNo, renewal: org.renewal });
  const [err, setErr] = useState<Err>(null);
  const n = orgUsers(org.id).length;
  const save = (r: { ok: boolean; code?: string; msg?: string }, okMsg: string) => { if (!r.ok) setErr(r as Err); else { setErr(null); toast(r.msg || okMsg); } };
  return (
    <div className="stack" style={{ gap: 16 }}>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="grid2">
        <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); save(updateOrg(org.id, { domain: dom }), "Domain saved"); }}>
          <h3 className="h3">Email domain</h3>
          <Field label="Company email domain" value={dom} onChange={e => setDom(e.target.value)} placeholder="company.com.my" hint={org.domain ? "Changing this does not move existing accounts." : "Needed before anyone from this company can register."} />
          <div><button className="btn primary">Save domain</button></div>
        </form>
        <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); save(setMainHolder(org.id, adminEmail), "Saved"); }}>
          <h3 className="h3">First company admin</h3>
          <Field label="Admin's work email" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder={`name@${org.domain || "company.com.my"}`} hint="The person PIKOM names. If they haven't registered, they become admin when they do." />
          <div><button className="btn primary">Save admin</button></div>
        </form>
      </div>
      <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); save(updateOrg(org.id, meta), "Membership details saved"); }}>
        <h3 className="h3">PIKOM membership</h3>
        <div className="form-grid">
          <Field label="Registered company name" value={meta.name} onChange={e => setMeta({ ...meta, name: e.target.value })} />
          <Field label="PIKOM membership no." value={meta.pikomNo} onChange={e => setMeta({ ...meta, pikomNo: e.target.value })} />
          <Field label="Renewal date" type="date" value={meta.renewal} onChange={e => setMeta({ ...meta, renewal: e.target.value })} />
        </div>
        <div><button className="btn primary">Save membership details</button></div>
      </form>
      <div className="card stack" style={{ gap: 12 }}>
        <h3 className="h3">Access</h3>
        <p className="small muted">Pause access while a renewal is pending: nobody from this company can sign in until you restore it. Removing the company deletes its {n} account{n === 1 ? "" : "s"} and its job posts.</p>
        <div className="row">
          {org.status === "active"
            ? <button className="btn" onClick={() => save(updateOrg(org.id, { status: "suspended" }), "Access paused")}>Pause access</button>
            : <button className="btn primary" onClick={() => save(updateOrg(org.id, { status: "active" }), "Access restored")}>Restore access</button>}
          <button className="btn danger" onClick={() => { if (confirm(`Remove ${org.name} from AI Xchange? It leaves the directory and all ${n} accounts are deleted.`)) { removeOrg(org.id); toast("Company removed"); onRemoved(); } }}>Remove company</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Tabbed manager ---------------- */
type MTab = "people" | "profile" | "posts" | "events" | "settings";
export function CompanyManager({ org, toast, onRemoved, initial }: { org: Org; toast: Toast; onRemoved?: () => void; initial?: MTab }) {
  const { me } = useStore();
  const sup = isSuper(me), admin = canManageCompany(me, org.id), editor = canEditCompany(me, org.id);
  const tabs: [MTab, string][] = [
    ...(admin ? [["people", "People & seats"]] as [MTab, string][] : []),
    ["profile", "Company profile"],
    ...(editor ? [["posts", "Jobs & RFPs"]] as [MTab, string][] : []),
    ...(admin ? [["events", "Event sign-ups"]] as [MTab, string][] : []),
    ...(sup ? [["settings", "Domain & membership"]] as [MTab, string][] : []),
  ];
  const [tab, setTab] = useState<MTab>(tabs.some(t => t[0] === initial) ? initial! : tabs[0][0]);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "people" && <CompanyPeople org={org} toast={toast} />}
      {tab === "profile" && <CompanyProfileForm key={org.id} org={org} toast={toast} />}
      {tab === "posts" && <CompanyPosts org={org} toast={toast} />}
      {tab === "events" && <CompanyEvents org={org} />}
      {tab === "settings" && <CompanySettings key={org.id + org.domain + org.mainEmail} org={org} toast={toast} onRemoved={onRemoved || (() => {})} />}
    </div>
  );
}
