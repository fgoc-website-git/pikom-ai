"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OTHER } from "@/lib/options";
import { useStore } from "@/lib/store";
import { ERR_HELP, TIP } from "@/lib/help";

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

export function Field({ label, hint, tip, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; tip?: string }) {
  return <label className="field"><span className="lbl">{label}{tip && <Tip text={tip} />}</span><input className="input" {...p} />{hint && <span className="hint">{hint}</span>}</label>;
}
export function Area({ label, hint, tip, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; tip?: string }) {
  return <label className="field"><span className="lbl">{label}{tip && <Tip text={tip} />}</span><textarea className="textarea" {...p} />{hint && <span className="hint">{hint}</span>}</label>;
}

/** ⓘ button with a short explanation. Opens on hover, keyboard focus or tap; Esc closes. */
export function Tip({ text, label = "More info" }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = React.useId();
  const ref = React.useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off); document.addEventListener("touchstart", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("touchstart", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <span className="tip" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="tip-btn" aria-label={label} aria-describedby={open ? id : undefined} aria-expanded={open}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>i</button>
      {open && <span role="tooltip" id={id} className="tip-pop">{text}</span>}
    </span>
  );
}

/* ---------- Confirm dialog (replaces the browser pop-up) ---------- */
type AskOpts = { ok?: string; danger?: boolean; detail?: string };
let openAsk: ((q: { msg: string; opts: AskOpts; done: (v: boolean) => void }) => void) | null = null;
export const ask = (msg: string, opts: AskOpts = { danger: true }) => new Promise<boolean>(done => openAsk ? openAsk({ msg, opts, done }) : done(window.confirm(msg)));
export function ConfirmHost() {
  const [q, setQ] = useState<{ msg: string; opts: AskOpts; done: (v: boolean) => void } | null>(null);
  const okRef = React.useRef<HTMLButtonElement>(null);
  useEffect(() => { openAsk = setQ; return () => { openAsk = null; }; }, []);
  useEffect(() => { if (q) okRef.current?.focus(); }, [q]);
  if (!q) return null;
  const close = (v: boolean) => { q.done(v); setQ(null); };
  return (
    <div className="modal-back" onClick={() => close(false)} onKeyDown={e => { if (e.key === "Escape") close(false); }}>
      <div className="modal card stack" role="alertdialog" aria-modal="true" aria-labelledby="ask-t" onClick={e => e.stopPropagation()}>
        <h2 id="ask-t" className="h3">{q.msg}</h2>
        {q.opts.detail && <p className="small muted">{q.opts.detail}</p>}
        {q.opts.danger !== false && <p className="small muted">{TIP_UNDO}</p>}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" onClick={() => close(false)}>Cancel</button>
          <button ref={okRef} className={`btn ${q.opts.danger === false ? "primary" : "danger-solid"}`} onClick={() => close(true)}>{q.opts.ok || "Remove"}</button>
        </div>
      </div>
    </div>
  );
}
const TIP_UNDO = "You can undo this straight after, or restore it within 30 days.";

/** Bottom bar after a removal, with Undo. */
export function UndoBar() {
  const { lastUndo, clearUndo, restore } = useStore();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!lastUndo) return; const h = setTimeout(clearUndo, 12000); return () => clearTimeout(h); }, [lastUndo, clearUndo]);
  if (!lastUndo) return null;
  return (
    <div className="toast undo" role="status">
      <span>{lastUndo.msg}</span>
      <button className="link-btn" disabled={busy} onClick={async () => { setBusy(true); const r = await restore(lastUndo.id); setBusy(false); if (!r.ok) window.alert(`${r.code}: ${r.msg}`); }}>{busy ? "Restoring…" : "Undo"}</button>
      <button className="link-btn" aria-label="Dismiss" onClick={clearUndo}>×</button>
    </div>
  );
}

