"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore, today } from "@/lib/store";
import { companies } from "@/lib/directory";
import { Avatar, fmtDate } from "@/components/ui";
import { EventCard } from "@/components/EventCard";

export default function Home() {
  const { db, me, full } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [where, setWhere] = useState("members");
  const all = companies(db);
  const spotlight = db.spotlight.map(id => all.find(c => c.org.id === id)).filter(Boolean) as typeof all;
  const jobs = db.jobs.filter(j => !j.hidden).sort((a, b) => b.postedOn.localeCompare(a.postedOn)).slice(0, 4);
  const rfps = db.rfps.filter(r => r.status === "Open" && !r.hidden).slice(0, 3);
  const events = db.events.filter(e => e.status === "Published" && e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const featured = db.content.filter(c => c.published).sort((a, b) => Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date)).slice(0, 4);
  const people = db.users.filter(u => ["main", "member", "individual"].includes(u.role)).length;

  return (
    <>
      <section className="hero"><div className="wrap stack" style={{ padding: "60px 24px 44px", gap: 22 }}>
        <span className="eyebrow" style={{ color: "#93C5FD" }}>Malaysia's AI industry network · by PIKOM</span>
        <h1 className="h1" style={{ fontSize: 46, maxWidth: 860 }}>Find verified AI partners, talent and opportunities — in one trusted network.</h1>
        <p className="lead">AI Xchange is where PIKOM members share information and connect.</p>
        <form role="search" onSubmit={e => { e.preventDefault(); router.push(`/${where}?q=${encodeURIComponent(q)}`); }} className="row" style={{ gap: 0, background: "#fff", borderRadius: 12, padding: 6, maxWidth: 820 }}>
          <label htmlFor="where" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search in</label>
          <select id="where" value={where} onChange={e => setWhere(e.target.value)} className="select" style={{ width: "auto", border: 0, background: "var(--soft)", color: "var(--ink)" }}>
            <option value="members">Members</option><option value="opportunities">Opportunities</option>
          </select>
          <label htmlFor="q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search</label>
          <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. computer vision, Bahasa LLM, fraud detection" className="input" style={{ flex: "1 1 240px", border: 0, width: "auto", color: "var(--ink)" }} />
          <button className="btn primary">Search</button>
        </form>
        <div className="row">
          {full ? <><Link className="btn accent" href="/opportunities?tab=jobs&post=1">Post a job</Link><Link className="btn ghost-dark" href="/opportunities">Find opportunities</Link><Link className="btn ghost-dark" href="/members">Find a partner</Link></>
            : <><Link className="btn accent" href="/membership">Become a PIKOM member</Link>{!me && <Link className="btn ghost-dark" href="/register">Already a member? Activate access</Link>}</>}
        </div>
        <div className="grid" style={{ borderTop: "1px solid #1E3A5F", paddingTop: 22, gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
          {[["2,000+", "PIKOM member companies"], [String(db.orgs.length), "Member companies on AI Xchange"], [String(people), "Members signed in"], [String(db.rfps.filter(r => r.status === "Open").length + db.jobs.length), "Open opportunities"]].map(([n, l]) => (
            <div key={l} className="stack" style={{ gap: 2 }}><span style={{ fontFamily: "Manrope", fontSize: 30, fontWeight: 800 }}>{n}</span><span className="small" style={{ color: "#CBD5E1" }}>{l}</span></div>))}
        </div>
      </div></section>

      {!full && (
        <section className="wrap section">
          <h2 className="h2">How access works</h2>
          <p className="muted" style={{ margin: "6px 0 20px" }}>Membership is handled by PIKOM. There's no payment on this site.</p>
          <div className="grid2">
            <div className="card stack" style={{ gap: 8 }}><span className="badge green" style={{ alignSelf: "flex-start" }}>Full access</span><h3 className="h3">PIKOM members</h3>
              <p className="muted" style={{ fontSize: 14 }}>Once PIKOM whitelists your company domain, up to 5 colleagues activate with their work email. Individual members use the email PIKOM has on record. See every member's details and contacts, RFPs, jobs and members-only events.</p>
              <Link className="btn primary sm" style={{ alignSelf: "flex-start" }} href="/register">Activate access</Link></div>
            <div className="card stack" style={{ gap: 8 }}><span className="badge" style={{ alignSelf: "flex-start" }}>Limited</span><h3 className="h3">Free guest account</h3>
              <p className="muted" style={{ fontSize: 14 }}>Anyone can sign up. Read policy and insights, see which companies are members and browse listings. Details, contacts and applying are for members.</p>
              <Link className="btn sm" style={{ alignSelf: "flex-start" }} href="/register">Create a free account</Link></div>
          </div>
        </section>)}

      <section className="wrap section">
        <div className="row between" style={{ marginBottom: 16 }}><h2 className="h2">Upcoming events</h2><Link href="/events" className="small" style={{ fontWeight: 600 }}>All events</Link></div>
        <div className="grid">{events.map(e => <EventCard key={e.id} e={e} />)}</div>
      </section>

      <section className="wrap section" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div className="card" style={{ flex: "999 1 520px", minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}><h2 className="h3" style={{ fontSize: 22 }}>Open RFPs</h2><Link href="/opportunities" className="small" style={{ fontWeight: 600 }}>View all</Link></div>
          <div className="list">{rfps.map(r => (
            <div key={r.id} className="row between" style={{ padding: "12px 0" }}>
              <div className="stack" style={{ gap: 2, flex: "1 1 280px", minWidth: 0 }}><span style={{ fontWeight: 600 }}>{r.title}</span><span className="small muted">{r.sector} · closes {fmtDate(r.closes)}</span></div>
              {full ? <span className="badge green">{r.budget}</span> : <span className="badge">Budget: members only</span>}
            </div>))}</div>
        </div>
        <div className="card" style={{ flex: "1 1 360px", minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}><h2 className="h3" style={{ fontSize: 22 }}>Latest AI jobs</h2><Link href="/opportunities?tab=jobs" className="small" style={{ fontWeight: 600 }}>All jobs</Link></div>
          <div className="list">{jobs.map(j => (
            <Link key={j.id} href="/opportunities?tab=jobs" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 0", color: "var(--ink)" }}>
              <span style={{ fontWeight: 600 }}>{j.title}</span><span className="small muted">{j.company} · {j.location} · {j.mode}</span>
            </Link>))}</div>
        </div>
      </section>

      <section className="wrap section">
        <div className="row between" style={{ marginBottom: 16 }}><h2 className="h2">Insights &amp; policy</h2><Link href="/insights" className="small" style={{ fontWeight: 600 }}>All insights</Link></div>
        <div className="grid">{featured.map(c => (
          <Link key={c.id} href={`/insights?tab=${c.kind}`} className="card stack" style={{ gap: 8, color: "var(--ink)" }}>
            <span className="small muted" style={{ fontWeight: 600 }}>{c.kind === "policy" ? "Policy & governance" : c.kind === "research" ? "PIKOM research" : "News"} · {fmtDate(c.date)}</span>
            <h3 className="h3">{c.title}</h3>{c.policyStatus && <span className="badge orange" style={{ alignSelf: "flex-start" }}>{c.policyStatus}</span>}
            <p className="small muted" style={{ fontSize: 14 }}>{c.summary}</p>
          </Link>))}</div>
      </section>

      <section className="wrap section">
        <div className="row between" style={{ marginBottom: 6 }}><h2 className="h2">Member spotlight</h2><Link href="/members" className="small" style={{ fontWeight: 600 }}>All members</Link></div>
        <p className="small muted" style={{ marginBottom: 16 }}>Chosen monthly by the PIKOM team.</p>
        <div className="grid">{spotlight.map(c => (
          <Link key={c.org.id} href={`/members/${c.slug}`} className="card stack" style={{ gap: 10, color: "var(--ink)" }}>
            <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={c.name} logo={c.logo} /><span className="stack" style={{ gap: 0 }}><span style={{ fontWeight: 600 }}>{c.name}</span><span className="small" style={{ color: "var(--green)", fontWeight: 600 }}>Verified PIKOM member</span></span></div>
            <p className="small muted" style={{ fontSize: 14 }}>{c.tagline}</p>
            {c.category && <span className="badge" style={{ alignSelf: "flex-start" }}>{c.category}</span>}
          </Link>))}</div>
      </section>
    </>
  );
}
