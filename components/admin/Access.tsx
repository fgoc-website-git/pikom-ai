"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, roleLabel, settingsOf, adminsOf, today, isSuper, type ImportRow, type User } from "@/lib/store";
import { MEMBER_TYPES, COMPANY_CATEGORIES, type MemberType } from "@/lib/options";
import { TIP } from "@/lib/help";
import { Field, ErrorBox, SeatDots, SelectOther, fmtDate, Reveal, Tip, ListBar, Pager, usePaged, useQueryParam, ask, Avatar } from "@/components/ui";

const SR = { position: "absolute" as const, width: 1, height: 1, overflow: "hidden" };
type Toast = (s: string) => void;
type Err = { code: string; msg: string } | null;
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
export const downloadCsv = (name: string, rows: (string | number)[][]) => {
  const url = URL.createObjectURL(new Blob(["﻿" + rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

/* ---------------- Whitelist one company ---------------- */
function AddCompany({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const { db, addOrg } = useStore();
  const [f, setF] = useState({ domain: "", name: "", type: "Ordinary Member" as MemberType, mainEmail: "", pikomNo: "", renewal: "", category: "", about: "" });
  const [err, setErr] = useState<Err>(null);
  return (
    <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); const r = addOrg(f); if (!r.ok) return setErr(r); toast(r.msg || "Added"); onDone(); }}>
      <h2 className="h3">Whitelist a member company</h2>
      <p className="small muted">Do this once the PIKOM membership is confirmed. The company appears in the member directory straight away, and up to {settingsOf(db).defaultSeatLimit} people with this email domain can register. The first admin manages the seats from then on.</p>
      <div className="form-grid">
        <Field label="Company email domain" tip={TIP.domain} required placeholder="company.com.my" value={f.domain} onChange={e => setF({ ...f, domain: e.target.value })} hint="Without the @" />
        <Field label="Registered company name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <label className="field"><span className="lbl">PIKOM membership type</span><select className="select" value={f.type} onChange={e => setF({ ...f, type: e.target.value as MemberType })}>{MEMBER_TYPES.filter(t => t !== "Individual Member").map(t => <option key={t}>{t}</option>)}</select></label>
        <SelectOther label="Directory category" options={COMPANY_CATEGORIES} value={f.category} onChange={v => setF({ ...f, category: v })} />
        <Field label="First company admin email" tip={TIP.firstAdmin} type="email" placeholder={`name@${f.domain || "company.com.my"}`} value={f.mainEmail} onChange={e => setF({ ...f, mainEmail: e.target.value })} hint="Can be set later" />
        <Field label="PIKOM membership no." tip={TIP.pikomNo} value={f.pikomNo} onChange={e => setF({ ...f, pikomNo: e.target.value })} />
        <Field label="Membership renewal date" tip={TIP.renewal} type="date" value={f.renewal} onChange={e => setF({ ...f, renewal: e.target.value })} />
        <Field label="One-line description (directory)" value={f.about} onChange={e => setF({ ...f, about: e.target.value })} hint="The company admin can edit this later" />
      </div>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="row"><button className="btn primary">Whitelist and add to directory</button><button type="button" className="btn" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

/* ---------------- Companies list ---------------- */
export function Companies({ toast }: { toast: Toast }) {
  const { db, seatsUsed } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useQueryParam("filter", "all");
  const [add] = useQueryParam("add");
  const [sort, setSort] = useState("name");
  const [adding, setAdding] = useState(false);
  useEffect(() => { if (add) setAdding(true); }, [add]);
  const t = today();
  const tests: Record<string, (o: typeof db.orgs[0]) => boolean> = {
    all: () => true, nodomain: o => !o.domain, nomain: o => !!o.domain && !adminsOf(db, o.id).length,
    full: o => seatsUsed(o.id) >= o.seatLimit, renewal: o => !!o.renewal && o.renewal >= t && o.renewal <= plus(90), paused: o => o.status === "suspended",
  };
  const list = useMemo(() => db.orgs
    .filter(o => (o.name + " " + o.domain).toLowerCase().includes(q.toLowerCase()))
    .filter(tests[filter] || tests.all)
    .sort((a, b) => sort === "seats" ? seatsUsed(b.id) - seatsUsed(a.id) : sort === "renewal" ? (a.renewal || "9").localeCompare(b.renewal || "9") : sort === "newest" ? b.whitelistedOn.localeCompare(a.whitelistedOn) : a.name.localeCompare(b.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [db, q, filter, sort, seatsUsed]);
  const pg = usePaged(list, 20);
  const n = (k: string) => db.orgs.filter(tests[k]).length;
  return (
    <div className="stack" style={{ gap: 16 }}>
      <ListBar q={q} setQ={setQ} placeholder="Search company or domain" count={list.length} noun="company"
        sorts={[["name", "Name A–Z"], ["newest", "Newest first"], ["seats", "Most seats used"], ["renewal", "Renewal date"]]} sort={sort} setSort={setSort}
        filters={[["all", "All", n("all")], ["nodomain", "Domain needed", n("nodomain")], ["nomain", "No admin yet", n("nomain")], ["full", "Seats full", n("full")], ["renewal", "Renewing in 90 days", n("renewal")], ["paused", "Paused", n("paused")]]} filter={filter} setFilter={setFilter}>
        <Link className="btn" href="/admin/companies/import">Import CSV</Link>
        <button className="btn" onClick={() => downloadCsv("ai-xchange-companies.csv", [["Name", "Domain", "Type", "Seats used", "Seat limit", "Admins", "PIKOM no.", "Renewal", "Status"], ...list.map(o => [o.name, o.domain, o.type, seatsUsed(o.id), o.seatLimit, adminsOf(db, o.id).map(a => a.email).join("; ") || o.mainEmail, o.pikomNo, o.renewal, o.status])])}>Export</button>
        {!adding && <button className="btn primary" onClick={() => setAdding(true)}>+ Whitelist a company</button>}
      </ListBar>
      {adding && <Reveal><AddCompany toast={toast} onDone={() => setAdding(false)} /></Reveal>}
      {list.length === 0 ? <div className="empty">No companies match.</div> : <>
        <div className="table-wrap"><table>
          <thead><tr><th>Company</th><th>Domain <Tip text={TIP.domain} /></th><th>Seats</th><th>Company admins <Tip text={TIP.companyAdmin} /></th><th><span style={SR}>Open</span></th></tr></thead>
          <tbody>{pg.rows.map(o => {
            const admins = adminsOf(db, o.id);
            return (
              <tr key={o.id} className="row-link" onClick={e => { if (!(e.target as HTMLElement).closest("a,button")) router.push(`/admin/companies/${o.id}`); }}>
                <td><b>{o.name}</b>{o.status !== "active" && <> <span className="badge red">Paused</span></>}<div className="small muted">{o.type.replace(" Member", "")}{o.renewal ? ` · renews ${fmtDate(o.renewal)}` : ""}</div></td>
                <td>{o.domain ? `@${o.domain}` : <span className="badge red">Domain needed</span>}</td>
                <td><SeatDots used={seatsUsed(o.id)} limit={o.seatLimit} /></td>
                <td>{admins.length ? admins.map(a => <div key={a.id}>{a.name}</div>) : o.mainEmail ? <span className="small">{o.mainEmail}<br /><span className="badge orange">Not registered yet</span></span> : <span className="badge">Not set</span>}</td>
                <td><Link className="btn sm" href={`/admin/companies/${o.id}`}>Manage</Link></td>
              </tr>);
          })}</tbody>
        </table></div>
        <Pager {...pg} />
      </>}
    </div>
  );
}

/* ---------------- CSV import ---------------- */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.map(r => r.map(x => x.trim())).filter(r => r.some(Boolean));
}
const HEADS: [keyof ImportRow, RegExp][] = [["name", /name|company/i], ["domain", /domain/i], ["type", /type/i], ["mainEmail", /admin|email|contact/i], ["pikomNo", /pikom|member.*no|no\.?$/i], ["renewal", /renew/i], ["category", /categ/i], ["about", /about|desc/i]];
export function CompanyImport() {
  const { db, importOrgs } = useStore();
  const router = useRouter();
  const [text, setText] = useState("");
  const [res, setRes] = useState<{ ok: boolean; msg?: string; code?: string } | null>(null);
  const rows = useMemo(() => {
    const all = parseCsv(text); if (!all.length) return [];
    const head = all[0]; const hasHead = HEADS.some(([, re]) => head.some(h => re.test(h))) && !head.some(h => /\.[a-z]{2,}$/.test(h) && !/\s/.test(h) && h.includes("."));
    const map = hasHead ? HEADS.map(([k, re]) => [k, head.findIndex(h => re.test(h))] as const) : HEADS.map(([k], i) => [k, i] as const);
    return (hasHead ? all.slice(1) : all).map(r => {
      const o = Object.fromEntries(map.map(([k, i]) => [k, i >= 0 ? r[i] || "" : ""])) as ImportRow;
      o.type = (MEMBER_TYPES as readonly string[]).find(t => t.toLowerCase().startsWith((o.type || "").toLowerCase().split(" ")[0] || "#")) as MemberType || "Ordinary Member";
      const dom = o.domain.toLowerCase().replace(/^@/, "");
      const exists = db.orgs.find(x => (dom && x.domain === dom) || x.name.toLowerCase() === o.name.toLowerCase());
      const problem = !o.name ? "Name missing" : dom && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom) ? "Invalid domain" : o.mainEmail && dom && !o.mainEmail.toLowerCase().endsWith("@" + dom) ? `Admin email not on @${dom}` : "";
      return { o, status: problem || (exists ? `Update ${exists.name}` : "New") , problem: !!problem };
    });
  }, [text, db]);
  const good = rows.filter(r => !r.problem);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <Link href="/admin/companies" className="small">← Companies</Link>
      <div className="card stack" style={{ gap: 12 }}>
        <h2 className="h3">1. Add your file <Tip text={TIP.csv} /></h2>
        <p className="small muted">Columns: <b>name</b>, domain, type, admin email, PIKOM no., renewal (YYYY-MM-DD), category, about. A header row is optional. Export from Excel with “Save as CSV”.</p>
        <div className="row">
          <label className="btn">Choose CSV file<input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={async e => { const f = e.target.files?.[0]; if (f) setText(await f.text()); }} /></label>
          <button className="btn" onClick={() => downloadCsv("ai-xchange-import-template.csv", [["name", "domain", "type", "admin email", "pikom no", "renewal", "category", "about"], ["Example Sdn. Bhd.", "example.com.my", "Ordinary Member", "ceo@example.com.my", "P-1234", "2027-10-14", "AI Platform", "What the company does"]])}>Download template</button>
        </div>
        <textarea className="textarea" rows={6} placeholder="…or paste rows here" value={text} onChange={e => { setText(e.target.value); setRes(null); }} />
      </div>
      {rows.length > 0 && (
        <div className="card stack" style={{ gap: 12 }}>
          <div className="row between"><h2 className="h3">2. Check the preview</h2><span className="small muted">{good.length} ready · {rows.length - good.length} with problems (skipped)</span></div>
          <div className="table-wrap" style={{ maxHeight: 420, overflow: "auto" }}><table>
            <thead><tr><th>Company</th><th>Domain</th><th>Type</th><th>Admin email</th><th>Renewal</th><th>Result</th></tr></thead>
            <tbody>{rows.slice(0, 300).map((r, i) => <tr key={i}><td><b>{r.o.name || "—"}</b></td><td>{r.o.domain || <span className="muted">—</span>}</td><td className="small">{r.o.type}</td><td className="small">{r.o.mainEmail || "—"}</td><td className="small nw">{r.o.renewal || "—"}</td><td><span className={`badge ${r.problem ? "red" : r.status === "New" ? "green" : "blue"}`}>{r.status}</span></td></tr>)}</tbody>
          </table></div>
          {res && (res.ok ? <div className="alert ok">{res.msg}</div> : <ErrorBox code={res.code} msg={res.msg || ""} />)}
          <div className="row">
            <button className="btn primary" disabled={!good.length} onClick={() => { const r = importOrgs(good.map(g => g.o)); setRes(r); if (r.ok) setText(""); }}>Import {good.length} compan{good.length === 1 ? "y" : "ies"}</button>
            {res?.ok && <button className="btn" onClick={() => router.push("/admin/companies")}>Back to companies</button>}
          </div>
        </div>)}
    </div>
  );
}

/* ---------------- Individual members ---------------- */
export function Individuals({ toast }: { toast: Toast }) {
  const { db, addIndividual, removeIndividual } = useStore();
  const [f, setF] = useState({ email: "", name: "", pikomNo: "", renewal: "" });
  const [err, setErr] = useState<Err>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const reg = (e: string) => db.users.some(x => x.email === e);
  const list = db.individuals.filter(i => (i.name + i.email).toLowerCase().includes(q.toLowerCase())).filter(i => filter === "all" || (filter === "reg" ? reg(i.email) : !reg(i.email)));
  const pg = usePaged(list, 20);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="card stack" style={{ gap: 14 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addIndividual(f); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setF({ email: "", name: "", pikomNo: "", renewal: "" }); }}>
        <h2 className="h3">Whitelist an individual member <Tip text={TIP.individual} /></h2>
        <div className="form-grid">
          <Field label="Email" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} hint="Personal email is fine" />
          <Field label="Full name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <Field label="PIKOM membership no." tip={TIP.pikomNo} value={f.pikomNo} onChange={e => setF({ ...f, pikomNo: e.target.value })} />
          <Field label="Renewal date" tip={TIP.renewal} type="date" value={f.renewal} onChange={e => setF({ ...f, renewal: e.target.value })} />
        </div>
        {err && <ErrorBox code={err.code} msg={err.msg} />}
        <div><button className="btn primary">Whitelist email</button></div>
      </form>
      <ListBar q={q} setQ={setQ} placeholder="Search name or email" count={list.length} noun="individual member"
        filters={[["all", "All", db.individuals.length], ["reg", "Registered", db.individuals.filter(i => reg(i.email)).length], ["not", "Not registered yet", db.individuals.filter(i => !reg(i.email)).length]]} filter={filter} setFilter={setFilter} />
      {list.length === 0 ? <div className="empty">No individual members match.</div> : <>
        <div className="table-wrap"><table>
          <thead><tr><th>Person</th><th>Whitelisted</th><th>Renews</th><th>Status</th><th><span style={SR}>Actions</span></th></tr></thead>
          <tbody>{pg.rows.map(i => {
            const u = db.users.find(x => x.email === i.email);
            return <tr key={i.email}><td><b>{u ? <Link href={`/admin/people/${u.id}`}>{i.name}</Link> : i.name}</b><div className="small" style={{ wordBreak: "break-all" }}>{i.email}</div></td><td className="nw">{fmtDate(i.whitelistedOn)}</td><td className="nw">{fmtDate(i.renewal)}</td><td>{u ? <span className="badge green">Registered</span> : <span className="badge orange">Not registered yet</span>}</td>
              <td><button className="btn sm danger" onClick={async () => { if (await ask(`Remove ${i.email}?`, { danger: true, detail: "Their individual membership access ends and their account is removed." })) removeIndividual(i.email); }}>Remove</button></td></tr>;
          })}</tbody>
        </table></div>
        <Pager {...pg} />
      </>}
    </div>
  );
}

/* ---------------- People ---------------- */
export const orgNameOf = (db: ReturnType<typeof useStore>["db"], u: User) => db.orgs.find(o => o.id === u.orgId)?.name || (u.role === "guest" ? u.company || "—" : u.role === "individual" ? "Individual member" : "PIKOM");
export function People() {
  const { db } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [role, setRole] = useQueryParam("role", "all");
  const [sort, setSort] = useState("name");
  const roles = ["main", "editor", "member", "individual", "guest"] as const;
  const list = db.users.filter(u => (role === "all" || u.role === role || (role === "staff" && (u.staff || u.role === "superadmin" || u.role === "contentadmin"))) && (u.name + " " + u.email + " " + orgNameOf(db, u)).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === "recent" ? (b.lastSignIn || "").localeCompare(a.lastSignIn || "") : sort === "joined" ? b.createdOn.localeCompare(a.createdOn) : a.name.localeCompare(b.name));
  const pg = usePaged(list, 25);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <ListBar q={q} setQ={setQ} placeholder="Search name, email or company" count={list.length} noun="person"
        sorts={[["name", "Name A–Z"], ["recent", "Last signed in"], ["joined", "Newest accounts"]]} sort={sort} setSort={setSort}
        filters={[["all", "All", db.users.length], ...roles.map(r => [r, roleLabel(r), db.users.filter(u => u.role === r).length] as [string, string, number]), ["staff", "Site admins", db.users.filter(u => u.staff || u.role === "superadmin" || u.role === "contentadmin").length]]} filter={role} setFilter={setRole}>
        <button className="btn" onClick={() => downloadCsv("ai-xchange-people.csv", [["Name", "Email", "Company", "Role", "Job title", "Phone", "Joined", "Last sign-in"], ...list.map(u => [u.name, u.email, orgNameOf(db, u), roleLabel(u.role), u.jobTitle, u.phone, u.createdOn, u.lastSignIn || ""])])}>Export to Excel (CSV)</button>
      </ListBar>
      {list.length === 0 ? <div className="empty">Nobody matches.</div> : <>
        <div className="table-wrap"><table>
          <thead><tr><th>Person</th><th>Company</th><th>Role</th><th>Last sign-in</th><th><span style={SR}>Open</span></th></tr></thead>
          <tbody>{pg.rows.map(u => <tr key={u.id} className="row-link" onClick={e => { if (!(e.target as HTMLElement).closest("a,button")) router.push(`/admin/people/${u.id}`); }}>
            <td><b>{u.name}</b>{u.staff && <span className="badge dark" style={{ marginLeft: 6 }}>{u.staff === "super" ? "Super admin" : "PIKOM admin"}</span>}<div className="small muted">{u.jobTitle}</div><div className="small" style={{ wordBreak: "break-all" }}>{u.email}</div></td>
            <td>{u.orgId ? <Link href={`/admin/companies/${u.orgId}`}>{orgNameOf(db, u)}</Link> : orgNameOf(db, u)}</td>
            <td><span className={`badge ${u.role === "guest" ? "" : u.role === "main" ? "blue" : "green"}`}>{roleLabel(u.role)}</span></td>
            <td className="small">{u.lastSignIn || "—"}</td>
            <td><Link className="btn sm" href={`/admin/people/${u.id}`}>Open</Link></td></tr>)}</tbody>
        </table></div>
        <Pager {...pg} />
      </>}
    </div>
  );
}

