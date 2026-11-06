"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { companies } from "@/lib/directory";
import { RFP_LIST, POLICY_TIMELINE, EVENT_LIST, REPORTS } from "@/lib/content";
import { Avatar } from "@/components/ui";

const dot = { done: "#15803D", next: "#EA580C", later: "#94A3B8" } as const;

export default function Home() {
  const { db, me } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [where, setWhere] = useState("directory");
  const spotlight = companies(db).filter(c => c.onXchange).slice(0, 4);
  const jobs = [...db.jobs].sort((a, b) => b.postedOn.localeCompare(a.postedOn)).slice(0, 4);
  const orgCount = db.orgs.length, people = db.users.filter(u => u.role !== "superadmin").length;

  return (
    <>
      <section className="hero"><div className="wrap stack" style={{ padding: "64px 24px 48px", gap: 24 }}>
        <span className="eyebrow" style={{ color: "#93C5FD" }}>Malaysia's AI industry network · by PIKOM</span>
        <h1 className="h1" style={{ fontSize: 48, maxWidth: 860 }}>Find verified AI partners, talent and opportunities — in one trusted network.</h1>
        <p className="lead">AI Xchange is where PIKOM members share information and connect. Everyone here belongs to a verified PIKOM member company, or is a PIKOM individual member.</p>
        <form role="search" onSubmit={e => { e.preventDefault(); router.push(`/${where}?q=${encodeURIComponent(q)}`); }} className="row" style={{ gap: 0, background: "#fff", borderRadius: 12, padding: 6, maxWidth: 820 }}>
          <label htmlFor="where" className="sr" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search in</label>
          <select id="where" value={where} onChange={e => setWhere(e.target.value)} className="select" style={{ width: "auto", border: 0, background: "var(--soft)", color: "var(--ink)" }}>
            <option value="directory">Members</option><option value="jobs">Jobs</option><option value="opportunities">Opportunities</option>
          </select>
          <label htmlFor="q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search</label>
          <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. computer vision, Bahasa LLM, fraud detection" className="input" style={{ flex: "1 1 240px", border: 0, width: "auto", color: "var(--ink)" }} />
          <button className="btn primary">Search</button>
        </form>
        <div className="row">
          {me ? <>
            <Link className="btn accent" href="/jobs?post=1">Post a job</Link>
            <Link className="btn ghost-dark" href="/directory">Find a partner</Link>
            <Link className="btn ghost-dark" href="/account">My account</Link>
          </> : <>
            <Link className="btn accent" href="/membership">Become a PIKOM member</Link>
            <Link className="btn ghost-dark" href="/register">Already a member? Activate access</Link>
          </>}
        </div>
        <div className="grid" style={{ borderTop: "1px solid #1E3A5F", paddingTop: 24, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          {[["2,000+", "PIKOM member companies"], [String(orgCount), "Member companies on AI Xchange (demo)"], [String(people), "Members signed in to AI Xchange (demo)"], ["Since 1986", "The national tech association"]].map(([n, l]) => (
            <div key={l} className="stack" style={{ gap: 2 }}><span style={{ fontFamily: "Manrope", fontSize: 30, fontWeight: 800 }}>{n}</span><span className="small" style={{ color: "#CBD5E1" }}>{l}</span></div>
          ))}
        </div>
      </div></section>

      {!me && (
        <section className="wrap section">
          <h2 className="h2">How member access works</h2>
          <p className="muted" style={{ margin: "6px 0 20px" }}>There is no sign-up or payment on this site. Membership is handled by PIKOM.</p>
          <ol className="grid" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {[["1", "Join PIKOM", "Your company (or you, as an individual) becomes a PIKOM member through the secretariat."],
              ["2", "We whitelist you", "PIKOM adds your company email domain — or your personal email for individual members — and names a main account holder."],
              ["3", "Activate with your work email", "Up to 5 people per company register with their @company email. No approval needed."],
              ["4", "Share one company account", "Everyone sees the same member content. The main account holder sees who has joined and manages seats."]].map(([n, t, d]) => (
              <li key={n} className="card stack" style={{ gap: 8 }}>
                <span className="avatar round" style={{ background: "var(--navy)", color: "#fff" }}>{n}</span>
                <h3 className="h3">{t}</h3><p className="muted small" style={{ fontSize: 14 }}>{d}</p>
              </li>))}
          </ol>
        </section>
      )}

      <section className="wrap section">
        <h2 className="h2">What members get here</h2>
        <p className="muted" style={{ margin: "6px 0 20px" }}>Everything is open to browse. Acting on it — posting, responding, downloading, contacting — is for members.</p>
        <div className="grid">
          {[["01", "Be found by buyers", "A verified company profile in the AI Xchange directory, with your capabilities and contacts."],
            ["02", "See and respond to RFPs", "Full budgets and buyer contacts for AI requirements from industry and government."],
            ["03", "Post jobs, reach AI talent", "Publish roles with a verified-member badge; link straight to your LinkedIn job post."],
            ["04", "Shape AI policy", "Position papers and a seat in working groups responding to NAIO and ministries."]].map(([n, t, d]) => (
            <div key={n} className="card stack" style={{ gap: 10 }}>
              <span className="avatar" style={{ background: "var(--blue-bg)", color: "var(--blue)", fontFamily: "Manrope", fontWeight: 800 }}>{n}</span>
              <h3 className="h3">{t}</h3><p className="muted" style={{ fontSize: 15 }}>{d}</p>
            </div>))}
        </div>
      </section>

      <section className="wrap section" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div className="card" style={{ flex: "999 1 560px", minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}><h2 className="h3" style={{ fontSize: 22 }}>Open opportunities (RFPs)</h2><Link href="/opportunities" className="small" style={{ fontWeight: 600 }}>View all</Link></div>
          <div className="list">
            {RFP_LIST.slice(0, 3).map(r => (
              <div key={r.id} className="row between" style={{ padding: "14px 0" }}>
                <div className="stack" style={{ gap: 4, flex: "1 1 300px", minWidth: 0 }}><span style={{ fontWeight: 600 }}>{r.title}</span><span className="small muted">{r.sector} · closes {r.closes}</span></div>
                {me ? <span className="badge green">{r.budget}</span> : <span className="badge">Budget: members only</span>}
                <Link className="btn sm" href={me ? "/opportunities" : "/signin"}>{me ? "View" : "Sign in to respond"}</Link>
              </div>))}
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 360px", minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}><h2 className="h3" style={{ fontSize: 22 }}>Latest AI jobs</h2><Link href="/jobs" className="small" style={{ fontWeight: 600 }}>All jobs</Link></div>
          <div className="list">
            {jobs.map(j => (
              <Link key={j.id} href="/jobs" style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 0", color: "var(--ink)" }}>
                <span style={{ fontWeight: 600 }}>{j.title}</span><span className="small muted">{j.company} · {j.location} · {j.mode}</span>
              </Link>))}
          </div>
          <p className="alert warn" style={{ marginTop: 12 }}>Jobs are posted by PIKOM member companies. Each post can link to the matching LinkedIn job. {!me && <Link href="/membership">See membership</Link>}</p>
        </div>
      </section>

      <section className="wrap section">
        <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 28, padding: 28 }}>
          <div className="stack" style={{ flex: "1 1 380px", minWidth: 0 }}>
            <span className="eyebrow">Policy watch</span>
            <h2 className="h2">Malaysia AI Governance Bill</h2>
            <p className="muted" style={{ fontSize: 16 }}>National AI Office public consultation closed 31 July 2026. The proposal sets three risk tiers, a Central AI Authority, incident reporting and an AI sandbox. Members get PIKOM's position paper and a seat in the response working group.</p>
            <div className="row"><Link className="btn dark" href="/policy">Read the summary</Link><Link className="btn" href={me ? "/policy#working-group" : "/signin"}>{me ? "Join the working group" : "Members: join the working group"}</Link></div>
          </div>
          <ol className="list" style={{ flex: "1 1 380px", minWidth: 0, listStyle: "none", margin: 0, padding: 0 }}>
            {POLICY_TIMELINE.map(t => (
              <li key={t.what} className="row" style={{ gap: 14, padding: "12px 0", alignItems: "flex-start", flexWrap: "nowrap" }}>
                <span style={{ flex: "0 0 12px", height: 12, marginTop: 5, borderRadius: 99, background: dot[t.state as keyof typeof dot] }} />
                <span className="stack" style={{ gap: 2 }}><span style={{ fontWeight: 600 }}>{t.what}</span><span className="small muted">{t.when}</span></span>
              </li>))}
          </ol>
        </div>
      </section>

      <section className="wrap section">
        <div className="row between" style={{ marginBottom: 16 }}><h2 className="h2">Upcoming events</h2><Link href="/events" className="small" style={{ fontWeight: 600 }}>Full calendar</Link></div>
        <div className="grid">
          {EVENT_LIST.map(e => (
            <div key={e.id} className="card stack" style={{ gap: 8 }}>
              <span className="small" style={{ fontWeight: 600, color: "var(--blue)" }}>{e.when} · {e.where}</span>
              <h3 className="h3">{e.name}</h3><p className="small muted" style={{ fontSize: 14 }}>{e.d}</p>
              <span className="small" style={{ fontWeight: 600, marginTop: "auto" }}>{me ? e.members : e.public}</span>
            </div>))}
        </div>
      </section>

      <section className="wrap section">
        <div className="row between" style={{ marginBottom: 6 }}><h2 className="h2">Member spotlight</h2><Link href="/directory" className="small" style={{ fontWeight: 600 }}>Browse all members</Link></div>
        <p className="small muted" style={{ marginBottom: 16 }}>Rotates monthly across members with complete, verified profiles.</p>
        <div className="grid">
          {spotlight.map(c => (
            <Link key={c.slug} href={`/directory/${c.slug}`} className="card stack" style={{ gap: 10, color: "var(--ink)" }}>
              <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={c.name} logo={c.logo} /><span className="stack" style={{ gap: 0 }}><span style={{ fontWeight: 600 }}>{c.name}</span><span className="small" style={{ color: "var(--green)", fontWeight: 600 }}>Verified PIKOM member</span></span></div>
              <p className="small muted" style={{ fontSize: 14 }}>{c.tagline}</p>
              {c.category && <span className="badge" style={{ alignSelf: "flex-start" }}>{c.category}</span>}
            </Link>))}
        </div>
      </section>

      <section className="wrap section">
        <h2 className="h2" style={{ marginBottom: 16 }}>Insights &amp; research</h2>
        <div className="grid">
          {REPORTS.map(r => (
            <div key={r.t} className="card stack" style={{ gap: 10 }}>
              <span className="small muted" style={{ fontWeight: 600 }}>{r.kind}</span><h3 className="h3">{r.t}</h3>
              <Link href={r.member && !me ? "/signin" : "/insights"} className="small" style={{ fontWeight: 600, marginTop: "auto" }}>{r.member ? (me ? "Download (member copy)" : "Read summary · full report for members") : "Read online"}</Link>
            </div>))}
        </div>
      </section>
    </>
  );
}
