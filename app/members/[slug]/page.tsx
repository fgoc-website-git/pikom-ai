"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore, roleLabel } from "@/lib/store";
import { companies } from "@/lib/directory";
import { Avatar, Locked } from "@/components/ui";

export default function Profile() {
  const { slug } = useParams<{ slug: string }>();
  const { db, full, ready } = useStore();
  const c = companies(db).find(x => x.slug === slug);
  if (!ready) return <div className="wrap page-head muted">Loading…</div>;
  if (!c) return <div className="wrap page-head"><div className="empty">Member not found. <Link href="/members">Back to members</Link></div></div>;
  const p = c.org.profile;
  const team = db.users.filter(u => u.orgId === c.org.id);
  const jobs = db.jobs.filter(j => j.orgId === c.org.id && !j.hidden);
  const rfps = db.rfps.filter(r => r.orgId === c.org.id && r.status === "Open" && !r.hidden);
  return (
    <div className="wrap page-head">
      <Link href="/members" className="small">← Members</Link>
      <div className="card row" style={{ gap: 20, marginTop: 12, alignItems: "flex-start" }}>
        <Avatar name={c.name} logo={c.logo} lg />
        <div className="stack" style={{ flex: "1 1 360px", gap: 8 }}>
          <h1 className="h2">{c.org.name}</h1>
          <div className="row" style={{ gap: 6 }}><span className="badge green">Verified PIKOM member</span><span className="badge">{c.org.type}</span>{c.category && <span className="badge">{c.category}</span>}</div>
          {full ? <p style={{ fontSize: 16 }}>{c.tagline}</p> : null}
        </div>
        {full && <div className="stack" style={{ gap: 8 }}>
          {p.website && <a className="btn" href={p.website} target="_blank" rel="noreferrer">Website ↗</a>}
          {p.linkedin && <a className="btn" href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
        </div>}
      </div>

      {!full ? <div style={{ marginTop: 16 }}><Locked what="company details, people and contact information" /></div> : <>
        <div className="card stack" style={{ gap: 14, marginTop: 16 }}>
          <h2 className="h3">Company details</h2>
          <dl className="kv">
            <dt>AI capabilities</dt><dd>{c.capabilities.join(", ") || "—"}</dd>
            <dt>Industries served</dt><dd>{p.industries.join(", ") || "—"}</dd>
            <dt>Headquarters</dt><dd>{p.state || "—"}</dd>
            <dt>Company size</dt><dd>{p.employees ? `${p.employees} employees` : "—"}</dd>
            <dt>General enquiries</dt><dd>{p.phone || "—"}</dd>
          </dl>
        </div>
        <div className="stack" style={{ gap: 10, marginTop: 16 }}>
          <div className="row between"><h2 className="h3">People from {c.name} ({team.length})</h2><span className="small muted">Visible to PIKOM members only</span></div>
          {team.length === 0 ? <div className="empty">Nobody from {c.name} has activated their AI Xchange account yet.</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Job title</th><th>Email</th><th>Phone</th><th>LinkedIn</th></tr></thead>
              <tbody>{team.map(u => (
                <tr key={u.id}>
                  <td><div className="row" style={{ flexWrap: "nowrap", gap: 10 }}><Avatar name={u.name} round /><span><b>{u.name}</b>{u.role === "main" && <div className="small muted">{roleLabel(u.role)}</div>}</span></div></td>
                  <td>{u.jobTitle || "—"}</td>
                  <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                  <td>{u.phone ? <a href={`tel:${u.phone.replace(/\s/g, "")}`}>{u.phone}</a> : "—"}</td>
                  <td>{u.linkedin ? <a href={u.linkedin} target="_blank" rel="noreferrer">Profile ↗</a> : "—"}</td>
                </tr>))}</tbody>
            </table></div>)}
        </div>
      </>}

      {(jobs.length > 0 || rfps.length > 0) && (
        <div className="grid2" style={{ marginTop: 16, alignItems: "start" }}>
          {rfps.length > 0 && <div className="card"><div className="row between"><h2 className="h3">Open RFPs</h2><Link href="/opportunities" className="small">All opportunities</Link></div><div className="list" style={{ marginTop: 8 }}>{rfps.map(r => <div key={r.id} style={{ padding: "10px 0" }}><b>{r.title}</b><div className="small muted">{r.sector}</div></div>)}</div></div>}
          {jobs.length > 0 && <div className="card"><div className="row between"><h2 className="h3">Open roles</h2><Link href="/opportunities?tab=jobs" className="small">All jobs</Link></div><div className="list" style={{ marginTop: 8 }}>{jobs.map(j => <div key={j.id} style={{ padding: "10px 0" }}><b>{j.title}</b><div className="small muted">{j.location} · {j.mode}</div></div>)}</div></div>}
        </div>)}
    </div>
  );
}
