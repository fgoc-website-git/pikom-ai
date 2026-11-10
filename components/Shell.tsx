"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, roleLabel, canManageContent, isSuper } from "@/lib/store";
import { shortName } from "@/lib/directory";
import { Avatar } from "./ui";

const NAV = [["/members", "Members"], ["/opportunities", "Opportunities"], ["/events", "Events"], ["/insights", "Insights"]] as const;

export function Header() {
  const { me, myOrg, signOut, db, offline } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ann = db.announcements.find(a => a.active);
  return (
    <>
      <header className="site-head"><div className="wrap">
        <Link href="/" className="brand" aria-label="AI Xchange Malaysia — a PIKOM chapter, home" onClick={() => setOpen(false)}>
          <img src="/brand/ai-xchange-logo.png" alt="AI Xchange Malaysia — a PIKOM chapter" className="brand-logo" />
        </Link>
        <button className="btn sm menu-btn" aria-expanded={open} aria-controls="mainnav" onClick={() => setOpen(!open)}>Menu</button>
        <nav id="mainnav" aria-label="Main" className={`mainnav${open ? " open" : ""}`}>
          {NAV.map(([h, l]) => <Link key={h} href={h} className={path.startsWith(h) ? "on" : ""} onClick={() => setOpen(false)}>{l}</Link>)}
        </nav>
        {me ? (
          <div className="row" style={{ gap: 8 }}>
            {canManageContent(me) && <Link className="btn sm dark" href="/admin">{isSuper(me) ? "Super admin" : "PIKOM admin"}</Link>}
            <Link href="/account" className="row" style={{ gap: 8, padding: "4px 12px 4px 4px", border: "1px solid var(--line)", borderRadius: 999, color: "var(--ink)", flexWrap: "nowrap" }}>
              <Avatar name={me.name} round />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{me.name.split(" ")[0]}</span>
                <span className="small muted">{myOrg ? shortName(myOrg.name) : roleLabel(me.role)}</span>
              </span>
            </Link>
            <button className="btn sm" onClick={async () => { await signOut(); router.push("/"); }}>Sign out</button>
          </div>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn sm" href="/signin">Sign in</Link>
            <Link className="btn sm accent" href="/register">Join AI Xchange</Link>
          </div>
        )}
      </div></header>
      {offline && <div style={{ background: "#FEF2F2", borderBottom: "1px solid #FECACA", fontSize: 14 }}><div className="wrap" style={{ paddingTop: 9, paddingBottom: 9 }}>We can't reach the server right now ({offline}). Changes won't be saved until it's back.</div></div>}
      {ann && <div style={{ background: "var(--orange-bg)", borderBottom: "1px solid #FED7AA", fontSize: 14 }}><div className="wrap" style={{ paddingTop: 9, paddingBottom: 9 }}><b>Announcement:</b> {ann.text} {ann.link && <Link href={ann.link}>Find out more</Link>}</div></div>}
      {me?.role === "guest" && <div style={{ background: "var(--blue-bg)", borderBottom: "1px solid #BFDBFE", fontSize: 14 }}><div className="wrap" style={{ paddingTop: 9, paddingBottom: 9 }}>You're using a free guest account: you can browse listings, policy and insights. <Link href="/membership">Become a PIKOM member</Link> to see full details, apply and connect.</div></div>}
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-foot"><div className="wrap">
      <div className="stack" style={{ maxWidth: 380, gap: 8 }}>
        <div className="foot-logos">
          <span className="chip-logo"><img src="/brand/ai-xchange-logo.png" alt="AI Xchange Malaysia" style={{ height: 44 }} /></span>
          <a href="https://pikom.org.my" target="_blank" rel="noreferrer" className="chip-logo" style={{ padding: 0, overflow: "hidden" }}><img src="/brand/pikom-logo.jpg" alt="PIKOM — The National Tech Association of Malaysia" style={{ height: 60, display: "block" }} /></a>
        </div>
        <span>An information and networking platform for members of PIKOM, The National Tech Association of Malaysia.</span>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ color: "#fff", fontWeight: 600 }}>Membership</span>
        <Link href="/membership">Membership & access</Link>
        <Link href="/register">Join AI Xchange</Link>
        <a href="https://pikom.org.my" target="_blank" rel="noreferrer">pikom.org.my</a>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ color: "#fff", fontWeight: 600 }}>Help</span>
        <Link href="/privacy">Privacy notice (PDPA 2010)</Link>
        <Link href="/terms">Terms of use</Link>
        <Link href="/membership#contact">Contact the secretariat</Link>
      </div>
    </div><div className="foot-bottom"><div className="wrap">© PIKOM — The National Tech Association of Malaysia. AI Xchange is a PIKOM chapter.</div></div></footer>
  );
}
