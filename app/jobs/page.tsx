"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { JOB_CATEGORIES, WORK_MODES, EXPERIENCE, JOB_TYPES, STATES } from "@/lib/options";
import { slugify } from "@/lib/directory";
import { Field, Area, SelectOther, ErrorBox, Avatar, useToast, ago } from "@/components/ui";

const QUOTA: Record<string, number> = { "Associate Member": 3, "Ordinary Member": 10, "Overseas Member": 5, "Individual Member": 1 };
const blank = { title: "", category: "", type: "Full-time", location: "Kuala Lumpur", mode: "", experience: "", salary: "", description: "", linkedinUrl: "", applyEmail: "" };

export default function Jobs() {
  const { db, me, myOrg, postJob } = useStore();
  const [posting, setPosting] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [modes, setModes] = useState<string[]>([]);
  const [exp, setExp] = useState<string[]>([]);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const toast = useToast();
  useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get("q")) setQ(p.get("q")!); if (p.get("post") && me) setPosting(true); }, [me]);

  const type = myOrg?.type || (me?.role === "individual" ? "Individual Member" : "");
  const quota = QUOTA[type] || 0;
  const used = db.jobs.filter(j => myOrg ? j.orgId === myOrg.id : j.postedBy === me?.email).length;
  const known = JOB_CATEGORIES.filter(c => c !== "Other");
  const shown = db.jobs
    .filter(j => cat === "All" || (cat === "Other" ? !known.includes(j.category) : j.category === cat))
    .filter(j => !modes.length || modes.includes(j.mode) || (modes.includes("Other") && !WORK_MODES.includes(j.mode)))
    .filter(j => !exp.length || exp.includes(j.experience))
    .filter(j => !q || (j.title + j.company + j.description).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.postedOn.localeCompare(a.postedOn));
  const tog = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <>
      <section className="hero"><div className="wrap row between" style={{ padding: "44px 24px", alignItems: "flex-end" }}>
        <div className="stack" style={{ maxWidth: 720, gap: 10 }}>
          <h1 className="h1">AI &amp; tech jobs at PIKOM member companies</h1>
          <p className="lead">Free to browse. Every employer is a verified PIKOM member. Apply here or on the employer's LinkedIn post.</p>
        </div>
        {me && me.role !== "superadmin" ? <button className="btn accent" onClick={() => setPosting(!posting)}>{posting ? "Close" : "+ Post a job"}</button>
          : me ? null : <Link className="btn ghost-dark" href="/membership">Hiring? Posting is a member benefit</Link>}
      </div></section>

      {posting && me && me.role !== "superadmin" && (
        <section className="wrap" style={{ marginTop: 24 }}>
          <form className="card hl stack" style={{ gap: 16 }} onSubmit={e => {
            e.preventDefault(); setErr("");
            if (used >= quota) return setErr(`You have used all ${quota} active job posts for your membership type. Close an old post first.`);
            if (!f.category || !f.mode) return setErr("Please choose a category and work mode.");
            if (f.linkedinUrl && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(f.linkedinUrl)) return setErr("The LinkedIn link should start with https://www.linkedin.com/");
            if (!f.linkedinUrl && !f.applyEmail) return setErr("Add a LinkedIn job link or an email for applications.");
            postJob(f); setF(blank); setPosting(false); toast.show("Job published — live for 30 days");
          }}>
            <div className="row between"><h2 className="h3" style={{ fontSize: 22 }}>Post a job</h2><span className="badge green">{type} · {used} of {quota} active posts used</span></div>
            <div className="form-grid">
              <Field label="Job title" required placeholder="e.g. Machine Learning Engineer" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
              <SelectOther label="Category" options={JOB_CATEGORIES} value={f.category} onChange={v => setF({ ...f, category: v })} />
              <SelectOther label="Employment type" options={JOB_TYPES} value={f.type} onChange={v => setF({ ...f, type: v })} />
              <SelectOther label="Work mode" options={WORK_MODES} value={f.mode} onChange={v => setF({ ...f, mode: v })} />
              <SelectOther label="Location" options={[...STATES, "Other"]} value={f.location} onChange={v => setF({ ...f, location: v })} />
              <label className="field">Experience<select className="select" value={f.experience} onChange={e => setF({ ...f, experience: e.target.value })}><option value="">Select…</option>{EXPERIENCE.map(x => <option key={x}>{x}</option>)}</select></label>
              <Field label="Monthly salary range (RM)" placeholder="12,000 – 18,000" value={f.salary} onChange={e => setF({ ...f, salary: e.target.value })} hint="Optional, but posts with salary get more applicants" />
              <Field label="LinkedIn job post URL" type="url" placeholder="https://www.linkedin.com/jobs/view/…" value={f.linkedinUrl} onChange={e => setF({ ...f, linkedinUrl: e.target.value })} hint="Candidates click through to apply on LinkedIn" />
              <Field label="Or apply by email" type="email" placeholder="careers@company.com" value={f.applyEmail} onChange={e => setF({ ...f, applyEmail: e.target.value })} />
            </div>
            <Area label="Description" required value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
            <div className="alert info small">LinkedIn doesn't allow other sites to pull job listings automatically, so members paste the link to their LinkedIn post here. Salary benchmarks from the PIKOM Job Market Outlook can appear here once that data is available [to confirm with PIKOM].</div>
            {err && <ErrorBox msg={err} />}
            <div className="row"><button className="btn primary">Publish (live 30 days)</button><button type="button" className="btn" onClick={() => setPosting(false)}>Cancel</button></div>
          </form>
        </section>
      )}

      <section className="wrap" style={{ padding: "28px 24px 0", display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        <aside className="card stack" style={{ flex: "1 1 240px", gap: 18 }}>
          <label className="field">Keyword<input className="input" placeholder="LLM, MLOps, vision…" value={q} onChange={e => setQ(e.target.value)} /></label>
          <fieldset><legend>Work mode</legend><div className="stack" style={{ gap: 6 }}>{WORK_MODES.map(m => <label key={m} className="row" style={{ gap: 8 }}><input type="checkbox" checked={modes.includes(m)} onChange={() => tog(modes, m, setModes)} />{m}</label>)}</div></fieldset>
          <fieldset><legend>Experience</legend><div className="stack" style={{ gap: 6 }}>{EXPERIENCE.map(m => <label key={m} className="row" style={{ gap: 8 }}><input type="checkbox" checked={exp.includes(m)} onChange={() => tog(exp, m, setExp)} />{m}</label>)}</div></fieldset>
        </aside>
        <div className="stack" style={{ flex: "999 1 560px", minWidth: 0, gap: 14 }}>
          <div className="chips" role="group" aria-label="Category">
            {["All", ...JOB_CATEGORIES].map(c => <button key={c} className={`chip${cat === c ? " on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
          </div>
          <span className="small muted">{shown.length} role{shown.length === 1 ? "" : "s"}</span>
          {shown.length === 0 && <div className="empty">No jobs match these filters.</div>}
          {shown.map(j => {
            const org = db.orgs.find(o => o.id === j.orgId);
            return (
              <article key={j.id} className="card row" style={{ gap: 16, alignItems: "flex-start" }}>
                <Avatar name={j.company} logo={org?.profile.logo} />
                <div className="stack" style={{ flex: "1 1 300px", minWidth: 0, gap: 6 }}>
                  <h2 className="h3">{j.title}</h2>
                  <span className="small muted" style={{ fontSize: 14 }}>{j.company} · {j.location} · {j.mode} · {j.type} · posted {ago(j.postedOn)}</span>
                  <div className="row" style={{ gap: 6 }}><span className="badge green">Verified PIKOM member</span><span className="badge">{j.category}</span>{j.experience && <span className="badge">{j.experience}</span>}</div>
                  {j.description && <p className="small muted" style={{ fontSize: 14 }}>{j.description}</p>}
                </div>
                <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  <span style={{ fontWeight: 600 }}>{j.salary || "Salary not stated"}</span>
                  {j.linkedinUrl ? <a className="btn primary sm" href={j.linkedinUrl} target="_blank" rel="noreferrer">Apply on LinkedIn ↗</a>
                    : j.applyEmail ? <a className="btn primary sm" href={`mailto:${j.applyEmail}?subject=${encodeURIComponent(j.title)}`}>Apply by email</a>
                    : <Link className="btn sm" href={`/directory/${slugify(j.company)}`}>View employer</Link>}
                </div>
              </article>);
          })}
        </div>
      </section>
      {toast.node}
    </>
  );
}
