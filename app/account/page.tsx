"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, roleLabel, today, settingsOf } from "@/lib/store";
import { TIP } from "@/lib/help";
import { EventCard } from "@/components/EventCard";
import { INTERESTS } from "@/lib/options";
import { MembersOnly, Field, Area, MultiOther, ErrorBox, Avatar, useToast, fmtDate, Tip, ask } from "@/components/ui";

type Tab = "profile" | "security" | "privacy" | "notifications" | "events" | "posts";

export default function Account() { return <MembersOnly><AccountInner /></MembersOnly>; }

function AccountInner() {
  const { me, myOrg, db } = useStore();
  const router = useRouter();
  const [tab, setTabState] = useState<Tab>("profile");
  const [welcome, setWelcome] = useState(false);
  const toast = useToast();
  const setTab = (t: Tab) => { setTabState(t); try { history.replaceState(null, "", t === "profile" ? "/account" : `/account?tab=${t}`); } catch {} };
  useEffect(() => {
    const p = new URLSearchParams(window.location.search); if (p.get("welcome")) setWelcome(true);
    const t = p.get("tab");
    if (t === "team" || t === "company" || (t === "jobs" && myOrg)) router.replace("/company");
    else if (t === "jobs") setTabState("posts"); else if (t === "password") setTabState("security"); else if (t) setTabState(t as Tab);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!me) return null;
  const sections: [Tab, string, string][] = [
    ["profile", "Profile", "How other members see you"], ["security", "Login & security", "Password and devices"], ["privacy", "Privacy", "What's shown in the directory"],
    ["notifications", "Notifications", "Emails you get"], ["events", "My events", "Registrations"], ...(me.role === "individual" ? [["posts", "My RFPs", "Your posts"]] as [Tab, string, string][] : []),
  ];
  const renewal = myOrg?.renewal || db.individuals.find(i => i.email === me.email)?.renewal;
  return (
    <div className="wrap page-head">
      {welcome && <div className="alert ok" style={{ marginBottom: 16 }}>Welcome to AI Xchange, {me.name.split(" ")[0]}. {me.role === "main" ? <>As company admin, start with <Link href="/company">My company</Link>: complete the profile other members see, and add your colleagues.</> : "Add a few details so other members know who you are."}</div>}
      <div className="row between" style={{ marginBottom: 20 }}>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <Avatar name={me.name} round lg />
          <div className="stack" style={{ gap: 2 }}>
            <span className="eyebrow">Account settings</span>
            <h1 className="h2">{me.name}</h1>
            <span className="muted">{me.jobTitle || "—"}{myOrg ? ` · ${myOrg.name}` : ""}</span>
            <span className="row" style={{ gap: 6 }}><span className={`badge ${me.role === "main" ? "blue" : "green"}`}>{roleLabel(me.role)}</span>{me.staff && <span className="badge dark">{me.staff === "super" ? "Super admin" : "PIKOM admin"}</span>}{myOrg && <span className="badge">{myOrg.type}</span>}{me.role === "guest" && <span className="badge">Limited access <Tip text={TIP.guest} /></span>}</span>
          </div>
        </div>
        <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
          {renewal && <div className="alert warn small">PIKOM membership renews <b>{fmtDate(renewal)}</b>. Renewals are handled by the PIKOM secretariat.</div>}
          {myOrg && <Link className="btn" href="/company">{me.role === "member" ? "View my company" : "Manage my company"} →</Link>}
        </div>
      </div>
      {me.role === "guest" && <div className="alert info" style={{ marginBottom: 16 }}>You have a free guest account. To see member details, contacts, RFPs and jobs in full, your company needs to join PIKOM — or join as an Individual Member. <Link href="/membership">How to become a member</Link></div>}
      <div className="settings-layout">
        <nav aria-label="Account settings" className="card stack side-nav" style={{ gap: 2, padding: 12 }}>
          {sections.map(([k, l, d]) => <a key={k} href={k === "profile" ? "/account" : `/account?tab=${k}`} aria-current={tab === k ? "page" : undefined} onClick={e => { e.preventDefault(); setTab(k); }} style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}><span>{l}</span><span className="small muted" style={{ fontWeight: 400 }}>{d}</span></a>)}
        </nav>
        <div style={{ minWidth: 0 }}>
          {tab === "profile" && <MyProfile onSaved={() => toast.show("Profile saved")} />}
          {tab === "security" && <Security toast={toast.show} />}
          {tab === "privacy" && <Privacy toast={toast.show} />}
          {tab === "notifications" && <Notifications toast={toast.show} />}
          {tab === "events" && <MyEvents />}
          {tab === "posts" && <MyRfps />}
        </div>
      </div>
      {toast.node}
    </div>
  );
}

