"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore, ERR, type Org } from "@/lib/store";
import { ErrorBox, Field, SeatDots } from "@/components/ui";

type Kind = "org" | "individual" | "guest";

export default function Register() {
  const { checkEmail, register, seatsUsed } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [found, setFound] = useState<{ kind: Kind; org?: Org } | null>(null);
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  const [f, setF] = useState({ name: "", jobTitle: "", company: "", pw: "", pw2: "", consent: false });
  const guestable = err && (err.code === ERR.NOT_WHITELISTED || err.code === ERR.PUBLIC_EMAIL);

  return (
    <div className="wrap page-head" style={{ maxWidth: 720 }}>
      <div className="stack" style={{ gap: 6, marginBottom: 20 }}>
        <span className="eyebrow">Join AI Xchange</span>
        <h1 className="h1" style={{ fontSize: 34 }}>Create your account</h1>
        <p className="muted">PIKOM members: use the email PIKOM has on record (your company email, or your personal email if you're an individual member) to get full access. Everyone else can create a free guest account.</p>
      </div>

      {step === 1 && (
        <form className="card stack" style={{ gap: 16 }} onSubmit={e => {
          e.preventDefault(); setErr(null);
          const r = checkEmail(email);
          if (!r.ok) return setErr(r);
          setFound({ kind: r.kind as Kind, org: r.org }); setStep(2);
        }}>
          <Field label="Email" type="email" required autoComplete="email" placeholder="name@yourcompany.com.my" value={email} onChange={e => setEmail(e.target.value)} />
          {err && (
            <ErrorBox code={err.code} msg={err.msg}>
              <div className="row">
                {err.code === ERR.ALREADY_REGISTERED && <Link className="btn sm" href="/signin">Sign in</Link>}
                {guestable && <><Link className="btn sm" href="/membership#contact">Contact PIKOM</Link><button type="button" className="btn sm primary" onClick={() => { setFound({ kind: "guest" }); setStep(2); setErr(null); }}>Continue with a free guest account</button></>}
                {err.code === ERR.SUSPENDED && <Link className="btn sm" href="/membership#contact">Contact PIKOM</Link>}
                {err.code === ERR.SEATS_FULL && <span className="small">Main account holders free a seat under <b>My account → Team seats</b>.</span>}
              </div>
            </ErrorBox>)}
          <button className="btn primary">Continue</button>
          <p className="small muted">Already have an account? <Link href="/signin">Sign in</Link></p>
        </form>)}

      {step === 2 && found && (
        <form className="card stack" style={{ gap: 16 }} onSubmit={e => {
          e.preventDefault(); setErr(null);
          if (f.pw !== f.pw2) return setErr({ code: "AX-108", msg: "The two passwords don't match." });
          const r = register({ email, name: f.name, password: f.pw, jobTitle: f.jobTitle, consent: f.consent, asGuest: found.kind === "guest", company: f.company });
          if (!r.ok) return setErr(r);
          router.push("/account?welcome=1");
        }}>
          {found.kind === "org" && found.org ? (
            <div className="alert ok stack" style={{ gap: 8 }}>
              <span><b>{found.org.name}</b> is a {found.org.type} of PIKOM. You'll get <b>full access</b> and join your company's account.</span>
              <SeatDots used={seatsUsed(found.org.id)} limit={found.org.seatLimit} />
              {found.org.mainEmail === email.trim().toLowerCase() && <span>You are the <b>main account holder</b>: you'll see everyone who joins from @{found.org.domain} and manage the company profile.</span>}
            </div>
          ) : found.kind === "individual" ? <div className="alert ok">Your email is whitelisted as a <b>PIKOM Individual Member</b> — you'll get full access.</div>
            : <div className="alert info">You're creating a <b>free guest account</b>. You can read policy and insights and browse listings. Member details, contacts and applying need a PIKOM membership.</div>}
          <div className="form-grid">
            <Field label="Email" value={email} readOnly />
            <Field label="Full name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
            <Field label="Job title" value={f.jobTitle} onChange={e => setF({ ...f, jobTitle: e.target.value })} />
            {found.kind === "guest" ? <Field label="Organisation (optional)" value={f.company} onChange={e => setF({ ...f, company: e.target.value })} /> : <span />}
            <Field label="Create password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters" value={f.pw} onChange={e => setF({ ...f, pw: e.target.value })} />
            <Field label="Confirm password" type="password" autoComplete="new-password" required value={f.pw2} onChange={e => setF({ ...f, pw2: e.target.value })} />
          </div>
          <label className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 10, fontSize: 14 }}>
            <input type="checkbox" checked={f.consent} onChange={e => setF({ ...f, consent: e.target.checked })} style={{ marginTop: 4 }} />
            <span>I agree to the <Link href="/privacy" target="_blank">privacy notice (PDPA 2010)</Link> and <Link href="/terms" target="_blank">terms of use</Link>.{found.kind !== "guest" && " My name, job title, email and phone are shown to other PIKOM members on my company's page."}</span>
          </label>
          {err && <ErrorBox code={err.code} msg={err.msg} />}
          <div className="row"><button className="btn primary">Create account</button><button type="button" className="btn" onClick={() => { setStep(1); setErr(null); }}>Back</button></div>
          <p className="small muted">In the live version we first email a link to confirm you own this address.</p>
        </form>)}

      <div className="card stack" style={{ gap: 8, marginTop: 20 }}>
        <h2 className="h3">Try these in the demo</h2>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          <li><code>new.person@forest-interactive.com</code> — whitelisted company with free seats</li>
          <li><code>anyone@demo-company.com.my</code> — sample company has used all 5 seats (AX-102)</li>
          <li><code>someone@unknown-co.com</code> — not whitelisted (AX-101) → offered a guest account</li>
          <li><code>new.individual@outlook.com</code> — whitelisted individual member</li>
        </ul>
      </div>
    </div>
  );
}
