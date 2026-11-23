"use client";
import type React from "react";
import Link from "next/link";
import { ABOUT } from "@/lib/about";

export function AboutBlocks({ compact, after }: { compact?: boolean; after?: React.ReactNode }) {
  return (
    <section className="wrap section">
      {compact && <div className="section-head"><div><h2 className="h2">About the PIKOM AI Chapter</h2><p>Why AI Xchange exists.</p></div><Link href="/about" className="more">About us →</Link></div>}
      <div className="mpv">
        {([["Mission", ABOUT.mission, "🎯"], ["Purpose", ABOUT.purpose, "🌱"], ["Vision", ABOUT.vision, "🚀"]] as const).map(([k, v, ic]) => (
          <div key={k} className="card mpv-card"><span className="mpv-ic" aria-hidden="true">{ic}</span><span className="eyebrow">Our {k.toLowerCase()}</span><p>{v}</p></div>))}
      </div>
      <h2 className="h3" style={{ margin: "26px 0 12px" }}>Our key objectives</h2>
      <ol className="objectives">
        {ABOUT.objectives.map((o, i) => <li key={o.title} className="card"><span className="obj-n">{i + 1}</span><div><b>{o.title}</b><p className="small muted" style={{ margin: "4px 0 0" }}>{o.text}</p></div></li>)}
      </ol>
      {after}
    </section>
  );
}
