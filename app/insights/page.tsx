"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { REPORTS } from "@/lib/content";
import { ARTICLES } from "@/lib/data";
import { PageHero } from "@/components/PageHero";

export default function Insights() {
  const { me } = useStore();
  return (<>
    <PageHero title="Insights & research" lead="PIKOM research for members, plus curated reading on AI from trusted sources." />
    <section className="wrap section">
      <h2 className="h2" style={{ marginBottom: 16 }}>PIKOM publications</h2>
      <div className="grid">{REPORTS.map(r => (
        <div key={r.t} className="card stack" style={{ gap: 8 }}><span className="small muted" style={{ fontWeight: 600 }}>{r.kind}</span><h3 className="h3">{r.t}</h3>
          {r.member && !me ? <Link href="/signin" className="small" style={{ fontWeight: 600, marginTop: "auto" }}>Summary · sign in for the full report</Link> : <span className="small" style={{ fontWeight: 600, color: "var(--blue)", marginTop: "auto" }}>{r.member ? "Download (member copy)" : "Read online"}</span>}
        </div>))}</div>
    </section>
    <section className="wrap section">
      <h2 className="h2" style={{ marginBottom: 16 }}>Curated reading</h2>
      <div className="grid">{ARTICLES.map(a => (
        <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="card stack" style={{ gap: 8, color: "var(--ink)" }}>
          <span className="small muted" style={{ fontWeight: 600 }}>{a.src} · {a.date}</span><h3 className="h3" style={{ fontSize: 17 }}>{a.title}</h3><p className="small muted" style={{ fontSize: 14 }}>{a.desc}</p>
        </a>))}</div>
    </section>
  </>);
}