/* ---------------- One person ---------------- */
export function PersonDetail({ id, toast }: { id: string; toast: Toast }) {
  const { db, me, removeUser, resetPassword, setCompanyRole, addStaff, removeStaff } = useStore();
  const router = useRouter();
  const [err, setErr] = useState<Err>(null);
  const u = db.users.find(x => x.id === id);
  if (!u) return <div className="stack"><ErrorBox code="AX-404" msg="This person isn't on AI Xchange (they may have been removed)." /><Link href="/admin/people">← People</Link></div>;
  const org = u.orgId ? db.orgs.find(o => o.id === u.orgId) : null;
  const evs = db.events.filter(e => e.registrations.some(r => r.userId === u.id && r.status !== "cancelled"));
  const posts = [...db.jobs.filter(j => j.postedBy === u.email).map(j => ({ t: j.title, k: "Job", d: j.postedOn })), ...db.rfps.filter(r => r.postedBy === u.email).map(r => ({ t: r.title, k: "RFP", d: r.postedOn }))];
  const self = u.id === me!.id;
  const r = (x: { ok: boolean; code?: string; msg?: string }, okMsg: string) => { if (!x.ok) setErr(x as Err); else { setErr(null); toast(x.msg || okMsg); } };
  return (
    <div className="stack" style={{ gap: 16 }}>
      <Link href="/admin/people" className="small">← People</Link>
      <div className="card row between" style={{ gap: 16 }}>
        <div className="row" style={{ flexWrap: "nowrap", gap: 14 }}>
          <Avatar name={u.name} round lg />
          <div className="stack" style={{ gap: 4 }}>
            <h2 className="h2">{u.name}</h2>
            <span className="small muted">{u.jobTitle || "—"} · {u.email}{u.phone ? ` · ${u.phone}` : ""}</span>
            <span className="row" style={{ gap: 6 }}><span className="badge blue">{roleLabel(u.role)}</span>{u.staff && <span className="badge dark">{u.staff === "super" ? "Super admin" : "PIKOM admin"}</span>}{org ? <Link className="badge" href={`/admin/companies/${org.id}`}>{org.name}</Link> : <span className="badge">{orgNameOf(db, u)}</span>}</span>
          </div>
        </div>
        <div className="small muted stack" style={{ gap: 2, textAlign: "right" }}><span>Joined {fmtDate(u.createdOn)}</span><span>Last sign-in {u.lastSignIn || "—"}</span></div>
      </div>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="grid2">
        <div className="card stack" style={{ gap: 12 }}>
          <h3 className="h3">Access</h3>
          {org && <label className="field"><span className="lbl">Company role<Tip text={TIP.companyRoles} /></span>
            <select className="select" value={u.role} onChange={e => r(setCompanyRole(u.id, e.target.value as User["role"]), "Role updated")}>{(["main", "editor", "member"] as const).map(x => <option key={x} value={x}>{roleLabel(x)}</option>)}</select></label>}
          <div className="row" style={{ gap: 8 }}>
            {!u.staff && u.role !== "superadmin" && u.role !== "contentadmin" && <>
              <button className="btn sm" onClick={async () => { if (await ask(`Make ${u.name} a PIKOM admin?`, { danger: false, ok: "Give access", detail: TIP.pikomAdmin })) r(addStaff(u.email, u.name, "content"), "Access given"); }}>Make PIKOM admin</button>
              <button className="btn sm" onClick={async () => { if (await ask(`Make ${u.name} a super admin?`, { danger: false, ok: "Give access", detail: TIP.superAdmin })) r(addStaff(u.email, u.name, "super"), "Access given"); }}>Make super admin</button></>}
            {(u.staff || u.role === "superadmin" || u.role === "contentadmin") && !self && <button className="btn sm danger" onClick={async () => { if (await ask(`Remove ${u.name}'s site admin access?`, { ok: "Remove access" })) { removeStaff(u.id); toast("Site admin access removed"); } }}>Remove site admin access</button>}
          </div>
          <h3 className="h3" style={{ marginTop: 6 }}>Account</h3>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn sm" onClick={async () => { if (await ask(`Reset ${u.name}'s password to demo1234?`, { danger: false, ok: "Reset password", detail: "They'll be signed out everywhere and should change it after signing in." })) r(resetPassword(u.id), "Password reset"); }}>Reset password</button>
            {!self && <button className="btn sm danger" onClick={async () => { if (await ask(`Remove ${u.name} from AI Xchange?`, { detail: org ? `Their seat at ${org.name} is freed.` : undefined })) { removeUser(u.id); router.push("/admin/people"); } }}>Remove account</button>}
          </div>
        </div>
        <div className="card stack" style={{ gap: 8 }}>
          <h3 className="h3">Events ({evs.length})</h3>
          {evs.length === 0 ? <p className="small muted">No event registrations.</p> : evs.map(e => { const reg = e.registrations.find(x => x.userId === u.id)!; return <Link key={e.id} href={`/admin/events/${e.id}`} className="row between small" style={{ color: "var(--ink)" }}><span>{e.title}</span><span className={`badge ${reg.status === "confirmed" ? "green" : "orange"}`}>{reg.status === "confirmed" ? (reg.attended ? "Attended" : "Confirmed") : "Waitlist"}</span></Link>; })}
          <h3 className="h3" style={{ marginTop: 6 }}>Posts ({posts.length})</h3>
          {posts.length === 0 ? <p className="small muted">Nothing posted.</p> : posts.map((p, i) => <div key={i} className="small row between"><span>{p.t}</span><span className="muted">{p.k} · {fmtDate(p.d)}</span></div>)}
        </div>
      </div>
      {u.bio && <div className="card"><h3 className="h3">About</h3><p className="small">{u.bio}</p></div>}
    </div>
  );
}

