"use client";
import { TIP } from "@/lib/help";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore, canPostJob, canPostRfp, rfpStatus, settingsOf, PROCUREMENT_TYPES } from "@/lib/store";
import { JOB_CATEGORIES, WORK_MODES, EXPERIENCE, JOB_TYPES, STATES, INDUSTRIES_SERVED } from "@/lib/options";
import { slugify } from "@/lib/directory";
import { Field, Area, SelectOther, ErrorBox, Avatar, Locked, useToast, ago, fmtDate, Tip } from "@/components/ui";
import { SearchIcon } from "@/components/PageHero";

const blankJob = { title: "", category: "", type: "Full-time", location: "Kuala Lumpur", mode: "", experience: "", salary: "", description: "", linkedinUrl: "", applyEmail: "" };
const blankRfp = { title: "", buyer: "", sector: "", type: "", budget: "", closes: "", description: "", contactEmail: "", procurementType: "", publishedOn: "", ref: "", docRef: "", sourceUrl: "", summary: "", country: "Malaysia", noticeType: "RFP" };

export default function Opportunities() {
  const [tab, setTab] = useState<"business" | "jobs">("business");
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("tab") === "jobs") setTab("jobs"); }, []);
  return (
    <>
      <section className="page-hero"><div className="wrap" style={{ paddingBottom: 0 }}>
        <h1 className="h1">Opportunities</h1>
        <p>AI tenders, RFPs and jobs from government, industry and PIKOM member companies.</p>
        <div className="tabs" role="tablist" style={{ borderBottom: 0, marginBottom: 0, marginTop: 16 }}>
          {([["business", "Tenders & RFPs"], ["jobs", "Jobs"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className="tab" style={{ color: tab === k ? "#fff" : "#CBD5E1", borderColor: tab === k ? "#fff" : "transparent" }} onClick={() => { setTab(k); history.replaceState(null, "", k === "jobs" ? "?tab=jobs" : "?"); }}>{l}</button>))}
        </div>
      </div></section>
      {tab === "business" ? <Business /> : <Jobs />}
    </>
  );
}

