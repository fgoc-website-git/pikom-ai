"use client";
import Link from "next/link";
import { AboutBlocks } from "@/components/About";
import { ABOUT } from "@/lib/about";
import { PIKOM_JOIN_URL } from "@/lib/options";

export default function About() {
  return (
    <>
      <section className="page-hero"><div className="wrap">
        <span className="eyebrow" style={{ color: "#93C5FD" }}>About</span>
        <h1 className="h1">{ABOUT.name}</h1>
        <p>AI Xchange Malaysia is the PIKOM AI Chapter&apos;s platform for members working in AI.</p>
      </div></section>
      <AboutBlocks />
      <section className="wrap section">
        <div className="card row between" style={{ background: "var(--navy)", color: "#fff", borderColor: "var(--navy)", padding: 28 }}>
          <div className="stack" style={{ gap: 6, maxWidth: 640 }}><h2 className="h2" style={{ color: "#fff" }}>Be part of Malaysia&apos;s AI ecosystem</h2><p style={{ color: "#CBD5E1", margin: 0 }}>Join PIKOM to get full access to AI Xchange: the member directory, tenders and RFPs, jobs, events and policy updates.</p></div>
          <div className="row"><a className="btn accent" href={PIKOM_JOIN_URL} target="_blank" rel="noreferrer">Join PIKOM ↗</a><Link className="btn ghost-dark" href="/membership">Membership & benefits</Link></div>
        </div>
      </section>
    </>
  );
}

