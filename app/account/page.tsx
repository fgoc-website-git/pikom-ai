"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore, roleLabel, today } from "@/lib/store";
import { EventCard } from "@/components/EventCard";
import { CompanyManager } from "@/components/company/CompanyManager";
import { INTERESTS } from "@/lib/options";
import { MembersOnly, Field, Area, MultiOther, ErrorBox, Avatar, useToast, fmtDate } from "@/components/ui";

type Tab = "profile" | "company" | "events" | "posts" | "password";

export default function Account() { return <MembersOnly><AccountInner /></MembersOnly>; }

function AccountInner() {
  const { me, myOrg, db } = useStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [welcome, setWelcome] = useState(false);
  const toast = useToast();
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("welcome")) setWelcome(true); const t = p.get("tab"); if (t === "team" || t === "jobs") setTab(t === "jobs" && !myOrg ? "posts" : "company"); else if (t) setTab(t as Tab); }, []);
  if (!me) return null;
  const isOrg = !!myOrg;
  const tabs: [Tab, string][] = [["profile", "My profile"], ...(isOrg ? [["company", me.role === "member" ? "My company" : "Manage my company"]] as [Tab, string][] : []), ["events", "My events"], ...(me.role === "individual" ? [["posts", "My RFPs"]] as [Tab, string][] : []), ["password", "Password"]];
  const renewal = myOrg?.renewal || db.individuals.find(i => i.email === me.email)?.renewal;

  return (
    <div className="wrap page-head">
      {welcome && <div className="alert ok" style={{ marginBottom: 16 }}>Welcome to AI Xchange, {me.name.split(" ")[0]}. {me.role === "main" ? "As company admin, start with Manage my company: complete the profile other members see, and add your colleagues." : "Add a few details so other members know who you are."}</div>}
      <div className="row between" style={{ marginBottom: 20 }}>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <Avatar name={me.name} round lg />
          <div className="stack" style={{ gap: 2 }}>
            <h1 className="h2">{me.name}</h1>
            <span className="muted">{me.jobTitle || "—"}{myOrg ? ` · ${myOrg.name}` : ""}</span>
            <span className="row" style={{ gap: 6 }}><span className={`badge ${me.role === "main" ? "blue" : "green"}`}>{roleLabel(me.role)}</span>{me.staff && <span className="badge dark">{me.staff === "super" ? "Super admin" : "PIKOM admin"}</span>}{myOrg && <span className="badge">{myOrg.type}</span>}{me.role === "individual" && <span className="badge">Individual Member</span>}{me.role === "guest" && <span className="badge">Limited access</span>}</span>
          </div>
        </div>
        {renewal && <div className="alert warn small">PIKOM membership renews <b>{fmtDate(renewal)}</b>. Renewals are handled by the PIKOM secretariat.</div>}
      </div>

      {me.role === "guest" && <div className="alert info" style={{ marginBottom: 16 }}>You have a free guest account. To see member details, contacts, RFPs and jobs in full, your company needs to join PIKOM — or join as an Individual Member. <Link href="/membership">How to become a member</Link></div>}
      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "profile" && <MyProfile onSaved={() => toast.show("Profile saved")} />}
      {tab === "company" && myOrg && <CompanyManager org={myOrg} toast={toast.show} />}
      {tab === "events" && <MyEvents />}
      {tab === "posts" && <MyRfps />}
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

function MyRfps() {
  const { db, me, updateRfp } = useStore();
  const rfps = db.rfps.filter(r => r.postedBy === me!.email);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row between"><h2 className="h3">My RFPs</h2><Link className="btn primary" href="/opportunities">+ Post an RFP</Link></div>
      <p className="small muted">As an individual member you can post RFPs and apply for jobs. Job openings are posted by member companies.</p>
      {rfps.length === 0 ? <div className="empty">No RFPs posted.</div> : rfps.map(r => (
        <div key={r.id} className="card tight row between">
          <div className="stack" style={{ gap: 2 }}><b>{r.title}</b><span className="small muted">Closes {fmtDate(r.closes)}</span></div>
          <label className="row small" style={{ gap: 8, flexWrap: "nowrap" }}>Status<select className="select" style={{ width: "auto" }} value={r.status} onChange={e => updateRfp(r.id, { status: e.target.value as "Open" })}><option>Open</option><option>Closed</option><option>Awarded</option></select></label>
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
