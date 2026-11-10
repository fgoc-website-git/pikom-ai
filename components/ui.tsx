"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OTHER } from "@/lib/options";
import { useStore } from "@/lib/store";

const isOtherVal = (opts: string[], v: string) => v !== "" && !opts.includes(v);

/** Single select; choosing "Other" shows a text box. Stored value = the typed text. */
export function SelectOther({ label, options, value, onChange, hint, required }: { label: string; options: string[]; value: string; onChange: (v: string) => void; hint?: string; required?: boolean }) {
  const hasOther = options.includes(OTHER);
  const [other, setOther] = useState(hasOther && isOtherVal(options, value));
  const sel = other ? OTHER : value;
  return (
    <div className="field">
      <label className="field" style={{ gap: 6 }}>{label}{required && <span className="hint">Required</span>}
        <select className="select" value={sel} onChange={e => { const v = e.target.value; if (v === OTHER) { setOther(true); onChange(""); } else { setOther(false); onChange(v); } }}>
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o === OTHER ? "Other (please specify)" : o}</option>)}
        </select>
      </label>
      {other && <input className="input" aria-label={`${label} — other`} placeholder="Please specify" value={value} onChange={e => onChange(e.target.value)} />}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Checkbox chips; "Other" reveals a text box. Typed values are stored alongside the picked ones. */
export function MultiOther({ legend, options, value, onChange, max }: { legend: string; options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const known = options.filter(o => o !== OTHER);
  const extras = value.filter(v => !known.includes(v));
  const [otherOn, setOtherOn] = useState(extras.length > 0);
  const [otherText, setOtherText] = useState(extras.join(", "));
  const picked = value.filter(v => known.includes(v));
  const count = picked.length + (otherOn && otherText.trim() ? 1 : 0);
  const emit = (p: string[], on: boolean, txt: string) => onChange([...p, ...(on ? txt.split(",").map(s => s.trim()).filter(Boolean) : [])]);
  return (
    <fieldset>
      <legend>{legend}{max ? <span className="muted" style={{ fontWeight: 400 }}> · pick up to {max}{count ? ` (${count} chosen)` : ""}</span> : null}</legend>
      <div className="chips">
        {options.map(o => {
          const isO = o === OTHER;
          const on = isO ? otherOn : picked.includes(o);
          const full = !!max && !on && count >= max;
          return (
            <label key={o} className={`chip${on ? " on" : ""}`} style={full ? { opacity: .5 } : undefined}>
              <input type="checkbox" checked={on} disabled={full} onChange={() => {
                if (isO) { const n = !otherOn; setOtherOn(n); emit(picked, n, otherText); }
                else emit(on ? picked.filter(x => x !== o) : [...picked, o], otherOn, otherText);
              }} />{isO ? "Other" : o}
            </label>
          );
        })}
      </div>
      {otherOn && <input className="input" style={{ marginTop: 8 }} aria-label={`${legend} — other`} placeholder="Please specify (separate with commas)" value={otherText} onChange={e => { setOtherText(e.target.value); emit(picked, true, e.target.value); }} />}
    </fieldset>
  );
}

export function Field({ label, hint, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="field">{label}<input className="input" {...p} />{hint && <span className="hint">{hint}</span>}</label>;
}
export function Area({ label, hint, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return <label className="field">{label}<textarea className="textarea" {...p} />{hint && <span className="hint">{hint}</span>}</label>;
}

export function ErrorBox({ code, msg, children }: { code?: string; msg: string; children?: React.ReactNode }) {
  return <div className="alert error" role="alert">{code && <><b className="code">Error {code}</b> · </>}{msg}{children && <div style={{ marginTop: 10 }}>{children}</div>}</div>;
}

export function initials(name: string) {
  return name.replace(/[()&.,]/g, "").split(/\s+/).filter(w => w && !/^(sdn|bhd|m)$/i.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
export function Avatar({ name, logo, round, lg }: { name: string; logo?: string; round?: boolean; lg?: boolean }) {
  return <span className={`avatar${round ? " round" : ""}${lg ? " lg" : ""}${logo ? " has-logo" : ""}`} aria-hidden="true">{logo ? <img src={logo} alt="" /> : initials(name)}</span>;
}

export function SeatDots({ used, limit }: { used: number; limit: number }) {
  return <span className="row" style={{ gap: 8 }}><span className="seatdots" aria-hidden="true">{Array.from({ length: limit }, (_, i) => <i key={i} className={i < used ? "on" : ""} />)}</span><span className="small" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{used} / {limit} seats</span></span>;
}

export function useToast() {
  const [t, setT] = useState("");
  useEffect(() => { if (!t) return; const h = setTimeout(() => setT(""), 3500); return () => clearTimeout(h); }, [t]);
  return { show: setT, node: t ? <div className="toast" role="status">{t}</div> : null };
}

/** Wraps pages that need a signed-in account (any role). `staff` = content admin or super admin. */
export function MembersOnly({ children, staff }: { children: React.ReactNode; staff?: boolean }) {
  const { me, ready } = useStore();
  if (!ready) return <div className="wrap page-head muted">Loading…</div>;
  if (!me) return (
    <div className="wrap page-head"><div className="card stack" style={{ maxWidth: 560 }}>
      <h1 className="h2">Please sign in</h1>
      <p className="muted">Sign in with your AI Xchange account to continue.</p>
      <div className="row"><Link className="btn primary" href="/signin">Sign in</Link><Link className="btn" href="/register">Join AI Xchange</Link></div>
    </div></div>
  );
  if (staff && !(["superadmin", "contentadmin"].includes(me.role) || me.staff)) return <div className="wrap page-head"><ErrorBox code="AX-403" msg="This page is for PIKOM admins only." /></div>;
  return <>{children}</>;
}

/** Shown in place of member-only details for guests and visitors. */
export function Locked({ what = "details", inline }: { what?: string; inline?: boolean }) {
  const { me } = useStore();
  const msg = me ? <>Members only · <Link href="/membership">become a member</Link></> : <>Members only · <Link href="/signin">sign in</Link></>;
  if (inline) return <span className="badge">{msg}</span>;
  return <div className="alert info small">The {what} are for PIKOM members. {me ? <Link href="/membership">See how to become a member</Link> : <><Link href="/signin">Sign in</Link> or <Link href="/membership">become a member</Link></>}.</div>;
}

export const fmtDate = (d: string) => { if (!d) return "—"; const x = new Date(d); return isNaN(+x) ? d : x.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }); };
export const ago = (d: string) => { const days = Math.round((Date.now() - +new Date(d)) / 864e5); return days <= 0 ? "today" : days === 1 ? "1 day ago" : days < 7 ? `${days} days ago` : days < 14 ? "1 week ago" : `${Math.floor(days / 7)} weeks ago`; };

/** Wrap a panel that opens in response to a click: it scrolls into view so the click visibly does something. */
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }); ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus({ preventScroll: true }); }, []);
  return <div ref={ref} className="reveal">{children}</div>;
}