function MyProfile({ onSaved }: { onSaved: () => void }) {
  const { me, myOrg, updateMe } = useStore();
  const [f, setF] = useState({ name: me!.name, jobTitle: me!.jobTitle, phone: me!.phone, linkedin: me!.linkedin, bio: me!.bio, interests: me!.interests });
  const done = [f.name, f.jobTitle, f.phone, f.linkedin, f.bio, f.interests.length].filter(Boolean).length;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="card stack" style={{ gap: 18 }} onSubmit={e => { e.preventDefault(); updateMe(f); onSaved(); }}>
        <div className="stack" style={{ gap: 6 }}><span className="small" style={{ fontWeight: 600 }}>Profile {Math.round(done / 6 * 100)}% complete</span><div className="bar" style={{ maxWidth: 260 }}><i style={{ width: `${done / 6 * 100}%`, background: "var(--green)" }} /></div></div>
        <div className="form-grid">
          <Field label="Full name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <Field label="Job title" value={f.jobTitle} onChange={e => setF({ ...f, jobTitle: e.target.value })} />
          <Field label="Email" value={me!.email} readOnly hint="Your login — see Login & security to change it." />
          <Field label="Mobile (optional)" tip={TIP.showPhone} type="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
          <Field label="LinkedIn profile URL" tip={TIP.showLinkedin} type="url" placeholder="https://www.linkedin.com/in/…" value={f.linkedin} onChange={e => setF({ ...f, linkedin: e.target.value })} />
        </div>
        <Area label="About me" placeholder="What you work on and what you'd like to connect about" value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} />
        <MultiOther legend="I'm on AI Xchange for" options={INTERESTS} value={f.interests} onChange={v => setF({ ...f, interests: v })} />
        <div><button className="btn primary">Save profile</button></div>
      </form>
      <div className="card stack" style={{ gap: 8 }}>
        <span className="small muted" style={{ fontWeight: 600 }}>Preview — how other members see you{myOrg ? ` on ${myOrg.name}'s page` : ""}</span>
        <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}><Avatar name={f.name} round /><div><b>{f.name}</b><div className="small muted">{f.jobTitle || "—"}</div><div className="small">{me!.email}{f.phone && me!.showPhone !== false ? ` · ${f.phone}` : ""}{f.linkedin && me!.showLinkedin !== false ? " · LinkedIn" : ""}</div></div></div>
        {f.bio && <p className="small">{f.bio}</p>}
      </div>
    </div>
  );
}

function Security({ toast }: { toast: (s: string) => void }) {
  const { me, signOutEverywhere, db } = useStore();
  const [busy, setBusy] = useState(false);
  const sec = settingsOf(db);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <PasswordTab />
      <div className="card stack" style={{ gap: 10 }}>
        <h2 className="h3">Signed-in devices <Tip text={TIP.signOutAll} /></h2>
        <p className="small muted">Last sign-in: {me!.lastSignIn || "—"}. If you signed in on a shared computer, sign out everywhere else.</p>
        <div><button className="btn" disabled={busy} onClick={async () => { if (!(await ask("Sign out on all other devices?", { danger: false, ok: "Sign out others" }))) return; setBusy(true); const r = await signOutEverywhere(); setBusy(false); toast(r.ok ? r.msg || "Done" : r.msg); }}>{busy ? "Signing out…" : "Sign out everywhere else"}</button></div>
      </div>
      <div className="card stack" style={{ gap: 8 }}>
        <h2 className="h3">Change login email</h2>
        <p className="small muted">Your login email is linked to your PIKOM membership{me!.orgId ? " and your company's seat" : ""}, so it's changed by {me!.orgId ? "your company admin or " : ""}the PIKOM secretariat.</p>
        <div><a className="btn" href={`mailto:${sec.secretariatEmail || ""}?subject=${encodeURIComponent("AI Xchange — change my login email")}&body=${encodeURIComponent(`Current email: ${me!.email}\nNew email: `)}`}>Request a change</a></div>
      </div>
    </div>
  );
}

