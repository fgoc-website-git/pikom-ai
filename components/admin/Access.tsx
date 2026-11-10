"use client";
import { useMemo, useState } from "react";
import { useStore, roleLabel, type Org } from "@/lib/store";
import { MEMBER_TYPES, SEAT_LIMIT, COMPANY_CATEGORIES, type MemberType } from "@/lib/options";
import { Field, ErrorBox, SeatDots, SelectOther, fmtDate, Reveal } from "@/components/ui";

const SR = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" };
type Toast = (s: string) => void;

function AddCompany({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const { addOrg } = useStore();
  const [f, setF] = useState({ domain: "", name: "", type: "Ordinary Member" as MemberType, mainEmail: "", pikomNo: "", renewal: "", category: "", about: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  return (
    <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); const r = addOrg(f); if (!r.ok) return setErr(r); toast(r.msg || "Added"); onDone(); }}>
      <h2 className="h3">Whitelist a member company</h2>
      <p className="small muted">Do this once the PIKOM membership is confirmed. The company appears in the member directory straight away, and up to {SEAT_LIMIT} people with this email domain can register.</p>
      <div className="form-grid">
        <Field label="Company email domain" required placeholder="company.com.my" value={f.domain} onChange={e => setF({ ...f, domain: e.target.value })} hint="Without the @" />
        <Field label="Registered company name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <label className="field">PIKOM membership type<select className="select" value={f.type} onChange={e => setF({ ...f, type: e.target.value as MemberType })}>{MEMBER_TYPES.filter(t => t !== "Individual Member").map(t => <option key={t}>{t}</option>)}</select></label>
        <SelectOther label="Directory category" options={COMPANY_CATEGORIES} value={f.category} onChange={v => setF({ ...f, category: v })} />
        <Field label="Main account holder email" type="email" placeholder={`name@${f.domain || "company.com.my"}`} value={f.mainEmail} onChange={e => setF({ ...f, mainEmail: e.target.value })} hint="Can be set later" />
        <Field label="PIKOM membership no." value={f.pikomNo} onChange={e => setF({ ...f, pikomNo: e.target.value })} />
        <Field label="Membership renewal date" type="date" value={f.renewal} onChange={e => setF({ ...f, renewal: e.target.value })} />
        <Field label="One-line description (directory)" value={f.about} onChange={e => setF({ ...f, about: e.target.value })} hint="The main account holder can edit this later" />
      </div>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="row"><button className="btn primary">Whitelist and add to directory</button><button type="button" className="btn" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export function Companies({ toast }: { toast: Toast }) {
  const { db, seatsUsed } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const list = useMemo(() => db.orgs
    .filter(o => (o.name + o.domain).toLowerCase().includes(q.toLowerCase()))
    .filter(o => filter === "all" || (filter === "nodomain" ? !o.domain : filter === "full" ? seatsUsed(o.id) >= o.seatLimit : filter === "paused" ? o.status === "suspended" : !db.users.some(u => u.orgId === o.id && u.role === "main"))),
    [db, q, filter, seatsUsed]);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <div className="row" style={{ flex: "1 1 420px" }}>
          <input className="input" style={{ flex: "1 1 220px", maxWidth: 340, width: "auto" }} aria-label="Search companies" placeholder="Search company or domain" value={q} onChange={e => setQ(e.target.value)} />
          <select className="select" style={{ width: "auto" }} aria-label="Filter" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All companies ({db.orgs.length})</option><option value="nodomain">Domain still needed</option><option value="nomain">No main holder yet</option><option value="full">Seats full</option><option value="paused">Paused</option>
          </select>
        </div>
        {!adding && <button className="btn primary" onClick={() => setAdding(true)}>+ Whitelist a company</button>}
      </div>
      {adding && <Reveal><AddCompany toast={toast} onDone={() => setAdding(false)} /></Reveal>}
      <div className="table-wrap"><table>
        <thead><tr><th>Company</th><th>Domain</th><th>Seats</th><th>Main account holder</th><th><span style={SR}>Open</span></th></tr></thead>
        <tbody>{list.map(o => {
          const main = db.users.find(u => u.orgId === o.id && u.role === "main");
          return (
            <tr key={o.id} className={open === o.id ? "on" : ""}>
              <td><b>{o.name}</b>{o.status !== "active" && <> <span className="badge red">Paused</span></>}<div className="small muted">{o.type.replace(" Member", "")} · added {fmtDate(o.whitelistedOn)}</div></td>
              <td>{o.domain ? `@${o.domain}` : <span className="badge red">Domain needed</span>}</td>
              <td><SeatDots used={seatsUsed(o.id)} limit={o.seatLimit} /></td>
              <td>{main ? main.name : o.mainEmail ? <span className="small">{o.mainEmail}<br /><span className="badge orange">Not registered yet</span></span> : <span className="badge">Not set</span>}</td>
                            <td><button className="btn sm" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>{open === o.id ? "Close" : "Manage"}</button></td>
            </tr>);
        })}</tbody>
      </table></div>
      {list.length === 0 && <div className="empty">No companies match.</div>}
      {open && db.orgs.find(o => o.id === open) && <Reveal key={open}><OrgPanel org={db.orgs.find(o => o.id === open)!} toast={toast} close={() => setOpen(null)} /></Reveal>}
    </div>
  );
}

function OrgPanel({ org, toast, close }: { org: Org; toast: Toast; close: () => void }) {
  const { orgUsers, removeUser, setMainHolder, updateOrg, removeOrg, addUserAsAdmin } = useStore();
  const users = orgUsers(org.id);
  const [add, setAdd] = useState({ email: "", name: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  const [mainEmail, setMainEmail] = useState(org.mainEmail);
  const [dom, setDom] = useState(org.domain);
  return (
    <div className="card hl stack" style={{ gap: 18 }}>
      <div className="row between"><div><span className="eyebrow">Managing company</span><h2 className="h3">{org.name}</h2><span className="small muted">{org.type} · PIKOM no. {org.pikomNo || "—"} · renews {fmtDate(org.renewal)}</span></div><div className="row"><SeatDots used={users.length} limit={org.seatLimit} /><button type="button" className="btn sm" onClick={close}>Close</button></div></div>
      <form className="row" style={{ alignItems: "flex-end" }} onSubmit={e => { e.preventDefault(); const r = updateOrg(org.id, { domain: dom }); if (!r.ok) setErr(r); else toast("Domain saved"); }}>
        <div style={{ flex: "1 1 260px" }}><Field label="Company email domain" value={dom} onChange={e => setDom(e.target.value)} placeholder="company.com.my" hint={org.domain ? "Changing this does not move existing accounts." : "Needed before anyone from this company can register."} /></div>
        <button className="btn">Save domain</button>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Last sign-in</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{users.length === 0 ? <tr><td colSpan={6} className="muted">Nobody has registered from this company yet.</td></tr> : users.map(u => (
          <tr key={u.id}><td><b>{u.name}</b><div className="small muted">{u.jobTitle}</div></td><td>{u.email}</td><td><span className={`badge ${u.role === "main" ? "blue" : ""}`}>{roleLabel(u.role)}</span></td><td className="nw">{fmtDate(u.createdOn)}</td><td>{u.lastSignIn || "—"}</td>
            <td><div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
              {u.role !== "main" && <button className="btn sm" onClick={() => { setMainHolder(org.id, u.email); setMainEmail(u.email); toast(`${u.name} is now main account holder`); }}>Make main holder</button>}
              <button className="btn sm danger" onClick={() => { if (confirm(`Remove ${u.name} from AI Xchange?`)) { removeUser(u.id); toast("Removed — seat freed"); } }}>Remove</button>
            </div></td></tr>))}
        </tbody>
      </table></div>
      <div className="grid2">
        <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addUserAsAdmin(org.id, add.email, add.name); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setAdd({ email: "", name: "" }); }}>
          <h3 className="h3" style={{ fontSize: 16 }}>Add a person</h3>
          <div className="form-grid"><Field label="Email" type="email" required placeholder={`name@${org.domain || "company.com.my"}`} value={add.email} onChange={e => setAdd({ ...add, email: e.target.value })} /><Field label="Name" value={add.name} onChange={e => setAdd({ ...add, name: e.target.value })} /></div>
          <div><button className="btn">Add and send invite</button></div>
        </form>
        <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); setMainHolder(org.id, mainEmail.trim().toLowerCase()); toast("Main account holder updated"); }}>
          <h3 className="h3" style={{ fontSize: 16 }}>Main account holder</h3>
          <Field label="Email" type="email" value={mainEmail} onChange={e => setMainEmail(e.target.value)} hint="If they haven't registered yet, they become main holder when they do." />
          <div><button className="btn">Save</button></div>
        </form>
      </div>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="row" style={{ borderTop: "1px solid var(--soft)", paddingTop: 16 }}>
        {org.status === "active"
          ? <button className="btn" onClick={() => { updateOrg(org.id, { status: "suspended" }); toast("Access paused"); }}>Pause access (renewal pending)</button>
          : <button className="btn primary" onClick={() => { updateOrg(org.id, { status: "active" }); toast("Access restored"); }}>Restore access</button>}
        <button className="btn danger" onClick={() => { if (confirm(`Remove ${org.name} from AI Xchange? It leaves the directory and all ${users.length} accounts are deleted.`)) { removeOrg(org.id); close(); toast("Company removed"); } }}>Remove company</button>
      </div>
    </div>
  );
}

