"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore, type ContentKind } from "@/lib/store";
import { PageHero } from "@/components/PageHero";
import { fmtDate } from "@/components/ui";

const TABS: [ContentKind, string][] = [["policy", "Policy & governance"], ["research", "Research / White Papers"], ["news", "News"]];

export default function Insights() {
  const { db } = useStore();
  const [tab, setTab] = useState<ContentKind>("policy");
  useEffect(() => { const t = new URLSearchParams(window.location.search).get("tab") as ContentKind; if (t && TABS.some(([k]) => k === t)) setTab(t); }, []);
  const list = db.content.filter(c => c.kind === tab && c.published).sort((a, b) => Number(b.featured) - Number(a.featured) || b.date.localeCompare(a.date));
  return (<>
    <PageHero title="Insights" lead="AI policy and governance updates, PIKOM research and white papers, and industry news — open to everyone." />
    <section className="wrap" style={{ paddingTop: 24 }}>
      <div className="tabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {list.length === 0 ? <div className="empty">Nothing published here yet.</div> : (
        <div className={tab === "research" ? "grid3" : "grid2"}>{list.map(c => (
          <article key={c.id} className={`card stack${c.featured ? " hl" : ""}${c.image ? " pub-card" : ""}`} style={{ gap: 8 }}>
            {c.image && (c.fileUrl ? <a href={c.fileUrl} target="_blank" rel="noreferrer" className={`pub-cover${c.coverWide ? " wide" : ""}`} aria-label={`Download ${c.title} (PDF)`}><img src={c.image} alt="" /></a> : <div className={`pub-cover${c.coverWide ? " wide" : ""}`}><img src={c.image} alt="" /></div>)}
            <div className="row" style={{ gap: 6 }}>{c.featured && <span className="badge dark">Featured</span>}{c.policyStatus && <span className="badge orange">{c.policyStatus}</span>}<span className="small muted">{c.source} · {c.dateLabel || fmtDate(c.date)}</span></div>
            <h2 className="h3">{c.fileUrl ? <a href={c.fileUrl} target="_blank" rel="noreferrer" className="card-title-link">{c.title}</a> : c.title}</h2>
            <p className="muted" style={{ fontSize: 15 }}>{c.summary}</p>
            {!!c.highlights?.length && <ul className="ticks small-ticks">{c.highlights.map(h => <li key={h}>{h}</li>)}</ul>}
            {c.body && <p style={{ fontSize: 14 }}>{c.body}</p>}
            <div className="row" style={{ marginTop: "auto" }}>
              {c.fileUrl ? <a className="btn primary sm" href={c.fileUrl} target="_blank" rel="noreferrer">Download PDF ↓</a>
                : c.file && <button className="btn sm" onClick={() => alert("PDF downloads switch on once file storage is added.")}>Download PDF</button>}
              {!!c.slides?.length && <Link className="btn sm" href={`/insights/${c.id}`}>View slides</Link>}
              {c.url && <a className="btn sm" href={c.url} target="_blank" rel="noreferrer">{c.fileUrl ? "PIKOM website ↗" : "Read source ↗"}</a>}
            </div>
          </article>))}</div>)}
    </section>
  </>);
}
