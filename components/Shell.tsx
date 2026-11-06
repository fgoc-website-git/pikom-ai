"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, roleLabel, canManageContent } from "@/lib/store";
import { shortName } from "@/lib/directory";
import { Avatar } from "./ui";

const NAV = [["/members", "Members"], ["/opportunities", "Opportunities"], ["/events", "Events"], ["/insights", "Insights"]] as const;

const PEOPLE = [
  ["", "Visitor (signed out)"],
  ["student.amir@gmail.com", "Guest — free account"],
  ["aina@forest-interactive.com", "Main holder — Forest Interactive"],
  ["kumar@forest-interactive.com", "Colleague — Forest Interactive"],
  ["daniel@inextlabs.com", "Main holder — iNextLabs (seats full)"],
  ["farah.ai@gmail.com", "Individual member"],
  ["content@pikom.org.my", "Content admin — PIKOM"],
  ["admin@pikom.org.my", "Super admin — PIKOM"],
];

function DemoBar() {
  const { db, me, quickSignIn, reset } = useStore();
  const router = useRouter();
  const people = PEOPLE.filter(([e]) => !e || db.users.some(u => u.email === e));
  return (
    <div className="demo-bar"><div className="wrap">
      <span>Demo for PIKOM review · sample data, nothing leaves this browser</span>
      <span className="row" style={{ gap: 8 }}>
        <label htmlFor="demo-as">View as</label>
        <select id="demo-as" value={me?.email || ""} onChange={e => { const v = e.target.value; quickSignIn(v); router.push(v.endsWith("@pikom.org.my") ? "/admin" : "/"); }}>
          {people.map(([e, l]) => <option key={e} value={e}>{l}</option>)}
          {me && !people.some(([e]) => e === me.email) && <option value={me.email}>{me.name}</option>}
        </select>
        <button onClick={() => { if (confirm("Reset all demo data?")) { reset(); router.push("/"); } }}>Reset demo</button>
      </span>
    </div></div>
  );
}

export function Header() {
  const { me, myOrg, signOut, db } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ann = db.announcements.find(a => a.active);
  return (
    <>
      <DemoBar />
      <header className="site-head"><div className="wrap">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">AX</span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17 }}>AI Xchange Malaysia</span>
            <span className="small muted">A PIKOM chapter</span>
          </span>
        </Link>
        <button className="btn sm menu-btn" aria-expanded={open} aria-controls="mainnav" onClick={() => setOpen(!open)}>Menu</button>
        <nav id="mainnav" aria-label="Main" className={`mainnav${open ? " open" : ""}`}>
          {NAV.map(([h, l]) => <Link key={h} href={h} className={path.startsWith(h) ? "on" : ""} onClick={() => setOpen(false)}>{l}</Link>)}
        </nav>
        {me ? (
          <div className="row" style={{ gap: 8 }}>
            {canManageContent(me) && <Link className="btn sm dark" href="/admin">Admin</Link>}
            <Link href="/account" className="row" style={{ gap: 8, padding: "4px 12px 4px 4px", border: "1px solid var(--line)", borderRadius: 999, color: "var(--ink)", flexWrap: "nowrap" }}>
              <Avatar name={me.name} round />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{me.name.split(" ")[0]}</span>
                <span className="small muted">{myOrg ? shortName(myOrg.name) : roleLabel(me.role)}</span>
              </span>
            </Link>
            <button className="btn sm" onClick={() => { signOut(); router.push("/"); }}>Sign out</button>
          </div>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn sm" href="/signin">Sign in</Link>
            <Link className="btn sm accent" href="/register">Join AI Xchange</Link>
          </div>
        )}
      </div></header>
      {ann && <div style={{ background: "var(--orange-bg)", borderBottom: "1px solid #FED7AA", fontSize: 14 }}><div className="wrap" style={{ padding: "10px 24px" }}><b>Announcement:</b> {ann.text} {ann.link && <Link href={ann.link}>Find out more</Link>}</div></div>}
      {me?.role === "guest" && <div style={{ background: "var(--blue-bg)", borderBottom: "1px solid #BFDBFE", fontSize: 14 }}><div className="wrap" style={{ padding: "10px 24px" }}>You're using a free guest account: you can browse listings, policy and insights. <Link href="/membership">Become a PIKOM member</Link> to see full details, apply and connect.</div></div>}
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-foot"><div className="wrap">
      <div className="stack" style={{ maxWidth: 380, gap: 8 }}>
        <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 17, color: "#fff" }}>AI Xchange Malaysia</span>
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
    </div></footer>
  );
}
