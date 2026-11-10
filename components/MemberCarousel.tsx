"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./ui";
import type { Company } from "@/lib/directory";

/** All member companies in a scrolling row. Auto-advances; pauses on hover/focus. */
export function MemberCarousel({ items }: { items: Company[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [edge, setEdge] = useState({ start: true, end: false });
  const step = (dir: 1 | -1) => {
    const t = track.current; if (!t) return;
    const card = t.querySelector<HTMLElement>(".mc-card"); const w = card ? card.offsetWidth + 16 : 300;
    const atEnd = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
    if (dir === 1 && atEnd) t.scrollTo({ left: 0, behavior: "smooth" });
    else t.scrollBy({ left: dir * w * Math.max(1, Math.floor(t.clientWidth / w)), behavior: "smooth" });
  };
  const onScroll = () => { const t = track.current; if (t) setEdge({ start: t.scrollLeft < 4, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 }); };
  useEffect(() => {
    if (paused || items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => step(1), 5000); return () => clearInterval(id);
  }, [paused, items.length]);
  if (!items.length) return null;
  return (
    <div className="mc" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mc-track" ref={track} onScroll={onScroll} role="list" aria-label="PIKOM member companies">
        {items.map(c => (
          <Link role="listitem" key={c.org.id} href={`/members/${c.slug}`} className="card stack mc-card" style={{ gap: 10, color: "var(--ink)" }}>
            <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={c.name} logo={c.logo} /><span className="stack" style={{ gap: 0, minWidth: 0 }}><span style={{ fontWeight: 600 }}>{c.name}</span><span className="small" style={{ color: "var(--green)", fontWeight: 600 }}>Verified PIKOM member</span></span></div>
            <p className="small muted mc-about">{c.tagline}</p>
            {c.category && <span className="badge" style={{ alignSelf: "flex-start", marginTop: "auto" }}>{c.category}</span>}
          </Link>))}
      </div>
      <div className="row between" style={{ marginTop: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn sm" aria-label="Previous members" onClick={() => step(-1)} disabled={edge.start}>←</button>
          <button className="btn sm" aria-label="Next members" onClick={() => step(1)}>→</button>
          <button className="btn sm" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Play" : "Pause"}</button>
        </div>
        <Link className="btn primary sm" href="/members">See all members</Link>
      </div>
    </div>
  );
}
