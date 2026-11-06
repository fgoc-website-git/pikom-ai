"use client";
import { useMemo, useState } from "react";
import { useStore, roleLabel, type Org } from "@/lib/store";
import { MEMBER_TYPES, SEAT_LIMIT, type MemberType } from "@/lib/options";
import { MembersOnly, Field, ErrorBox, SeatDots, useToast, fmtDate } from "@/components/ui";

type Tab = "companies" | "individuals" | "people" | "log";

export default function Admin() { return <MembersOnly admin><AdminInner /></MembersOnly>; }

function AdminInner() {
  const { db, seatsUsed } = useStore();
  const [tab, setTab] = useState<Tab>("companies");
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  const members = db.users.filter(u => u.role !== "superadmin");
  const full = db.orgs.filter(o => seatsUsed(o.id) >= o.seatLimit).length;
  const noMain = db.orgs.filter(o => !db.users.some(u => u.orgId === o.id && u.role === "main")).length;

  return (
    <div className="wrap page-head">
      <div className="stack" style={{ gap: 4, marginBottom: 20 }}>
        <span className="eyebrow">PIKOM secretariat</span>
        <h1 className="h1" style={{ fontSize: 34 }}>Super admin</h1>
        <p className="muted">Whitelist member company domains and individual members, see who has registered, and manage access to AI Xchange.</p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", marginBottom: 24 }}>
        {[["Whitelisted companies", db.orgs.length], ["Individual members", db.individuals.length], ["Registered people", members.length], ["Companies at 5/5 seats", full], ["No main holder yet", noMain]].map(([l, n]) => (
          <div key={l as string} className="card tight stack" style={{ gap: 2 }}><span className="small muted">{l}</span><span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 28 }}>{n}</span></div>))}
      </div>
      <div className="tabs" role="tablist">
        {([["companies", "Company domains"], ["individuals", "Individual members"], ["people", "All registered people"], ["log", "Activity log"]] as [Tab, string][]).map(([k, l]) =>
          <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "companies" && <Companies open={open} setOpen={setOpen} toast={toast.show} />}
      {tab === "individuals" && <Individuals toast={toast.show} />}
      {tab === "people" && <People />}
      {tab === "log" && <div className="table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>{db.log.map((l, i) => <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{l.at}</td><td>{l.who}</td><td>{l.what}</td></tr>)}</tbody></table></div>}
      {toast.node}
    </div>
  );
}

