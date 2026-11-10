"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore, today, canPostJob, PAYING } from "@/lib/store";
import { companies } from "@/lib/directory";
import { Avatar, fmtDate } from "@/components/ui";
import { EventCard } from "@/components/EventCard";
import { Carousel } from "@/components/Carousel";

export default function Home() {
  const { db, me, full } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [where, setWhere] = useState("members");
  const all = companies(db);
  const carousel = [...all].sort((a, b) => Number(!!b.logo) - Number(!!a.logo) || a.name.localeCompare(b.name));
  const jobs = db.jobs.filter(j => !j.hidden).sort((a, b) => b.postedOn.localeCompare(a.postedOn)).slice(0, 4);
  const rfps = db.rfps.filter(r => r.status === "Open" && !r.hidden).slice(0, 3);
  const events = db.events.filter(e => e.status === "Published" && e.date >= today()).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const featured = db.content.filter(c => c.published).sort((a, b) => Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date)).slice(0, 12);
  const people = db.users.filter(u => PAYING.includes(u.role)).length;

  return (
    <>
      <section className="hero"><div className="wrap" style={{ paddingTop: 64, paddingBottom: 56, display: "grid", gap: 40, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "center" }}>
        <div className="stack" style={{ gap: 20 }}>
          <span className="eyebrow" style={{ color: "#93C5FD" }}>Malaysia's AI industry network · by PIKOM</span>
          <h1 className="display" style={{ color: "#fff", maxWidth: 620 }}>Find verified AI partners, talent and opportunities.</h1>
          <p className="lead">AI Xchange is where PIKOM members share information, find partners and grow together.</p>
          <form role="search" className="hero-search" onSubmit={e => { e.preventDefault(); router.push(`/${where}?q=${encodeURIComponent(q)}`); }}>
            <label htmlFor="where" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search in</label>
            <select id="where" value={where} onChange={e => setWhere(e.target.value)}><option value="members">Members</option><option value="opportunities">Opportunities</option></select>
            <label htmlFor="q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search</label>
            <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="Computer vision, Bahasa LLM, fraud detection…" />
            <button className="btn primary sm" style={{ minHeight: 38, padding: "0 16px" }}>Search</button>
          </form>
          <div className="row" style={{ gap: 10 }}>
            {full ? <>{canPostJob(me) ? <Link className="btn accent" href="/opportunities?tab=jobs&post=1">Post a job</Link> : <Link className="btn accent" href="/opportunities?tab=jobs">Browse jobs</Link>}<Link className="btn ghost-dark" href="/opportunities">Find opportunities</Link></>
              : <><Link className="btn accent" href="/membership">Become a PIKOM member</Link>{!me && <Link className="btn ghost-dark" href="/register">Already a member? Activate access</Link>}</>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#1E3A5F", border: "1px solid #1E3A5F", borderRadius: 14, overflow: "hidden", maxWidth: 460, justifySelf: "end", width: "100%" }}>
          {[["2,000+", "PIKOM member companies"], ["157", "Companies on AI Xchange"], [String(people), "Members signed in"], [String(db.rfps.filter(r => r.status === "Open").length + db.jobs.length), "Open opportunities"]].map(([n, l]) => (
            <div key={l} className="stack" style={{ gap: 2, background: "#0E2647", padding: "22px 22px" }}><span style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 30, fontWeight: 800 }}>{n}</span><span className="small" style={{ color: "#94A3B8" }}>{l}</span></div>))}
        </div>
      </div></section>

      {!full && (
        <section className="wrap section">
          <div className="section-head"><div><h2 className="h2">How access works</h2><p>Membership is handled by PIKOM. There's no payment on this site.</p></div></div>
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
        <div className="section-head"><div><h2 className="h2">Upcoming events</h2></div><Link href="/events" className="more">All events →</Link></div>
        <div className="grid">{events.map(e => <EventCard key={e.id} e={e} />)}</div>
      </section>

      <section className="wrap section" style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div className="card" style={{ flex: "999 1 520px", minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}><h2 className="h2" style={{ fontSize: 18 }}>Open RFPs</h2><Link href="/opportunities" className="more">View all →</Link></div>
          <div className="list">{rfps.map(r => (
            <div key={r.id} className="row between" style={{ padding: "12px 0" }}>
              <div className="stack" style={{ gap: 2, flex: "1 1 280px", minWidth: 0 }}><span style={{ fontWeight: 600 }}>{r.title}</span><span className="small muted">{r.sector} · closes {fmtDate(r.closes)}</span></div>
              {full ? <span className="badge green">{r.budget}</span> : <span className="badge">Budget: members only</span>}
            </div>))}</div>
        </div>
        <div className="card" style={{ flex: "1 1 360px", minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}><h2 className="h2" style={{ fontSize: 18 }}>Latest AI jobs</h2><Link href="/opportunities?tab=jobs" className="more">All jobs →</Link></div>
          <div className="list">{jobs.map(j => (
            <Link key={j.id} href="/opportunities?tab=jobs" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 0", color: "var(--ink)" }}>
              <span style={{ fontWeight: 600 }}>{j.title}</span><span className="small muted">{j.company} · {j.location} · {j.mode}</span>
            </Link>))}</div>
        </div>
      </section>

      <Carousel title="Insights & policy" sub="Policy updates, PIKOM research and industry news." moreHref="/insights" moreLabel="All insights" label="insights">
        {featured.map(c => (
          <Link role="listitem" key={c.id} href={`/insights?tab=${c.kind}`} className="card stack mc-card" style={{ gap: 8, color: "var(--ink)" }}>
            <span className="small muted" style={{ fontWeight: 600 }}>{c.kind === "policy" ? "Policy & governance" : c.kind === "research" ? "PIKOM research" : "News"} · {fmtDate(c.date)}</span>
            <h3 className="h3">{c.title}</h3>{c.policyStatus && <span className="badge orange" style={{ alignSelf: "flex-start" }}>{c.policyStatus}</span>}
            <p className="small muted mc-about">{c.summary}</p>
            <span className="small muted" style={{ marginTop: "auto" }}>{c.source}</span>
          </Link>))}
      </Carousel>

      <Carousel title="Our members" sub="Verified PIKOM member companies on AI Xchange." moreHref="/members" moreLabel="All members" label="member companies">
        {carousel.map(c => (
          <Link role="listitem" key={c.org.id} href={`/members/${c.slug}`} className="card stack mc-card" style={{ gap: 10, color: "var(--ink)" }}>
            <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={c.name} logo={c.logo} /><span className="stack" style={{ gap: 0, minWidth: 0 }}><span style={{ fontWeight: 600 }}>{c.name}</span><span className="small" style={{ color: "var(--green)", fontWeight: 600 }}>Verified PIKOM member</span></span></div>
            <p className="small muted mc-about">{c.tagline}</p>
            {c.category && <span className="badge" style={{ alignSelf: "flex-start", marginTop: "auto" }}>{c.category}</span>}
          </Link>))}
      </Carousel>
    </>
  );
}
