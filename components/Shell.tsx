"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, roleLabel, canManageContent, isSuper } from "@/lib/store";
import { shortName } from "@/lib/directory";
import { Avatar } from "./ui";
import { Icon } from "./Icons";

const NAV = [["/members", "Members"], ["/opportunities", "Opportunities"], ["/events", "Events"], ["/insights", "Insights"]] as const;

/** Round icon button; its label lights up underneath on hover or keyboard focus. */
function IconLink({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  return <Link href={href} className={`icon-link${active ? " on" : ""}`} aria-label={label}><Icon name={icon} /><span className="icon-label" aria-hidden="true">{label}</span></Link>;
}

function AccountMenu() {
  const { me, myOrg, signOut } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  if (!me) return null;
  const go = (h: string) => { setOpen(false); router.push(h); };
  return (
    <div className="acct" ref={ref}>
      <button className={`icon-link avatar-btn${open ? " on" : ""}`} aria-haspopup="menu" aria-expanded={open} aria-label={`Account: ${me.name}`} onClick={() => setOpen(!open)}>
        <Avatar name={me.name} round /><span className="icon-label" aria-hidden="true">{me.name.split(" ")[0]}</span>
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <div className="acct-head"><Avatar name={me.name} round /><div style={{ minWidth: 0 }}><b>{me.name}</b><div className="small muted">{roleLabel(me.role)}{myOrg ? ` · ${shortName(myOrg.name)}` : ""}</div>{me.staff && <span className="badge dark" style={{ marginTop: 4 }}>{me.staff === "super" ? "Super admin" : "PIKOM admin"}</span>}</div></div>
          <button role="menuitem" onClick={() => go("/account")}><Icon name="settings" size={18} />Account settings</button>
          {myOrg && <button role="menuitem" onClick={() => go("/company")}><Icon name="building" size={18} />{me.role === "member" ? "My company" : "Manage my company"}</button>}
          {canManageContent(me) && <button role="menuitem" onClick={() => go("/admin")}><Icon name="shield" size={18} />{isSuper(me) ? "Super admin" : "PIKOM admin"}</button>}
          <button role="menuitem" className="danger" onClick={async () => { setOpen(false); await signOut(); router.push("/"); }}><Icon name="logout" size={18} />Sign out</button>
        </div>)}
    </div>
  );
}

function Banner({ id, tone, icon, children }: { id: string; tone: "orange" | "blue" | "red"; icon: string; children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { if (sessionStorage.getItem("ax-hide-" + id)) setHidden(true); } catch {} }, [id]);
  if (hidden) return null;
  return (
    <div className={`banner ${tone}`}><div className="wrap">
      <Icon name={icon} size={17} /><span className="banner-text">{children}</span>
      <button className="banner-x" aria-label="Dismiss" onClick={() => { setHidden(true); try { sessionStorage.setItem("ax-hide-" + id, "1"); } catch {} }}><Icon name="close" size={15} /></button>
    </div></div>
  );
}

export function Header() {
  const { me, myOrg, db, offline } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const ann = db.announcements.find(a => a.active);
  return (
    <>
      <header className="site-head"><div className="wrap">
        <Link href="/" className="brand" aria-label="AI Xchange Malaysia — a PIKOM chapter, home" onClick={() => setOpen(false)}>
          <img src="/brand/ai-xchange-logo.png" alt="AI Xchange Malaysia — a PIKOM chapter" className="brand-logo" />
        </Link>
        <nav id="mainnav" aria-label="Main" className={`mainnav${open ? " open" : ""}`}>
          {NAV.map(([h, l]) => <Link key={h} href={h} className={path.startsWith(h) ? "on" : ""} onClick={() => setOpen(false)}>{l}</Link>)}
        </nav>
        <div className="head-actions">
          {me ? <>
            {canManageContent(me) && <IconLink href="/admin" icon="shield" label={isSuper(me) ? "Super admin" : "PIKOM admin"} active={path.startsWith("/admin")} />}
            {myOrg && <IconLink href="/company" icon="building" label="My company" active={path.startsWith("/company")} />}
            <AccountMenu />
          </> : <>
            <IconLink href="/signin" icon="login" label="Sign in" active={path === "/signin"} />
            <Link className="btn sm accent" href="/register">Join</Link>
          </>}
          <button className="icon-link menu-btn" aria-expanded={open} aria-controls="mainnav" aria-label="Menu" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /></button>
        </div>
      </div></header>
      {offline && <Banner id="offline" tone="red" icon="info">We can't reach the server right now ({offline}). Changes won't be saved until it's back.</Banner>}
      {ann && <Banner id={ann.id} tone="orange" icon="megaphone">{ann.text} {ann.link && <Link href={ann.link}>Find out more</Link>}</Banner>}
      {me?.role === "guest" && <Banner id="guest" tone="blue" icon="info">You're on a free guest account. <Link href="/membership">Become a PIKOM member</Link> to see full details, apply and connect.</Banner>}
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