function AddCompany({ toast, onDone }: { toast: (s: string) => void; onDone: () => void }) {
  const { addOrg } = useStore();
  const [f, setF] = useState({ domain: "", name: "", type: "Ordinary Member" as MemberType, mainEmail: "", pikomNo: "", renewal: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  return (
    <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); const r = addOrg(f); if (!r.ok) return setErr(r); toast(r.msg || "Added"); onDone(); }}>
      <h2 className="h3">Whitelist a member company</h2>
      <p className="small muted">Do this after the company's PIKOM membership is confirmed. Up to {SEAT_LIMIT} people with this email domain can then register.</p>
      <div className="form-grid">
        <Field label="Company email domain" required placeholder="company.com.my" value={f.domain} onChange={e => setF({ ...f, domain: e.target.value })} hint="Without the @" />
        <Field label="Registered company name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <label className="field">PIKOM membership type<select className="select" value={f.type} onChange={e => setF({ ...f, type: e.target.value as MemberType })}>{MEMBER_TYPES.filter(t => t !== "Individual Member").map(t => <option key={t}>{t}</option>)}</select></label>
        <Field label="PIKOM membership no." value={f.pikomNo} onChange={e => setF({ ...f, pikomNo: e.target.value })} />
        <Field label="Main account holder email" type="email" placeholder={`name@${f.domain || "company.com.my"}`} value={f.mainEmail} onChange={e => setF({ ...f, mainEmail: e.target.value })} hint="Can be set later" />
        <Field label="Membership renewal date" type="date" value={f.renewal} onChange={e => setF({ ...f, renewal: e.target.value })} />
      </div>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="row"><button className="btn primary">Whitelist domain</button><button type="button" className="btn" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

function Companies({ open, setOpen, toast }: { open: string | null; setOpen: (s: string | null) => void; toast: (s: string) => void }) {
  const { db, seatsUsed } = useStore();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const list = useMemo(() => db.orgs.filter(o => (o.name + o.domain).toLowerCase().includes(q.toLowerCase())), [db.orgs, q]);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <input className="input" style={{ maxWidth: 360 }} aria-label="Search companies" placeholder="Search company or domain" value={q} onChange={e => setQ(e.target.value)} />
        {!adding && <button className="btn primary" onClick={() => setAdding(true)}>+ Whitelist a company</button>}
      </div>
      {adding && <AddCompany toast={toast} onDone={() => setAdding(false)} />}
      <div className="table-wrap"><table>
        <thead><tr><th>Company</th><th>Domain</th><th>Type</th><th>Seats</th><th>Main account holder</th><th>Status</th><th><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Open</span></th></tr></thead>
        <tbody>{list.map(o => {
          const main = db.users.find(u => u.orgId === o.id && u.role === "main");
          return (
            <tr key={o.id}>
              <td><b>{o.name}</b><div className="small muted">Whitelisted {fmtDate(o.whitelistedOn)}</div></td>
              <td>@{o.domain}</td><td>{o.type.replace(" Member", "")}</td>
              <td><SeatDots used={seatsUsed(o.id)} limit={o.seatLimit} /></td>
              <td>{main ? main.name : o.mainEmail ? <span className="small">{o.mainEmail}<br /><span className="badge orange">Not registered yet</span></span> : <span className="badge red">Not set</span>}</td>
              <td>{o.status === "active" ? <span className="badge green">Active</span> : <span className="badge red">Paused</span>}</td>
              <td><button className="btn sm" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>{open === o.id ? "Close" : "Manage"}</button></td>
            </tr>);
        })}</tbody>
      </table></div>
      {open && db.orgs.find(o => o.id === open) && <OrgPanel org={db.orgs.find(o => o.id === open)!} toast={toast} close={() => setOpen(null)} />}
    </div>
  );
}

function OrgPanel({ org, toast, close }: { org: Org; toast: (s: string) => void; close: () => void }) {
  const { orgUsers, removeUser, setMainHolder, updateOrg, removeOrg, addUserAsAdmin } = useStore();
  const users = orgUsers(org.id);
  const [add, setAdd] = useState({ email: "", name: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  const [mainEmail, setMainEmail] = useState(org.mainEmail);
  return (
    <div className="card hl stack" style={{ gap: 18 }}>
      <div className="row between"><div><h2 className="h3">{org.name}</h2><span className="small muted">@{org.domain} · {org.type} · PIKOM no. {org.pikomNo || "—"} · renews {fmtDate(org.renewal)}</span></div><SeatDots used={users.length} limit={org.seatLimit} /></div>

      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Last sign-in</th><th><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Actions</span></th></tr></thead>
        <tbody>{users.length === 0 ? <tr><td colSpan={6} className="muted">Nobody has registered from @{org.domain} yet.</td></tr> : users.map(u => (
          <tr key={u.id}><td><b>{u.name}</b><div className="small muted">{u.jobTitle}</div></td><td>{u.email}</td><td><span className={`badge ${u.role === "main" ? "blue" : ""}`}>{roleLabel(u.role)}</span></td><td>{fmtDate(u.createdOn)}</td><td>{u.lastSignIn || "—"}</td>
            <td className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
              {u.role !== "main" && <button className="btn sm" onClick={() => { setMainHolder(org.id, u.email); setMainEmail(u.email); toast(`${u.name} is now main account holder`); }}>Make main holder</button>}
              <button className="btn sm danger" onClick={() => { if (confirm(`Remove ${u.name} from AI Xchange?`)) { removeUser(u.id); toast("Removed — seat freed"); } }}>Remove</button>
            </td></tr>))}
        </tbody>
      </table></div>

      <div className="grid2">
        <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addUserAsAdmin(org.id, add.email, add.name); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setAdd({ email: "", name: "" }); }}>
          <h3 className="h3" style={{ fontSize: 16 }}>Add a person</h3>
          <div className="form-grid"><Field label="Email" type="email" required placeholder={`name@${org.domain}`} value={add.email} onChange={e => setAdd({ ...add, email: e.target.value })} /><Field label="Name" value={add.name} onChange={e => setAdd({ ...add, name: e.target.value })} /></div>
          {err && <ErrorBox code={err.code} msg={err.msg} />}
          <div><button className="btn">Add and send invite</button></div>
        </form>
        <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); setMainHolder(org.id, mainEmail.trim().toLowerCase()); toast("Main account holder updated"); }}>
          <h3 className="h3" style={{ fontSize: 16 }}>Main account holder</h3>
          <Field label="Email" type="email" value={mainEmail} onChange={e => setMainEmail(e.target.value)} hint="If they haven't registered yet, they become main holder when they do." />
          <div><button className="btn">Save</button></div>
        </form>
      </div>

      <div className="row" style={{ borderTop: "1px solid var(--soft)", paddingTop: 16 }}>
        {org.status === "active"
          ? <button className="btn" onClick={() => { updateOrg(org.id, { status: "suspended" }); toast("Access paused"); }}>Pause access (renewal pending)</button>
          : <button className="btn primary" onClick={() => { updateOrg(org.id, { status: "active" }); toast("Access restored"); }}>Restore access</button>}
        <button className="btn danger" onClick={() => { if (confirm(`Remove @${org.domain}? All ${users.length} accounts and job posts from this company are deleted.`)) { removeOrg(org.id); close(); toast("Domain removed"); } }}>Remove domain</button>
      </div>
    </div>
  );
}