/* ---------------- Site admins ---------------- */
export function AdminRoles({ toast }: { toast: Toast }) {
  const { db, me, addStaff, removeStaff } = useStore();
  const [f, setF] = useState({ email: "", name: "", level: "content" as "content" | "super" });
  const [err, setErr] = useState<Err>(null);
  const staff = db.users.filter(u => u.role === "superadmin" || u.role === "contentadmin" || u.staff);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="grid2">
        <div className="card stack" style={{ gap: 4 }}><span className="badge dark" style={{ alignSelf: "flex-start" }}>Super admin</span><p className="small">{TIP.superAdmin}</p></div>
        <div className="card stack" style={{ gap: 4 }}><span className="badge dark" style={{ alignSelf: "flex-start" }}>PIKOM admin</span><p className="small">{TIP.pikomAdmin}</p></div>
      </div>
      <form className="card stack" style={{ gap: 12 }} onSubmit={e => { e.preventDefault(); setErr(null); const r = addStaff(f.email, f.name, f.level); if (!r.ok) return setErr(r); toast(r.msg || "Added"); setF({ email: "", name: "", level: "content" }); }}>
        <h2 className="h3">Give site admin access</h2>
        <div className="form-grid"><Field label="Email" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} hint="Can be someone who already has a member account" /><Field label="Name (new accounts only)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <label className="field"><span className="lbl">Access<Tip text={`${TIP.superAdmin} ${TIP.pikomAdmin}`} /></span><select className="select" value={f.level} onChange={e => setF({ ...f, level: e.target.value as "content" | "super" })}><option value="content">PIKOM admin</option><option value="super">Super admin</option></select></label></div>
        {err && <ErrorBox code={err.code} msg={err.msg} />}
        <div><button className="btn primary">Give access</button></div>
        <p className="small muted">New accounts get the temporary password demo1234.</p>
      </form>
      <div className="table-wrap"><table>
        <thead><tr><th>Person</th><th>Site role</th><th>Last sign-in</th><th><span style={SR}>Actions</span></th></tr></thead>
        <tbody>{staff.map(u => <tr key={u.id}><td><b><Link href={`/admin/people/${u.id}`}>{u.name}</Link></b><div className="small" style={{ wordBreak: "break-all" }}>{u.email}</div></td><td><span className="badge dark">{u.staff === "super" || u.role === "superadmin" ? "Super admin" : "PIKOM admin"}</span>{u.staff && <div className="small muted">also {roleLabel(u.role).toLowerCase()}</div>}</td><td className="small">{u.lastSignIn || "—"}</td><td>{u.id !== me!.id && <button className="btn sm danger" onClick={async () => { if (await ask(`Remove ${u.name}'s site admin access?`, { ok: "Remove access", detail: u.orgId ? "They keep their member account." : "Their admin-only account is removed." })) { removeStaff(u.id); toast("Access removed"); } }}>Remove access</button>}</td></tr>)}</tbody>
      </table></div>
    </div>
  );
}