/* ---------- List tools: search, filter chips, sort, paging ---------- */
const plural = (n: string) => n === "person" ? "people" : /[^aeiou]y$/.test(n) ? n.slice(0, -1) + "ies" : n.endsWith("s") ? n : n + "s";
export function ListBar({ q, setQ, placeholder, filters, filter, setFilter, sorts, sort, setSort, count, noun, children }: {
  q: string; setQ: (v: string) => void; placeholder: string;
  filters?: [string, string, number?][]; filter?: string; setFilter?: (v: string) => void;
  sorts?: [string, string][]; sort?: string; setSort?: (v: string) => void; count: number; noun: string; children?: React.ReactNode;
}) {
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row between" style={{ gap: 10 }}>
        <div className="row" style={{ flex: "1 1 420px", gap: 10 }}>
          <input className="input" style={{ flex: "1 1 240px", maxWidth: 360, width: "auto" }} type="search" aria-label={placeholder} placeholder={placeholder} value={q} onChange={e => setQ(e.target.value)} />
          {sorts && setSort && <label className="row small" style={{ gap: 6, flexWrap: "nowrap" }}><span className="muted">Sort</span><select className="select" style={{ width: "auto" }} value={sort} onChange={e => setSort(e.target.value)}>{sorts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>}
        </div>
        <div className="row" style={{ gap: 8 }}>{children}</div>
      </div>
      {filters && setFilter && (
        <div className="row between" style={{ gap: 8 }}>
          <div className="chips" role="group" aria-label="Filter">{filters.map(([k, l, n]) => <button key={k} type="button" className={`chip${filter === k ? " on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}{n !== undefined && <span className="chip-n">{n}</span>}</button>)}</div>
          <span className="small muted">{count} {count === 1 ? noun : plural(noun)}</span>
        </div>)}
      {!filters && <span className="small muted">{count} {count === 1 ? noun : plural(noun)}</span>}
    </div>
  );
}
export function usePaged<T>(items: T[], size = 20) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  useEffect(() => { if (page > pages) setPage(1); }, [pages, page]);
  return { rows: items.slice((page - 1) * size, page * size), page, pages, setPage, total: items.length, size };
}
export function Pager({ page, pages, setPage, total, size }: { page: number; pages: number; setPage: (n: number) => void; total: number; size: number }) {
  if (pages <= 1) return null;
  return (
    <div className="row between small" style={{ marginTop: 4 }}>
      <span className="muted">Showing {(page - 1) * size + 1}–{Math.min(page * size, total)} of {total}</span>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
        <span className="muted">Page {page} of {pages}</span>
        <button className="btn sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
      </div>
    </div>
  );
}
/** Read a ?key= value once on load (avoids Next's Suspense requirement for useSearchParams). */
export function useQueryParam(key: string, fallback = "") {
  const [v, setV] = useState(fallback);
  useEffect(() => { const x = new URLSearchParams(window.location.search).get(key); if (x) setV(x); }, [key]);
  return [v, setV] as const;
}

export function ErrorBox({ code, msg, children }: { code?: string; msg: string; children?: React.ReactNode }) {
  const help = code ? ERR_HELP[code] : undefined;
  return <div className="alert error" role="alert">{code && <><b className="code">Error {code}</b>{help && <Tip text={help} label={`What does ${code} mean?`} />} · </>}{msg}{children && <div style={{ marginTop: 10 }}>{children}</div>}</div>;
}

export function initials(name: string) {
  return name.replace(/[()&.,]/g, "").split(/\s+/).filter(w => w && !/^(sdn|bhd|m)$/i.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
export function Avatar({ name, logo, round, lg }: { name: string; logo?: string; round?: boolean; lg?: boolean }) {
  return <span className={`avatar${round ? " round" : ""}${lg ? " lg" : ""}${logo ? " has-logo" : ""}`} aria-hidden="true">{logo ? <img src={logo} alt="" /> : initials(name)}</span>;
}

export function SeatDots({ used, limit }: { used: number; limit: number }) {
  return <span className="row" style={{ gap: 8 }}><span className="seatdots" aria-hidden="true">{Array.from({ length: limit }, (_, i) => <i key={i} className={i < used ? "on" : ""} />)}</span><span className="small" style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{used} / {limit} seats</span><Tip text={TIP.seats} label="About seats" /></span>;
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
  if (inline) return <span className="badge">{msg}<Tip text={TIP.membersOnly} /></span>;
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