function Individuals({ toast }: { toast: (s: string) => void }) {
  const { db, addIndividual, removeIndividual } = useStore();
  const [f, setF] = useState({ email: "", name: "", pikomNo: "", renewal: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="card stack" style={{ gap: 14 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addIndividual(f); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setF({ email: "", name: "", pikomNo: "", renewal: "" }); }}>
        <h2 className="h3">Whitelist an individual member</h2>
        <p className="small muted">For PIKOM individual members not linked to a company. Only this exact email can register; it uses one seat.</p>
        <div className="form-grid">
          <Field label="Email" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <Field label="Full name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <Field label="PIKOM membership no." value={f.pikomNo} onChange={e => setF({ ...f, pikomNo: e.target.value })} />
          <Field label="Renewal date" type="date" value={f.renewal} onChange={e => setF({ ...f, renewal: e.target.value })} />
        </div>
        {err && <ErrorBox code={err.code} msg={err.msg} />}
        <div><button className="btn primary">Whitelist email</button></div>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Whitelisted</th><th>Renews</th><th>Status</th><th><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Actions</span></th></tr></thead>
        <tbody>{db.individuals.map(i => {
          const u = db.users.find(x => x.email === i.email);
          return <tr key={i.email}><td><b>{i.name}</b></td><td>{i.email}</td><td>{fmtDate(i.whitelistedOn)}</td><td>{fmtDate(i.renewal)}</td><td>{u ? <span className="badge green">Registered</span> : <span className="badge orange">Not registered yet</span>}</td>
            <td><button className="btn sm danger" onClick={() => { if (confirm(`Remove ${i.email}?`)) { removeIndividual(i.email); toast("Removed"); } }}>Remove</button></td></tr>;
        })}</tbody>
      </table></div>
    </div>
  );
}

function People() {
  const { db, removeUser } = useStore();
  const [q, setQ] = useState("");
  const list = db.users.filter(u => u.role !== "superadmin" && (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const orgName = (id: string | null) => db.orgs.find(o => o.id === id)?.name || "Individual";
  return (
    <div className="stack" style={{ gap: 12 }}>
      <input className="input" style={{ maxWidth: 360 }} aria-label="Search people" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Last sign-in</th><th><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Actions</span></th></tr></thead>
        <tbody>{list.map(u => <tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{orgName(u.orgId)}</td><td>{roleLabel(u.role)}</td><td>{u.lastSignIn || "—"}</td><td><button className="btn sm danger" onClick={() => { if (confirm(`Remove ${u.name}?`)) removeUser(u.id); }}>Remove</button></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
