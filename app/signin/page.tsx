"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { ErrorBox, Field } from "@/components/ui";

export default function SignIn() {
  const { signIn, db } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<{ code: string; msg: string } | null>(null);
  const [forgot, setForgot] = useState(false);
  return (
    <div className="wrap page-head" style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", alignItems: "start" }}>
      <form className="card stack" style={{ gap: 16, maxWidth: 520 }} onSubmit={e => {
        e.preventDefault(); setErr(null);
        const r = signIn(email, pw);
        if (!r.ok) return setErr(r);
        const u = db.users.find(x => x.email === email.trim().toLowerCase());
        router.push(u && ["superadmin", "contentadmin"].includes(u.role) ? "/admin" : "/");
      }}>
        <h1 className="h2">Sign in to AI Xchange</h1>
        <Field label="Work email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={pw} onChange={e => setPw(e.target.value)} />
        {err && <ErrorBox code={err.code} msg={err.msg} />}
        <button className="btn primary">Sign in</button>
        <div className="row between small">
          <button type="button" className="link-btn" onClick={() => setForgot(true)}>Forgot password?</button>
          <span>New here? <Link href="/register">Activate your access</Link></span>
        </div>
        {forgot && <div className="alert info">In the live version we email a reset link to your work email. In this demo every sample account uses the password <b>demo1234</b>.</div>}
      </form>
      <div className="card stack" style={{ gap: 10, background: "var(--blue-bg)", borderColor: "#BFDBFE" }}>
        <h2 className="h3">Who can sign in?</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Staff of a PIKOM member company whose email domain is whitelisted (up to 5 people per company)</li>
          <li>PIKOM individual members whose personal email is whitelisted</li>
          <li>Anyone with a free guest account (limited access)</li>
          <li>PIKOM staff (super admins and content admins)</li>
        </ul>
        <p className="small muted">Not a member yet? <Link href="/membership">See membership types</Link> — joining is done with PIKOM, not on this site.</p>
      </div>
    </div>
  );
}
