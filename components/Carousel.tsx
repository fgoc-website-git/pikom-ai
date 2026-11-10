"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

/** Section with a title, ← → arrows and one "All …" link, over a row of cards that rotates by itself.
 *  Using the arrows (or scrolling) pauses rotation; it resumes 20 seconds after the last manual move. */
export function Carousel({ title, sub, moreHref, moreLabel, children, label }: { title: string; sub?: string; moreHref: string; moreLabel: string; label: string; children: React.ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const lastManual = useRef(0);
  const hovering = useRef(false);
  const [edge, setEdge] = useState({ start: true, end: false });
  const move = useCallback((dir: 1 | -1) => {
    const t = track.current; if (!t) return;
    const card = t.firstElementChild as HTMLElement | null; const w = card ? card.offsetWidth + 16 : 300;
    const atEnd = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
    if (dir === 1 && atEnd) t.scrollTo({ left: 0, behavior: "smooth" });
    else t.scrollBy({ left: dir * w, behavior: "smooth" });
  }, []);
  const manual = (dir: 1 | -1) => { lastManual.current = Date.now(); move(dir); };
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!hovering.current && Date.now() - lastManual.current > 20000) move(1); }, 4500);
    return () => clearInterval(id);
  }, [move]);
  const onScroll = () => { const t = track.current; if (t) setEdge({ start: t.scrollLeft < 4, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 }); };
  return (
    <section className="wrap section">
      <div className="section-head">
        <div><h2 className="h2">{title}</h2>{sub && <p>{sub}</p>}</div>
        <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
          <button className="btn sm icon-btn" aria-label={`Previous ${label}`} onClick={() => manual(-1)} disabled={edge.start}>←</button>
          <button className="btn sm icon-btn" aria-label={`Next ${label}`} onClick={() => manual(1)}>→</button>
          <Link href={moreHref} className="more" style={{ marginLeft: 8 }}>{moreLabel} →</Link>
        </div>
      </div>
      <div className="mc-track" ref={track} onScroll={onScroll} role="list" aria-label={label}
        onMouseEnter={() => { hovering.current = true; }} onMouseLeave={() => { hovering.current = false; }}
        onTouchStart={() => { lastManual.current = Date.now(); }} onWheel={e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) lastManual.current = Date.now(); }}>
        {children}
      </div>
    </section>
  );
}
