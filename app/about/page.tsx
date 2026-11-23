"use client";
import Link from "next/link";
import { AboutBlocks } from "@/components/About";
import { ABOUT } from "@/lib/about";
import { COMMITTEE, COMMITTEE_TERM } from "@/lib/committee";
import { PIKOM_JOIN_URL } from "@/lib/options";

export default function About() {
  return (
    <>
      <section className="page-hero"><div className="wrap">
        <span className="eyebrow" style={{ color: "#93C5FD" }}>About</span>
        <h1 className="h1">{ABOUT.name}</h1>
        <p>AI Xchange Malaysia is the PIKOM AI Chapter&apos;s platform for members working in AI.</p>
      </div></section>
      <AboutBlocks after={
        <Link href="/committee" className="card row between committee-link" style={{ color: "var(--ink)", alignItems: "center", marginTop: 20 }}>
            <div className="row" style={{ gap: 14, alignItems: "center" }}>
              <div className="face-stack">{COMMITTEE.slice(0, 5).map(p => <img key={p.name} src={p.photo} alt="" />)}</div>
              <div className="stack" style={{ gap: 2 }}><b>Meet the AI Xchange Committee</b><span className="small muted">{COMMITTEE.length} industry leaders steering the PIKOM AI Chapter, {COMMITTEE_TERM}</span></div>
            </div>
            <span className="more">View committee →</span>
          </Link>
      } />
      <section className="wrap section">
        <div className="card row between" style={{ background: "var(--navy)", color: "#fff", borderColor: "var(--navy)", padding: 28 }}>
          <div className="stack" style={{ gap: 6, maxWidth: 640 }}><h2 className="h2" style={{ color: "#fff" }}>Be part of Malaysia&apos;s AI ecosystem</h2><p style={{ color: "#CBD5E1", margin: 0 }}>Join PIKOM to get full access to AI Xchange: the member directory, tenders and RFPs, jobs, events and policy updates.</p></div>
          <div className="row"><a className="btn accent" href={PIKOM_JOIN_URL} target="_blank" rel="noreferrer">Join PIKOM ↗</a><Link className="btn ghost-dark" href="/membership">Membership & benefits</Link></div>
        </div>
      </section>
    </>
  );
}