const daysLeft = (d: string) => Math.ceil((+new Date(d) - +new Date(new Date().toISOString().slice(0, 10))) / 864e5);
/** Time bar from publication to bid deadline; full and red-grey once closed. */
function Deadline({ r, stt }: { r: { publishedOn?: string; postedOn: string; closes: string }; stt: string }) {
  const start = +new Date(r.publishedOn || r.postedOn), end = +new Date(r.closes), now = +new Date(new Date().toISOString().slice(0, 10));
  const closed = stt !== "Open";
  const pct = closed ? 100 : end > start ? Math.min(100, Math.max(4, ((now - start) / (end - start)) * 100)) : 100;
  const dl = daysLeft(r.closes);
  const tone = closed ? "closed" : dl <= 3 ? "urgent" : dl <= 10 ? "soon" : "ok";
  return (
    <div className={`deadline ${tone}`}>
      <div className="row between small" style={{ gap: 8 }}>
        <b>{closed ? (stt === "Awarded" ? "Awarded" : "Application closed") : dl === 0 ? "Closes today" : `${dl} day${dl === 1 ? "" : "s"} left`}</b>
        <span className="muted">{closed ? `Closed ${fmtDate(r.closes)}` : `Closes ${fmtDate(r.closes)}`}</span>
      </div>
      <div className="deadline-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Time until bid deadline"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
function Fact({ k, v }: { k: string; v?: string }) { return <div className="fact"><span>{k}</span><b>{v || "—"}</b></div>; }

function Business() {
  const { db, me, full, postRfp, settingsOf: _s } = { ...useStore(), settingsOf };
  const [posting, setPosting] = useState(false);
  const [f, setF] = useState(blankRfp);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("open");
  const [ptype, setPtype] = useState("");
  const toast = useToast();
  const canPost = canPostRfp(me);
  const st = _s(db);
  const all = db.rfps.filter(r => !r.hidden);
  const list = all
    .filter(r => status === "all" || (status === "open" ? rfpStatus(r) === "Open" : rfpStatus(r) !== "Open"))
    .filter(r => !ptype || (r.procurementType || "Other") === ptype)
    .filter(r => !q || [r.title, r.buyer, r.ref, r.docRef, r.sector].join(" ").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => status === "closed" ? b.closes.localeCompare(a.closes) : a.closes.localeCompare(b.closes));
  const nOpen = all.filter(r => rfpStatus(r) === "Open").length;
  return (
    <section className="wrap stack" style={{ gap: 14, paddingTop: 28 }}>
      <div className="row between">
        <p className="muted" style={{ maxWidth: 640 }}>AI tenders and RFPs from government and industry, shared by PIKOM and member companies. Open one to see the summary, key facts and how to respond.</p>
        {canPost ? <button className="btn primary" onClick={() => setPosting(!posting)}>{posting ? "Close" : "+ Share a tender / RFP"}</button>
          : full && me?.orgId && <span className="small muted">Tenders and RFPs are shared by your company admin or content admin.</span>}
      </div>
      {!full && <Locked what="tender references, values, summaries and contacts" />}
      {posting && (
        <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); setErr("");
          if (!f.sector || !f.procurementType) return setErr("Please choose a sector and procurement type."); if (!f.closes) return setErr("Add the bid deadline.");
          postRfp(f); setF(blankRfp); setPosting(false); toast.show("Published — thank you for sharing"); }}>
          <h2 className="h2" style={{ fontSize: 20 }}>Share a tender or RFP</h2>
          <p className="small muted">Found a public tender, or need a vendor yourself? Fill in what you know — anything not stated in the notice can be left as “Refer document”.</p>
          <div className="form-grid">
            <Field label="Title" required placeholder="e.g. AI server infrastructure for …" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
            <Field label="Purchaser / buyer" required placeholder="e.g. Ministry of Transport Malaysia" value={f.buyer} onChange={e => setF({ ...f, buyer: e.target.value })} hint="Leave as your company if it's your own RFP" />
            <SelectOther label="Sector" options={INDUSTRIES_SERVED} value={f.sector} onChange={v => setF({ ...f, sector: v })} />
            <SelectOther label="Procurement type" options={PROCUREMENT_TYPES} value={f.procurementType} onChange={v => setF({ ...f, procurementType: v })} />
            <Field label="Tender value / budget" placeholder="MYR 150,000 or Refer document" value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })} />
            <Field label="Publication date" type="date" value={f.publishedOn} onChange={e => setF({ ...f, publishedOn: e.target.value })} />
            <Field label="Bid deadline" type="date" required value={f.closes} onChange={e => setF({ ...f, closes: e.target.value })} />
            <Field label="Tender / reference no." placeholder="e.g. TOT 150633071" value={f.ref} onChange={e => setF({ ...f, ref: e.target.value })} />
            <Field label="Document / notice no." placeholder="e.g. QT260000000027197" value={f.docRef} onChange={e => setF({ ...f, docRef: e.target.value })} />
            <Field label="Source link" type="url" placeholder="https://…" value={f.sourceUrl} onChange={e => setF({ ...f, sourceUrl: e.target.value })} hint="Where members can get the tender documents" />
            <Field label="Contact email for responses (optional)" type="email" value={f.contactEmail} onChange={e => setF({ ...f, contactEmail: e.target.value })} />
          </div>
          <Area label="Summary" required maxLength={600} placeholder="Who is buying what, by when, and anything members should know" value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} />
          <Area label="Tender details (optional)" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
          {err && <ErrorBox msg={err} />}
          <div className="row"><button className="btn primary">Publish</button><button type="button" className="btn" onClick={() => setPosting(false)}>Cancel</button></div>
        </form>)}
      <div className="row between" style={{ gap: 10 }}>
        <div className="row" style={{ gap: 10, flex: "1 1 420px" }}>
          <label className="search" style={{ flex: "1 1 260px", maxWidth: 380 }}><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Search</span><SearchIcon /><input className="input" placeholder="Search title, buyer or reference no." value={q} onChange={e => setQ(e.target.value)} /></label>
          <select className="select" style={{ width: "auto" }} aria-label="Procurement type" value={ptype} onChange={e => setPtype(e.target.value)}><option value="">All types</option>{PROCUREMENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </div>
        <div className="chips" role="group" aria-label="Status">{([["open", `Open (${nOpen})`], ["closed", `Closed (${all.length - nOpen})`], ["all", `All (${all.length})`]] as const).map(([k, l]) => <button key={k} className={`chip${status === k ? " on" : ""}`} aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>)}</div>
      </div>
      {list.length === 0 && <div className="empty">{status === "open" ? <>No open tenders right now. <button className="link-btn" onClick={() => setStatus("closed")}>See closed tenders</button></> : "Nothing matches."}</div>}
      {list.map(r => { const stt = rfpStatus(r); const isOpen = open === r.id; return (
        <article key={r.id} className="card stack tender" style={{ gap: 10 }}>
          <div className="row between" style={{ alignItems: "flex-start", gap: 16 }}>
            <div className="stack" style={{ gap: 6, flex: "1 1 420px", minWidth: 0 }}>
              <div className="row" style={{ gap: 6 }}>
                <span className={`badge ${stt === "Open" ? "green" : stt === "Awarded" ? "blue" : ""}`}>{stt}</span>
                {r.procurementType && <span className="badge">{r.procurementType}</span>}
                {r.noticeType && <span className="badge">{r.noticeType}</span>}
                {full && r.ref && <span className="small muted">Ref {r.ref}</span>}
              </div>
              <h2 className="h3">{r.title}</h2>
              <span className="small" style={{ fontSize: 14 }}><b style={{ fontWeight: 600 }}>{r.buyer}</b>{r.country ? ` · ${r.country}` : ""}{r.sector ? ` · ${r.sector}` : ""}</span>
            </div>
            <div className="tender-side">
              <span className="small muted">Bid deadline</span><b>{fmtDate(r.closes)}</b>
              <span className="small muted" style={{ marginTop: 6 }}>Value</span>{full ? <b className="small">{r.budget || "Refer document"}</b> : <Locked inline />}
            </div>
          </div>
          <Deadline r={r} stt={stt} />
          <div className="row between" style={{ gap: 8 }}>
            <span className="small muted">{r.poster ? `Shared by ${r.poster}` : ""}{r.publishedOn ? ` · published ${fmtDate(r.publishedOn)}` : ""}{r.source ? ` · source: ${r.source}` : ""}</span>
            {full ? <button className="btn sm" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)}>{isOpen ? "Hide details" : "View details"}</button>
              : <span className="row" style={{ gap: 4, flexWrap: "nowrap" }}><button className="btn sm" disabled title="Members only">View details</button><Tip text={TIP.membersOnly} label="Why can't I see details?" /></span>}
          </div>
          {full && isOpen && (
            <div className="stack" style={{ gap: 14, borderTop: "1px solid var(--soft)", paddingTop: 14 }}>
              {r.summary && <div className="stack" style={{ gap: 4 }}><h3 className="h3" style={{ fontSize: 15 }}>Executive summary</h3><p style={{ margin: 0 }}>{r.summary}</p></div>}
              <div className="facts">
                <Fact k="Tender ref. no." v={r.ref} /><Fact k="Document ref. no." v={r.docRef} />
                <Fact k="Country" v={r.country} /><Fact k="Notice type" v={r.noticeType} />
                <Fact k="Competition" v={r.competition} /><Fact k="Publication date" v={r.publishedOn ? fmtDate(r.publishedOn) : ""} />
                <Fact k="Bid deadline" v={fmtDate(r.closes)} /><Fact k="EMD (deposit)" v={r.emd} />
                <Fact k="Tender value" v={r.budget} /><Fact k="Purchaser ownership" v={r.ownership} />
                <Fact k="Procurement type" v={r.procurementType || r.type} /><Fact k="Financier" v={r.financier} />
              </div>
              {r.description && <div className="stack" style={{ gap: 4 }}><h3 className="h3" style={{ fontSize: 15 }}>Tender details</h3><p style={{ margin: 0 }}>{r.description}</p></div>}
              <div className="row" style={{ gap: 8 }}>
                {stt === "Open" && r.contactEmail && <a className="btn primary sm" href={`mailto:${r.contactEmail}?subject=${encodeURIComponent("Response: " + r.title)}`}>Respond to buyer</a>}
                {r.sourceUrl && <a className={`btn sm${stt === "Open" && !r.contactEmail ? " primary" : ""}`} href={r.sourceUrl} target="_blank" rel="noreferrer">Get tender documents ↗</a>}
                <a className="btn sm" href={`mailto:${st.secretariatEmail || ""}?subject=${encodeURIComponent(`More information: ${r.title}${r.ref ? ` (${r.ref})` : ""}`)}`}>Request more information</a>
              </div>
              {stt !== "Open" && <p className="small muted" style={{ margin: 0 }}>This tender has closed. It stays listed for reference and for similar opportunities.</p>}
            </div>)}
        </article>); })}
      {toast.node}
    </section>
  );
}