function Toggle({ label, tip, on, set }: { label: string; tip?: string; on: boolean; set: (v: boolean) => void }) {
  return <label className="switch"><span>{label}{tip && <Tip text={tip} />}</span><input type="checkbox" role="switch" checked={on} onChange={e => set(e.target.checked)} style={{ width: 20, height: 20 }} /></label>;
}
function Privacy({ toast }: { toast: (s: string) => void }) {
  const { me, updateMe } = useStore();
  const set = (p: Partial<NonNullable<typeof me>>) => { updateMe(p); toast("Privacy setting saved"); };
  return (
    <div className="card stack" style={{ gap: 0 }}>
      <h2 className="h3" style={{ marginBottom: 6 }}>What other members see</h2>
      <p className="small muted" style={{ marginBottom: 8 }}>Your name, job title, company and work email are always shown to PIKOM members — that's how the network works. Guests and visitors never see your details.</p>
      <Toggle label="Show my mobile number" tip={TIP.showPhone} on={me!.showPhone !== false} set={v => set({ showPhone: v })} />
      <Toggle label="Show my LinkedIn link" tip={TIP.showLinkedin} on={me!.showLinkedin !== false} set={v => set({ showLinkedin: v })} />
    </div>
  );
}
function Notifications({ toast }: { toast: (s: string) => void }) {
  const { me, updateMe } = useStore();
  const n = me!.notify || { eventReminders: true, rfpReplies: true, newMembers: false };
  const set = (p: Partial<typeof n>) => { updateMe({ notify: { ...n, ...p } }); toast("Saved"); };
  return (
    <div className="card stack" style={{ gap: 0 }}>
      <h2 className="h3" style={{ marginBottom: 6 }}>Email me about <Tip text={TIP.notifications} /></h2>
      <div className="alert info small" style={{ margin: "6px 0 8px" }}>Emails switch on once the email service is connected. Your choices are saved now.</div>
      <Toggle label="Reminders for events I've registered for" on={n.eventReminders} set={v => set({ eventReminders: v })} />
      <Toggle label="Replies to my RFPs" on={n.rfpReplies} set={v => set({ rfpReplies: v })} />
      <Toggle label="New member companies joining" on={n.newMembers} set={v => set({ newMembers: v })} />
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
    <form className="card stack" style={{ gap: 16 }} onSubmit={async e => {
      e.preventDefault();
      if (f.n1 !== f.n2) return setRes({ ok: false, code: "AX-108", msg: "The new passwords don't match." });
      const r = await changePassword(f.cur, f.n1); setRes(r); if (r.ok) setF({ cur: "", n1: "", n2: "" });
    }}>
      <h2 className="h3">Password</h2>
      <Field label="Current password" type="password" autoComplete="current-password" required value={f.cur} onChange={e => setF({ ...f, cur: e.target.value })} />
      <Field label="New password" type="password" autoComplete="new-password" required hint="At least 8 characters" value={f.n1} onChange={e => setF({ ...f, n1: e.target.value })} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" required value={f.n2} onChange={e => setF({ ...f, n2: e.target.value })} />
      {res && (res.ok ? <div className="alert ok">{res.msg}</div> : <ErrorBox code={res.code} msg={res.msg!} />)}
      <div><button className="btn primary">Change password</button></div>
    </form>
  );
}
