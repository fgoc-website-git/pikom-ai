"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/components/ui";

/** In-page slide viewer for presentations shared as Research / White Papers. */
export default function SlidesPage() {
  const { id } = useParams<{ id: string }>();
  const { db, ready } = useStore();
  const c = db.content.find(x => x.id === id && x.published);
  const [i, setI] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const n = c?.slides?.length || 0;
  const step = (d: number) => setI(x => Math.max(0, Math.min(n - 1, x + d)));
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight") setI(x => Math.min(n - 1, x + 1)); if (e.key === "ArrowLeft") setI(x => Math.max(0, x - 1)); };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [n]);
  useEffect(() => { strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); }, [i]);
  if (!ready) return <div className="wrap page-head muted">Loading…</div>;
  if (!c || !n) return <div className="wrap page-head"><div className="empty">Presentation not found. <Link href="/insights?tab=research">Back to Research / White Papers</Link></div></div>;
  return (<>
    <section className="page-hero"><div className="wrap">
      <Link href="/insights?tab=research" className="back-link" style={{ color: "#93C5FD", fontSize: 14, fontWeight: 600 }}>← Research / White Papers</Link>
      <span className="eyebrow" style={{ color: "#93C5FD", display: "block", marginTop: 12 }}>{c.source} · {c.dateLabel || fmtDate(c.date)}</span>
      <h1 className="h1">{c.title}</h1>
      <p>{c.summary}</p>
      {c.fileUrl && <div className="row" style={{ marginTop: 14 }}><a className="btn accent" href={c.fileUrl} target="_blank" rel="noreferrer">Download PDF ↓</a></div>}
    </div></section>
    <section className="wrap section stack" style={{ gap: 14 }}>
      <div className="slide-stage">
        <img src={c.slides![i]} alt={`Slide ${i + 1} of ${n}`} />
        <button className="slide-nav prev" aria-label="Previous slide" disabled={i === 0} onClick={() => step(-1)}>‹</button>
        <button className="slide-nav next" aria-label="Next slide" disabled={i === n - 1} onClick={() => step(1)}>›</button>
      </div>
      <div className="row between"><span className="small muted">Slide {i + 1} of {n} · use ← → keys</span>{c.fileUrl && <a className="small" href={c.fileUrl} target="_blank" rel="noreferrer">Download PDF ↓</a>}</div>
      <div className="slide-strip" ref={strip}>{c.slides!.map((s, k) => <button key={s} data-i={k} className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Go to slide ${k + 1}`}><img src={s} alt="" loading="lazy" /></button>)}</div>
    </section>
  </>);
}
