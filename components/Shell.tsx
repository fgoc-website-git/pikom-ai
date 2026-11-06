"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, roleLabel } from "@/lib/store";
import { Avatar } from "./ui";

const NAV = [
  ["/directory", "Directory"], ["/opportunities", "Opportunities"], ["/jobs", "Jobs"], ["/events", "Events"],
  ["/insights", "Insights"], ["/policy", "Policy"], ["/community", "Community"],
] as const;

function DemoBar() {
  const { db, me, quickSignIn, reset } = useStore();
  const router = useRouter();
  const people = [
    ["", "Guest (signed out)"],
    ["admin@pikom.org.my", "Super admin — PIKOM"],
    ["aina@forest-interactive.com", "Main holder — Forest Interactive"],
    ["kumar@forest-interactive.com", "Colleague — Forest Interactive"],
    ["daniel@inextlabs.com", "Main holder — iNextLabs (seats full)"],
    ["farah.ai@gmail.com", "Individual member"],
  ].filter(([e]) => !e || db.users.some(u => u.email === e));
  return (
    <div className="demo-bar"><div className="wrap">
      <span>Demo for PIKOM review · sample data, nothing is saved outside this browser</span>
      <span className="row" style={{ gap: 8 }}>
        <label htmlFor="demo-as">View as</label>
        <select id="demo-as" value={me?.email || ""} onChange={e => { quickSignIn(e.target.value); router.push(e.target.value === "admin@pikom.org.my" ? "/admin" : "/"); }}>
          {people.map(([e, l]) => <option key={e} value={e}>{l}</option>)}
          {me && !people.some(([e]) => e === me.email) && <option value={me.email}>{me.name}</option>}
        </select>
        <button onClick={() => { if (confirm("Reset all demo data?")) { reset(); router.push("/"); } }}>Reset demo</button>
      </span>
    </div></div>
  );
}

export function Header() {
  const { me, myOrg, signOut } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
            {me.role === "superadmin" && <Link className="btn sm dark" href="/admin">Admin</Link>}
            <Link href="/account" className="row" style={{ gap: 8, padding: "4px 12px 4px 4px", border: "1px solid var(--line)", borderRadius: 999, color: "var(--ink)" }}>
              <Avatar name={me.name} round />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{me.name.split(" ")[0]}</span>
                <span className="small muted">{myOrg ? myOrg.name.replace(" Sdn. Bhd.", "") : roleLabel(me.role)}</span>
              </span>
            </Link>
            <button className="btn sm" onClick={() => { signOut(); router.push("/"); }}>Sign out</button>
          </div>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn sm" href="/signin">Sign in</Link>
            <Link className="btn sm accent" href="/membership">Become a member</Link>
          </div>
        )}
      </div></header>
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
        <Link href="/membership">Membership types</Link>
        <Link href="/register">Activate your access</Link>
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
