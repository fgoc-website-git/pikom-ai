"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore, roleLabel, type CompanyProfile, today } from "@/lib/store";
import { EventCard } from "@/components/EventCard";
import { CAPABILITIES, COMPANY_CATEGORIES, INDUSTRIES_SERVED, STATES, EMPLOYEES, INTERESTS } from "@/lib/options";
import { slugify } from "@/lib/directory";
import { MembersOnly, Field, Area, SelectOther, MultiOther, ErrorBox, SeatDots, Avatar, useToast, fmtDate } from "@/components/ui";

type Tab = "profile" | "company" | "team" | "events" | "jobs" | "password";

export default function Account() { return <MembersOnly><AccountInner /></MembersOnly>; }

function AccountInner() {
  const { me, myOrg, db } = useStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [welcome, setWelcome] = useState(false);
  const toast = useToast();
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("welcome")) setWelcome(true); const t = p.get("tab") as Tab; if (t) setTab(t); }, []);
  if (!me) return null;
  const isOrg = !!myOrg;
  const paying = ["main", "member", "individual"].includes(me.role);
  const tabs: [Tab, string][] = [["profile", "My profile"], ...(isOrg ? [["company", "Company profile"], ["team", "Team seats"]] as [Tab, string][] : []), ["events", "My events"], ...(paying ? [["jobs", "My posts"]] as [Tab, string][] : []), ["password", "Password"]];
  const renewal = myOrg?.renewal || db.individuals.find(i => i.email === me.email)?.renewal;

  return (
    <div className="wrap page-head">
      {welcome && <div className="alert ok" style={{ marginBottom: 16 }}>Welcome to AI Xchange, {me.name.split(" ")[0]}. {me.role === "main" ? "As main account holder, start by completing your company profile — it's what other members see in the directory." : "Add a few details so other members know who you are."}</div>}
      <div className="row between" style={{ marginBottom: 20 }}>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <Avatar name={me.name} round lg />
          <div className="stack" style={{ gap: 2 }}>
            <h1 className="h2">{me.name}</h1>
            <span className="muted">{me.jobTitle || "—"}{myOrg ? ` · ${myOrg.name}` : ""}</span>
            <span className="row" style={{ gap: 6 }}><span className={`badge ${me.role === "main" ? "blue" : "green"}`}>{roleLabel(me.role)}</span>{myOrg && <span className="badge">{myOrg.type}</span>}{me.role === "individual" && <span className="badge">Individual Member</span>}{me.role === "guest" && <span className="badge">Limited access</span>}</span>
          </div>
        </div>
        {renewal && <div className="alert warn small">PIKOM membership renews <b>{fmtDate(renewal)}</b>. Renewals are handled by the PIKOM secretariat.</div>}
      </div>

      {me.role === "guest" && <div className="alert info" style={{ marginBottom: 16 }}>You have a free guest account. To see member details, contacts, RFPs and jobs in full, your company needs to join PIKOM — or join as an Individual Member. <Link href="/membership">How to become a member</Link></div>}
      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "profile" && <MyProfile onSaved={() => toast.show("Profile saved")} />}
      {tab === "company" && <CompanyTab onSaved={() => toast.show("Company profile saved")} />}
      {tab === "team" && <TeamTab />}
      {tab === "events" && <MyEvents />}
      {tab === "jobs" && <MyJobs />}
      {tab === "password" && <PasswordTab />}
      {toast.node}
    </div>
  );
}

function MyProfile({ onSaved }: { onSaved: () => void }) {
  const { me, updateMe } = useStore();
  const [f, setF] = useState({ name: me!.name, jobTitle: me!.jobTitle, phone: me!.phone, linkedin: me!.linkedin, bio: me!.bio, interests: me!.interests });
  return (
    <form className="card stack" style={{ gap: 18 }} onSubmit={e => { e.preventDefault(); updateMe(f); onSaved(); }}>
      <div className="form-grid">
        <Field label="Full name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <Field label="Job title" value={f.jobTitle} onChange={e => setF({ ...f, jobTitle: e.target.value })} />
        <Field label="Email" value={me!.email} readOnly hint="Your login. Contact PIKOM to change it." />
        <Field label="Mobile (optional)" type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} hint="Shown to PIKOM members" />
        <Field label="LinkedIn profile URL" type="url" placeholder="https://www.linkedin.com/in/…" value={f.linkedin} onChange={e => setF({ ...f, linkedin: e.target.value })} />
      </div>
      <Area label="About me" placeholder="What you work on and what you'd like to connect about" value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} />
      <MultiOther legend="I'm on AI Xchange for" options={INTERESTS} value={f.interests} onChange={v => setF({ ...f, interests: v })} />
      {me!.orgId && <p className="small muted">Your name, job title, email and phone are shown to PIKOM members on your company's page.</p>}
      <div><button className="btn primary">Save profile</button></div>
    </form>
  );
}

