"use client";
import { TIP } from "@/lib/help";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore, canPostJob, canPostRfp } from "@/lib/store";
import { JOB_CATEGORIES, WORK_MODES, EXPERIENCE, JOB_TYPES, STATES, INDUSTRIES_SERVED } from "@/lib/options";
import { slugify } from "@/lib/directory";
import { Field, Area, SelectOther, ErrorBox, Avatar, Locked, useToast, ago, fmtDate, Tip } from "@/components/ui";
import { SearchIcon } from "@/components/PageHero";

const RFP_TYPES = ["Solution required", "POC first", "Training programme", "Managed service", "Co-development", "Other"];
const blankJob = { title: "", category: "", type: "Full-time", location: "Kuala Lumpur", mode: "", experience: "", salary: "", description: "", linkedinUrl: "", applyEmail: "" };
const blankRfp = { title: "", sector: "", type: "", budget: "", closes: "", description: "", contactEmail: "" };

export default function Opportunities() {
  const [tab, setTab] = useState<"business" | "jobs">("business");
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("tab") === "jobs") setTab("jobs"); }, []);
  return (
    <>
      <section className="page-hero"><div className="wrap" style={{ paddingBottom: 0 }}>
        <h1 className="h1">Opportunities</h1>
        <p>Business requirements (RFPs) and jobs from PIKOM member companies.</p>
        <div className="tabs" role="tablist" style={{ borderBottom: 0, marginBottom: 0, marginTop: 16 }}>
          {([["business", "Business (RFPs)"], ["jobs", "Jobs"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className="tab" style={{ color: tab === k ? "#fff" : "#CBD5E1", borderColor: tab === k ? "#fff" : "transparent" }} onClick={() => { setTab(k); history.replaceState(null, "", k === "jobs" ? "?tab=jobs" : "?"); }}>{l}</button>))}
        </div>
      </div></section>
      {tab === "business" ? <Business /> : <Jobs />}
    </>
  );
}

function Business() {
  const { db, me, full, postRfp } = useStore();
  const [posting, setPosting] = useState(false);
  const [f, setF] = useState(blankRfp);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  const canPost = canPostRfp(me);
  const list = db.rfps.filter(r => !r.hidden).sort((a, b) => Number(a.status !== "Open") - Number(b.status !== "Open") || a.closes.localeCompare(b.closes));
  return (
    <section className="wrap stack" style={{ gap: 14, paddingTop: 28 }}>
      <div className="row between">
        <p className="muted">Buyers looking for AI vendors and partners. Responses go straight to the buyer.</p>
        {canPost ? <button className="btn primary" onClick={() => setPosting(!posting)}>{posting ? "Close" : "+ Post an RFP"}</button>
          : full && me?.orgId && <span className="small muted">RFPs are posted by your company admin or content admin.</span>}
      </div>
      {!full && <Locked what="buyer names, budgets, requirements and contacts" />}
      {posting && (
        <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => { e.preventDefault(); setErr("");
          if (!f.sector || !f.type) return setErr("Please choose a sector and type."); if (!f.contactEmail) return setErr("Add a contact email for responses.");
          postRfp(f); setF(blankRfp); setPosting(false); toast.show("RFP published"); }}>
          <h2 className="h2" style={{ fontSize: 20 }}>Post an RFP</h2>
          <div className="form-grid">
            <Field label="What do you need?" required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
            <SelectOther label="Sector" options={INDUSTRIES_SERVED} value={f.sector} onChange={v => setF({ ...f, sector: v })} />
            <SelectOther label="Type" options={RFP_TYPES} value={f.type} onChange={v => setF({ ...f, type: v })} />
            <Field label="Budget range" placeholder="RM 200K – 500K, or 'To discuss'" value={f.budget} onChange={e => setF({ ...f, budget: e.target.value })} />
            <Field label="Closing date" type="date" required value={f.closes} onChange={e => setF({ ...f, closes: e.target.value })} />
            <Field label="Contact email for responses" type="email" required value={f.contactEmail} onChange={e => setF({ ...f, contactEmail: e.target.value })} />
          </div>
          <Area label="Requirements" required value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
          {err && <ErrorBox msg={err} />}
          <div className="row"><button className="btn primary">Publish</button><button type="button" className="btn" onClick={() => setPosting(false)}>Cancel</button></div>
        </form>)}
      {list.map(r => (
        <article key={r.id} className="card stack" style={{ gap: 10 }}>
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div className="stack" style={{ gap: 4, flex: "1 1 360px" }}>
              <h2 className="h3">{r.title}</h2>
              <span className="small muted" style={{ fontSize: 14 }}>{r.sector} · {r.type} · closes {fmtDate(r.closes)}</span>
              <div className="row" style={{ gap: 6 }}>
                <span className={`badge ${r.status === "Open" ? "green" : ""}`}>{r.status}</span>
                {full ? <><span className="badge blue">{r.budget || "Budget to discuss"}</span><span className="badge">Buyer: {r.buyer}</span></> : <Locked inline />}
              </div>
            </div>
            {full ? <button className="btn sm" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Hide details" : "View details"}</button>
              : <span className="row" style={{ gap: 4, flexWrap: "nowrap" }}><button className="btn sm" disabled title="Members only">Respond</button><Tip text={TIP.membersOnly} label="Why can't I respond?" /></span>}
          </div>
          {full && open === r.id && (
            <div className="stack" style={{ gap: 10, borderTop: "1px solid var(--soft)", paddingTop: 12 }}>
              <p>{r.description}</p>
              {r.status === "Open" && <a className="btn primary sm" style={{ alignSelf: "flex-start" }} href={`mailto:${r.contactEmail}?subject=${encodeURIComponent("Response: " + r.title)}`}>Respond to buyer</a>}
            </div>)}
        </article>))}
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
          {shown.length === 0 && <div className="empty">No jobs match these filters.</div>}
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