function Jobs() {
  const { db, me, myOrg, full, postJob } = useStore();
  const [posting, setPosting] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [modes, setModes] = useState<string[]>([]);
  const [exp, setExp] = useState<string[]>([]);
  const [f, setF] = useState(blankJob);
  const [err, setErr] = useState("");
  const toast = useToast();
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("post") && canPostJob(me)) setPosting(true); }, [me]);
  const canPost = canPostJob(me);
  const known = JOB_CATEGORIES.filter(c => c !== "Other");
  const shown = db.jobs.filter(j => !j.hidden)
    .filter(j => cat === "All" || (cat === "Other" ? !known.includes(j.category) : j.category === cat))
    .filter(j => !modes.length || modes.includes(j.mode) || (modes.includes("Other") && !WORK_MODES.includes(j.mode)))
    .filter(j => !exp.length || exp.includes(j.experience))
    .filter(j => !q || (j.title + j.company).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.postedOn.localeCompare(a.postedOn));
  const tog = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  return (
    <>
      <section className="wrap" style={{ paddingTop: 28 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <p className="muted">Roles at verified PIKOM member companies. Apply on the employer's LinkedIn post or by email.</p>
          {canPost ? <button className="btn accent" onClick={() => setPosting(!posting)}>{posting ? "Close" : "+ Post a job"}</button>
            : full && me && <span className="small muted">{me.role === "individual" ? "Job openings are posted by member companies — you can apply to any of them." : me.orgId ? "Jobs are posted by your company admin or content admin." : ""}</span>}
        </div>
        {!full && <Locked what="salaries, job descriptions and how to apply" />}
        {posting && canPost && (
          <form className="card hl stack" style={{ gap: 16, marginTop: 14 }} onSubmit={e => {
            e.preventDefault(); setErr("");
            if (!f.category || !f.mode) return setErr("Please choose a category and work mode.");
            if (f.linkedinUrl && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(f.linkedinUrl)) return setErr("The LinkedIn link should start with https://www.linkedin.com/");
            if (!f.linkedinUrl && !f.applyEmail) return setErr("Add a LinkedIn job link or an email for applications.");
            postJob(f); setF(blankJob); setPosting(false); toast.show("Job published — live for 30 days");
          }}>
            <div className="row between"><h2 className="h2" style={{ fontSize: 20 }}>Post a job</h2><span className="badge green">Posting as {myOrg?.name || me!.name}</span></div>
            <div className="form-grid">
              <Field label="Job title" required placeholder="e.g. Machine Learning Engineer" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
              <SelectOther label="Category" options={JOB_CATEGORIES} value={f.category} onChange={v => setF({ ...f, category: v })} />
              <SelectOther label="Employment type" options={JOB_TYPES} value={f.type} onChange={v => setF({ ...f, type: v })} />
              <SelectOther label="Work mode" options={WORK_MODES} value={f.mode} onChange={v => setF({ ...f, mode: v })} />
              <SelectOther label="Location" options={[...STATES, "Other"]} value={f.location} onChange={v => setF({ ...f, location: v })} />
              <label className="field">Experience<select className="select" value={f.experience} onChange={e => setF({ ...f, experience: e.target.value })}><option value="">Select…</option>{EXPERIENCE.map(x => <option key={x}>{x}</option>)}</select></label>
              <Field label="Monthly salary range (RM)" placeholder="12,000 – 18,000" value={f.salary} onChange={e => setF({ ...f, salary: e.target.value })} />
              <Field label="LinkedIn job post URL" type="url" placeholder="https://www.linkedin.com/jobs/view/…" value={f.linkedinUrl} onChange={e => setF({ ...f, linkedinUrl: e.target.value })} hint="Candidates apply on LinkedIn" />
              <Field label="Or apply by email" type="email" placeholder="careers@company.com" value={f.applyEmail} onChange={e => setF({ ...f, applyEmail: e.target.value })} />
            </div>
            <Area label="Description" required value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
            <div className="alert info small">LinkedIn doesn't let other sites pull job listings automatically, so paste the link to your LinkedIn post here.</div>
            {err && <ErrorBox msg={err} />}
            <div className="row"><button className="btn primary">Publish (live 30 days)</button><button type="button" className="btn" onClick={() => setPosting(false)}>Cancel</button></div>
          </form>)}
      </section>
      <section className="wrap" style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", marginTop: 16 }}>
        <aside className="card stack" style={{ flex: "0 1 240px", gap: 18 }}>
          <label className="search" style={{ flex: "none", minWidth: 0 }}><span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>Keyword</span><SearchIcon /><input className="input" placeholder="Keyword" value={q} onChange={e => setQ(e.target.value)} /></label>
          <fieldset><legend>Work mode</legend><div className="stack" style={{ gap: 6 }}>{WORK_MODES.map(m => <label key={m} className="row" style={{ gap: 8 }}><input type="checkbox" checked={modes.includes(m)} onChange={() => tog(modes, m, setModes)} />{m}</label>)}</div></fieldset>
          <fieldset><legend>Experience</legend><div className="stack" style={{ gap: 6 }}>{EXPERIENCE.map(m => <label key={m} className="row" style={{ gap: 8 }}><input type="checkbox" checked={exp.includes(m)} onChange={() => tog(exp, m, setExp)} />{m}</label>)}</div></fieldset>
        </aside>
        <div className="stack" style={{ flex: "999 1 560px", minWidth: 0, gap: 14 }}>
          <div className="chips" role="group" aria-label="Category">{["All", ...JOB_CATEGORIES].map(c => <button key={c} className={`chip${cat === c ? " on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}</div>
          <span className="count">{shown.length} role{shown.length === 1 ? "" : "s"}</span>
          {shown.length === 0 && <div className="empty">{db.jobs.filter(j => !j.hidden).length === 0 ? "No jobs posted yet. Company admins and content admins at PIKOM member companies can post AI roles here." : "No jobs match these filters."}</div>}
          {shown.map(j => {
            const org = db.orgs.find(o => o.id === j.orgId);
            return (
              <article key={j.id} className="card row" style={{ gap: 16, alignItems: "flex-start" }}>
                <Avatar name={j.company} logo={org?.profile.logo} />
                <div className="stack" style={{ flex: "1 1 300px", minWidth: 0, gap: 6 }}>
                  <h2 className="h3">{j.title}</h2>
                  <span className="small muted" style={{ fontSize: 14 }}>{org ? <Link href={`/members/${slugify(org.name)}`}>{j.company}</Link> : j.company} · {j.location} · {j.mode} · posted {ago(j.postedOn)}</span>
                  <div className="row" style={{ gap: 6 }}><span className="badge green">Verified PIKOM member</span><span className="badge">{j.category}</span>{j.experience && <span className="badge">{j.experience}</span>}</div>
                  {full && j.description && <p className="small muted" style={{ fontSize: 14 }}>{j.description}</p>}
                </div>
                <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  {full ? <span style={{ fontWeight: 600 }}>{j.salary || "Salary not stated"}</span> : <Locked inline />}
                  {!full ? <span className="row" style={{ gap: 4, flexWrap: "nowrap" }}><button className="btn primary sm" disabled title="Members only">Apply</button><Tip text={TIP.membersOnly} label="Why can't I apply?" /></span>
                    : j.linkedinUrl ? <a className="btn primary sm" href={j.linkedinUrl} target="_blank" rel="noreferrer">Apply on LinkedIn ↗</a>
                    : <a className="btn primary sm" href={`mailto:${j.applyEmail}?subject=${encodeURIComponent(j.title)}`}>Apply by email</a>}
                </div>
              </article>);
          })}
        </div>
      </section>
      {toast.node}
    </>
  );
}