export function Individuals({ toast }: { toast: Toast }) {
  const { db, addIndividual, removeIndividual } = useStore();
  const [f, setF] = useState({ email: "", name: "", pikomNo: "", renewal: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="card stack" style={{ gap: 14 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addIndividual(f); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setF({ email: "", name: "", pikomNo: "", renewal: "" }); }}>
        <h2 className="h3">Whitelist an individual member</h2>
        <p className="small muted">For PIKOM individual members not linked to a company. Only this exact email gets full access. If they already have a guest account, it's upgraded automatically.</p>
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
        <thead><tr><th>Name</th><th>Email</th><th>Whitelisted</th><th>Renews</th><th>Status</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{db.individuals.map(i => {
          const u = db.users.find(x => x.email === i.email);
          return <tr key={i.email}><td><b>{i.name}</b></td><td>{i.email}</td><td className="nw">{fmtDate(i.whitelistedOn)}</td><td className="nw">{fmtDate(i.renewal)}</td><td>{u ? <span className="badge green">Registered</span> : <span className="badge orange">Not registered yet</span>}</td>
            <td><button className="btn sm danger" onClick={() => { if (confirm(`Remove ${i.email}?`)) { removeIndividual(i.email); toast("Removed"); } }}>Remove</button></td></tr>;
        })}</tbody>
      </table></div>
    </div>
  );
}

export function People() {
  const { db, removeUser } = useStore();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const list = db.users.filter(u => !["superadmin", "contentadmin"].includes(u.role) && (!role || u.role === role) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const orgName = (u: typeof db.users[0]) => db.orgs.find(o => o.id === u.orgId)?.name || (u.role === "guest" ? u.company || "—" : "Individual");
  const csv = () => {
    const rows = [["Name", "Email", "Company", "Role", "Job title", "Phone", "Joined", "Last sign-in"], ...list.map(u => [u.name, u.email, orgName(u), roleLabel(u.role), u.jobTitle, u.phone, u.createdOn, u.lastSignIn || ""])];
    const url = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "ai-xchange-people.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row between"><div className="row" style={{ flex: "1 1 420px" }}>
        <input className="input" style={{ flex: "1 1 220px", maxWidth: 340, width: "auto" }} aria-label="Search people" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
        <select className="select" style={{ width: "auto" }} aria-label="Role" value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{(["main", "member", "individual", "guest"] as const).map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}</select>
      </div><button className="btn" onClick={csv}>Export to Excel (CSV)</button></div>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Last sign-in</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{list.map(u => <tr key={u.id}><td><b>{u.name}</b><div className="small muted">{u.jobTitle}</div></td><td>{u.email}</td><td>{orgName(u)}</td><td><span className={`badge ${u.role === "guest" ? "" : "green"}`}>{roleLabel(u.role)}</span></td><td>{u.lastSignIn || "—"}</td><td><button className="btn sm danger" onClick={() => { if (confirm(`Remove ${u.name}?`)) removeUser(u.id); }}>Remove</button></td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

export function AdminRoles({ toast }: { toast: Toast }) {
  const { db, me, addStaff, removeStaff } = useStore();
  const [f, setF] = useState({ email: "", name: "" });
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  const staff = db.users.filter(u => u.role === "superadmin" || u.role === "contentadmin" || u.staff);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card stack" style={{ gap: 6 }}>
        <h2 className="h3">Who can do what</h2>
        <p className="small"><b>Super admin</b> — everything: company domains, individual members, people, admin roles, content and reports.</p>
        <p className="small"><b>Content admin</b> — events, insights & policy, announcements, member spotlight, post checks and reports. No access to whitelisting or people.</p>
      </div>
      <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addStaff(f.email, f.name); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setF({ email: "", name: "" }); }}>
        <h2 className="h3">Add a content admin</h2>
        <div className="form-grid"><Field label="PIKOM staff email" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /><Field label="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        {err && <ErrorBox code={err.code} msg={err.msg} />}
        <div><button className="btn primary">Give content admin access</button></div>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last sign-in</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{staff.map(u => <tr key={u.id}><td><b>{u.name}</b></td><td>{u.email}</td><td><span className="badge dark">{u.staff === "super" ? "Super admin" : u.staff === "content" ? "Content admin" : roleLabel(u.role)}</span>{u.staff && <div className="small muted">also {roleLabel(u.role).toLowerCase()}</div>}</td><td>{u.lastSignIn || "—"}</td><td>{u.id !== me!.id && <button className="btn sm danger" onClick={() => { removeStaff(u.id); toast("Access removed"); }}>Remove access</button>}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}