function CompanyTab({ onSaved }: { onSaved: () => void }) {
  const { me, myOrg, updateOrgProfile, db } = useStore();
  const [p, setP] = useState<CompanyProfile>(myOrg!.profile);
  const canEdit = me!.role === "main";
  const main = db.users.find(u => u.orgId === myOrg!.id && u.role === "main");
  if (!canEdit) return (
    <div className="card stack" style={{ gap: 14 }}>
      <div className="alert info">Only your main account holder{main ? ` (${main.name})` : ""} can edit the company profile. You can view it as other members see it.</div>
      <dl className="kv">
        <dt>Company</dt><dd>{myOrg!.name}</dd><dt>Category</dt><dd>{p.category || "—"}</dd><dt>About</dt><dd>{p.about || "—"}</dd>
        <dt>Capabilities</dt><dd>{p.capabilities.join(", ") || "—"}</dd><dt>Industries served</dt><dd>{p.industries.join(", ") || "—"}</dd>
        <dt>Website</dt><dd>{p.website || "—"}</dd><dt>Location</dt><dd>{p.state || "—"}</dd><dt>Size</dt><dd>{p.employees || "—"}</dd>
      </dl>
      <Link className="btn" style={{ alignSelf: "flex-start" }} href={`/members/${slugify(myOrg!.name)}`}>View public profile</Link>
    </div>
  );
  const done = [p.about, p.website, p.category, p.capabilities.length, p.industries.length, p.state, p.employees].filter(Boolean).length;
  return (
    <form className="card stack" style={{ gap: 18 }} onSubmit={e => { e.preventDefault(); updateOrgProfile(myOrg!.id, p); onSaved(); }}>
      <div className="row between">
        <div className="stack" style={{ gap: 6, minWidth: 240 }}><span className="small" style={{ fontWeight: 600 }}>Profile {Math.round(done / 7 * 100)}% complete</span><div className="bar" style={{ width: 240 }}><i style={{ width: `${done / 7 * 100}%`, background: "var(--green)" }} /></div></div>
        <Link href={`/members/${slugify(myOrg!.name)}`}>View public profile</Link>
      </div>
      <div className="form-grid">
        <Field label="Company name" value={myOrg!.name} readOnly hint="As registered with PIKOM. Contact PIKOM to change." />
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

function TeamTab() {
  const { me, myOrg, orgUsers, removeUser } = useStore();
  const users = orgUsers(myOrg!.id);
  const isMain = me!.role === "main";
  const full = users.length >= myOrg!.seatLimit;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card row between">
        <div className="stack" style={{ gap: 6 }}><h2 className="h3">@{myOrg!.domain}</h2><SeatDots used={users.length} limit={myOrg!.seatLimit} /></div>
        <p className="small muted" style={{ maxWidth: 520 }}>Anyone with an @{myOrg!.domain} email can join until all {myOrg!.seatLimit} seats are used — no approval needed. Everyone sees the same member content. {isMain ? "Remove someone to free their seat. For more seats, contact PIKOM." : "Only the main account holder can free seats."}</p>
      </div>
      {full && <div className="alert warn">All {myOrg!.seatLimit} seats are in use. New colleagues will see error AX-102 until a seat is freed.</div>}
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Last sign-in</th>{isMain && <th><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Actions</span></th>}</tr></thead>
        <tbody>{users.map(u => (
          <tr key={u.id}>
            <td><b>{u.name}</b><div className="small muted">{u.jobTitle}</div></td><td>{u.email}</td>
            <td><span className={`badge ${u.role === "main" ? "blue" : ""}`}>{roleLabel(u.role)}</span></td>
            <td className="nw">{fmtDate(u.createdOn)}</td><td>{u.lastSignIn || "—"}</td>
            {isMain && <td>{u.id !== me!.id && <button className="btn sm danger" onClick={() => { if (confirm(`Remove ${u.name}? They lose access and their seat is freed.`)) removeUser(u.id); }}>Remove</button>}</td>}
          </tr>))}
        </tbody>
      </table></div>
      {!isMain && <p className="small muted">Main account holder changes are made by the PIKOM secretariat.</p>}
    </div>
  );
}

function MyEvents() {
  const { db, me } = useStore();
  const mine = db.events.filter(e => e.registrations.some(r => r.userId === me!.id && r.status !== "cancelled")).sort((a, b) => a.date.localeCompare(b.date));
  const up = mine.filter(e => e.date >= today()), past = mine.filter(e => e.date < today());
  return (
    <div className="stack" style={{ gap: 16 }}>
      {mine.length === 0 && <div className="empty">You haven't registered for any events. <Link href="/events">Browse events</Link></div>}
      {up.length > 0 && <><h2 className="h3">Upcoming</h2><div className="grid">{up.map(e => <EventCard key={e.id} e={e} />)}</div></>}
      {past.length > 0 && <><h2 className="h3">Past</h2><div className="grid">{past.map(e => <EventCard key={e.id} e={e} />)}</div></>}
    </div>
  );
}

function MyJobs() {
  const { db, me, myOrg, deleteJob, updateRfp } = useStore();
  const mine = db.jobs.filter(j => (myOrg ? j.orgId === myOrg.id : j.postedBy === me!.email));
  const rfps = db.rfps.filter(r => (myOrg ? r.orgId === myOrg.id : r.postedBy === me!.email));
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row between"><h2 className="h3">RFPs</h2><Link className="btn" href="/opportunities">Post an RFP</Link></div>
      {rfps.length === 0 ? <div className="empty">No RFPs posted.</div> : rfps.map(r => (
        <div key={r.id} className="card tight row between">
          <div className="stack" style={{ gap: 2 }}><b>{r.title}</b><span className="small muted">Closes {fmtDate(r.closes)} · {r.status}</span></div>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>Status<select className="select" style={{ width: "auto" }} value={r.status} onChange={e => updateRfp(r.id, { status: e.target.value as "Open" })}><option>Open</option><option>Closed</option><option>Awarded</option></select></label>
        </div>))}
      <div className="row between" style={{ marginTop: 12 }}><h2 className="h3">Jobs</h2><Link className="btn primary" href="/opportunities?tab=jobs&post=1">Post a job</Link></div>
      <p className="muted small">{myOrg ? "Posted by anyone at your company." : "Posted by you."}</p>
      {mine.length === 0 ? <div className="empty">No job posts yet.</div> : mine.map(j => (
        <div key={j.id} className="card tight row between">
          <div className="stack" style={{ gap: 2 }}><b>{j.title}</b><span className="small muted">{j.location} · {j.mode} · posted {fmtDate(j.postedOn)}{j.postedBy ? ` by ${j.postedBy}` : ""}</span></div>
          <div className="row">{j.linkedinUrl && <a className="btn sm" href={j.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn post</a>}<button className="btn sm danger" onClick={() => deleteJob(j.id)}>Close post</button></div>
        </div>))}
    </div>
  );
}

function PasswordTab() {
  const { changePassword } = useStore();
  const [f, setF] = useState({ cur: "", n1: "", n2: "" });
  const [res, setRes] = useState<{ ok: boolean; code?: string; msg?: string } | null>(null);
  return (
    <form className="card stack" style={{ gap: 16, maxWidth: 480 }} onSubmit={async e => {
      e.preventDefault();
      if (f.n1 !== f.n2) return setRes({ ok: false, code: "AX-108", msg: "The new passwords don't match." });
      const r = await changePassword(f.cur, f.n1); setRes(r); if (r.ok) setF({ cur: "", n1: "", n2: "" });
    }}>
      <Field label="Current password" type="password" autoComplete="current-password" required value={f.cur} onChange={e => setF({ ...f, cur: e.target.value })} />
      <Field label="New password" type="password" autoComplete="new-password" required hint="At least 8 characters" value={f.n1} onChange={e => setF({ ...f, n1: e.target.value })} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" required value={f.n2} onChange={e => setF({ ...f, n2: e.target.value })} />
      {res && (res.ok ? <div className="alert ok">{res.msg}</div> : <ErrorBox code={res.code} msg={res.msg!} />)}
      <div><button className="btn primary">Change password</button></div>
    </form>
  );
}
