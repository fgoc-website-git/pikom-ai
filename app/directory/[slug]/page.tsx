"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { companies } from "@/lib/directory";
import { Avatar } from "@/components/ui";

export default function Profile() {
  const { slug } = useParams<{ slug: string }>();
  const { db, me, ready } = useStore();
  const c = companies(db).find(x => x.slug === slug);
  if (!ready) return <div className="wrap page-head muted">Loading…</div>;
  if (!c) return <div className="wrap page-head"><div className="empty">Member not found. <Link href="/directory">Back to directory</Link></div></div>;
  const p = c.org?.profile;
  const team = c.org ? db.users.filter(u => u.orgId === c.org!.id && u.showInDirectory) : [];
  const jobs = c.org ? db.jobs.filter(j => j.orgId === c.org!.id) : [];
  return (
    <div className="wrap page-head">
      <Link href="/directory" className="small">← Directory</Link>
      <div className="card row" style={{ gap: 20, marginTop: 12, alignItems: "flex-start" }}>
        <Avatar name={c.name} logo={c.logo} lg />
        <div className="stack" style={{ flex: "1 1 360px", gap: 8 }}>
          <h1 className="h2">{c.name}</h1>
          <div className="row" style={{ gap: 6 }}><span className="badge green">Verified PIKOM member</span>{c.org && <span className="badge">{c.org.type}</span>}{c.category && <span className="badge">{c.category}</span>}{c.onXchange && <span className="badge blue">On AI Xchange</span>}</div>
          <p style={{ fontSize: 16 }}>{c.tagline}</p>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          {p?.website && <a className="btn" href={p.website} target="_blank" rel="noreferrer">Website ↗</a>}
          {p?.linkedin && <a className="btn" href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 16, alignItems: "start" }}>
        <div className="card stack" style={{ gap: 14 }}>
          <h2 className="h3">Company details</h2>
          <dl className="kv">
            <dt>AI capabilities</dt><dd>{c.capabilities.join(", ") || "—"}</dd>
            <dt>Industries served</dt><dd>{p?.industries.join(", ") || "—"}</dd>
            <dt>Headquarters</dt><dd>{p?.state || "—"}</dd>
            <dt>Company size</dt><dd>{p?.employees ? `${p.employees} employees` : "—"}</dd>
            <dt>Phone</dt><dd>{me ? p?.phone || "—" : "Members only"}</dd>
          </dl>
          {!c.onXchange && <p className="small muted">This member hasn't activated AI Xchange yet, so the details shown come from the PIKOM member list.</p>}
        </div>
        <div className="card stack" style={{ gap: 12 }}>
          <h2 className="h3">People on AI Xchange</h2>
          {!me ? <p className="muted">Sign in to see who from {c.name} is on AI Xchange and connect with them. <Link href="/signin">Sign in</Link></p>
            : team.length === 0 ? <p className="muted">Nobody from this company is visible yet.</p>
            : <div className="list">{team.map(u => (
              <div key={u.id} className="row" style={{ padding: "10px 0", flexWrap: "nowrap" }}>
                <Avatar name={u.name} round />
                <div className="stack" style={{ gap: 0, flex: 1, minWidth: 0 }}><b>{u.name}</b><span className="small muted">{u.jobTitle || "—"}</span></div>
                {u.linkedin ? <a className="btn sm" href={u.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : <a className="btn sm" href={`mailto:${u.email}`}>Email</a>}
              </div>))}</div>}
        </div>
      </div>
      {jobs.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row between"><h2 className="h3">Open roles</h2><Link href="/jobs" className="small">All jobs</Link></div>
          <div className="list" style={{ marginTop: 8 }}>{jobs.map(j => <div key={j.id} style={{ padding: "10px 0" }}><b>{j.title}</b><div className="small muted">{j.location} · {j.mode}</div></div>)}</div>
        </div>
      )}
    </div>
  );
}