/* ---------------- Site settings ---------------- */
export function SiteSettings({ toast }: { toast: Toast }) {
  const { db, updateSettings } = useStore();
  const [f, setF] = useState(settingsOf(db));
  const [err, setErr] = useState<Err>(null);
  useEffect(() => setF(settingsOf(db)), [db.settings]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (e: React.FormEvent) => { e.preventDefault(); const r = updateSettings(f); if (!r.ok) setErr(r); else { setErr(null); toast(r.msg || "Saved"); } };
  return (
    <form className="stack" style={{ gap: 16 }} onSubmit={save}>
      {err && <ErrorBox code={err.code} msg={err.msg} />}
      <div className="card stack" style={{ gap: 12 }}>
        <h2 className="h3">Home page figures</h2>
        <div className="form-grid">
          <Field label="PIKOM member companies" tip={TIP.statMembers} value={f.memberCompaniesStat} onChange={e => setF({ ...f, memberCompaniesStat: e.target.value })} />
          <Field label="Companies on AI Xchange" tip={TIP.statCompanies} value={f.companiesStat} onChange={e => setF({ ...f, companiesStat: e.target.value })} hint={`Live count today: ${db.orgs.length}`} />
        </div>
      </div>
      <div className="card stack" style={{ gap: 12 }}>
        <h2 className="h3">Secretariat contact</h2>
        <p className="small muted">Shown on the Membership page and in help messages.</p>
        <div className="form-grid">
          <Field label="Email" type="email" value={f.secretariatEmail} onChange={e => setF({ ...f, secretariatEmail: e.target.value })} placeholder="secretariat@pikom.org.my" />
          <Field label="Phone" type="tel" value={f.secretariatPhone} onChange={e => setF({ ...f, secretariatPhone: e.target.value })} placeholder="+60 3-…" />
        </div>
      </div>
      <div className="card stack" style={{ gap: 12 }}>
        <h2 className="h3">Company limits</h2>
        <div className="form-grid">
          <Field label="Default seats per company" tip={TIP.defaultSeats} type="number" min={1} max={50} value={f.defaultSeatLimit} onChange={e => setF({ ...f, defaultSeatLimit: Number(e.target.value) })} />
          <Field label="Max company admins" tip={TIP.maxAdmins} type="number" min={1} max={5} value={f.maxAdmins} onChange={e => setF({ ...f, maxAdmins: Number(e.target.value) })} />
        </div>
      </div>
      <div className="card stack" style={{ gap: 8 }}>
        <h2 className="h3">Announcement banner</h2>
        <p className="small muted">Managed under <Link href="/admin/announcements">Content → Announcements</Link>.</p>
      </div>
      <div><button className="btn primary">Save settings</button></div>
    </form>
  );
}


