"use client";
import Link from "next/link";
import { COMMITTEE, COMMITTEE_TERM, type CommitteeMember } from "@/lib/committee";

function Person({ p, big }: { p: CommitteeMember; big?: boolean }) {
  return (
    <article className={`card person${big ? " big" : ""}`}>
      <img src={p.photo} alt={`Photo of ${p.name}`} loading="lazy" />
      <div className="stack" style={{ gap: 2 }}>
        <b className="person-name">{p.name}</b>
        <span className="person-role">{p.role}</span>
        {p.org && <span className="small muted">{p.org}</span>}
      </div>
    </article>
  );
}

export default function Committee() {
  const lead = COMMITTEE.filter(p => p.role === "Chair" || p.role === "Deputy Chair");
  const members = COMMITTEE.filter(p => p.role === "Committee");
  const advisors = COMMITTEE.filter(p => p.role === "Advisor");
  return (<>
    <section className="page-hero"><div className="wrap">
      <Link href="/about" className="back-link" style={{ color: "#93C5FD", fontSize: 14, fontWeight: 600 }}>← About</Link>
      <span className="eyebrow" style={{ color: "#93C5FD", display: "block", marginTop: 12 }}>PIKOM AI Chapter · {COMMITTEE_TERM}</span>
      <h1 className="h1">AI Xchange Committee</h1>
      <p>The industry leaders who steer the PIKOM AI Chapter and AI Xchange Malaysia.</p>
    </div></section>
    <section className="wrap section stack" style={{ gap: 36 }}>
      <div className="stack" style={{ gap: 14 }}><h2 className="h2">Chair and Deputy Chairs</h2><div className="people lead">{lead.map(p => <Person key={p.name} p={p} big />)}</div></div>
      <div className="stack" style={{ gap: 14 }}><h2 className="h2">Committee members</h2><div className="people">{members.map(p => <Person key={p.name} p={p} />)}</div></div>
      <div className="stack" style={{ gap: 14 }}><h2 className="h2">Advisors</h2><div className="people">{advisors.map(p => <Person key={p.name} p={p} />)}</div></div>
      <p className="small muted">Committee {COMMITTEE_TERM}. Source: PIKOM AI Chapter.</p>
    </section>
  </>);
}
