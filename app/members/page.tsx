"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { companies } from "@/lib/directory";
import { COMPANY_CATEGORIES, CAPABILITIES } from "@/lib/options";
import { Avatar, Locked } from "@/components/ui";
import { PageHero, SearchIcon } from "@/components/PageHero";

export default function Members() {
  const { db, full } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [cap, setCap] = useState("");
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("q")) setQ(p.get("q")!); }, []);
  const known = COMPANY_CATEGORIES.filter(c => c !== "Other");
  const list = companies(db)
    .filter(c => cat === "All" || (cat === "Other" ? !known.includes(c.category) : c.category === cat))
    .filter(c => !cap || c.capabilities.some(x => x.toLowerCase().includes(cap.toLowerCase())))
    .filter(c => !q || (c.name + c.tagline + c.capabilities.join(" ")).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHero title="Members" lead="Every PIKOM member company on AI Xchange. Companies appear here as soon as the secretariat whitelists them." />
      <section className="wrap" style={{ paddingTop: 28 }}>
        {!full && <div style={{ marginBottom: 16 }}><Locked what="company details, people and contact information" /></div>}
        <div className="toolbar">
          <label className="search"><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search members</span><SearchIcon /><input className="input" placeholder="Search company or capability" value={q} onChange={e => setQ(e.target.value)} /></label>
          {full && <select className="select" aria-label="Capability" value={cap} onChange={e => setCap(e.target.value)}><option value="">All capabilities</option>{CAPABILITIES.filter(c => c !== "Other").map(c => <option key={c}>{c}</option>)}</select>}
        </div>
        <div className="chips" role="group" aria-label="Category" style={{ marginBottom: 16 }}>
          {["All", ...COMPANY_CATEGORIES].map(c => <button key={c} className={`chip${cat === c ? " on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <p className="count" style={{ marginBottom: 12 }}>{list.length} member compan{list.length === 1 ? "y" : "ies"}</p>
        <div className="grid">
          {list.map(c => (
            <Link key={c.org.id} href={`/members/${c.slug}`} className="card stack" style={{ gap: 10, color: "var(--ink)" }}>
              <div className="row" style={{ flexWrap: "nowrap" }}><Avatar name={c.name} logo={c.logo} />
                <span className="stack" style={{ gap: 0, minWidth: 0 }}><span style={{ fontWeight: 600 }}>{c.name}</span><span className="small" style={{ color: "var(--green)", fontWeight: 600 }}>Verified PIKOM member</span></span></div>
              {full && <p className="small muted" style={{ fontSize: 14 }}>{c.tagline}</p>}
              <div className="row" style={{ gap: 6, marginTop: "auto" }}>
                {c.category && <span className="badge">{c.category}</span>}
                {full && c.people > 0 && <span className="badge blue">{c.people} on AI Xchange</span>}
              </div>
            </Link>))}
        </div>
      </section>
    </>
  );
}
