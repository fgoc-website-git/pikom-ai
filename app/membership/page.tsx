"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";

const TIERS = [
  { name: "Associate Member", who: "Non-tech companies incorporated in Malaysia — e.g. banks and manufacturers buying AI.", annual: "RM1,000", entry: "RM500", items: ["Full AI Xchange access for 5 people", "Find AI vendors and post RFPs", "Event & Academy member rates", "PIKOM research"] },
  { name: "Ordinary Member", who: "IT and tech companies incorporated in Malaysia.", annual: "RM2,000", entry: "RM1,000", hl: true, items: ["Full AI Xchange access for 5 people", "Verified directory listing", "Respond to RFPs, post jobs", "Policy working group seat", "PIKOM research"] },
  { name: "Overseas Member", who: "Companies incorporated outside Malaysia entering the market.", annual: "RM4,000", entry: "RM2,000", items: ["Full AI Xchange access for 5 people", "Verified directory listing", "Respond to RFPs, post jobs", "Agency connect introductions"] },
  { name: "Individual Member", who: "Professionals, academics and consultants joining PIKOM in their own name.", annual: "[fee — confirm]", entry: "[fee — confirm]", items: ["Full AI Xchange access for you", "Member contacts and directory", "Members-only events", "PIKOM research"] },
];
const ROWS = [
  ["Read policy, governance and insights", "Yes", "Yes"],
  ["See which companies are PIKOM members", "Yes", "Yes"],
  ["Company details, people, titles and contacts", "—", "Yes"],
  ["RFPs: buyer, budget, requirements, respond", "Title only", "Yes"],
  ["Jobs: salary, description, apply", "Title only", "Yes"],
  ["Post RFPs and jobs", "—", "Yes"],
  ["Events", "Open events only", "All, incl. members-only"],
  ["Past event slides & recordings", "—", "Yes"],
  ["People who can sign in", "1 (own email)", "5 per company · 1 per individual member"],
];

export default function Membership() {
  const { me } = useStore();
  return (
    <>
      <section className="wrap stack" style={{ padding: "48px 24px 0", gap: 12, alignItems: "center", textAlign: "center" }}>
        <span className="eyebrow">PIKOM membership</span>
        <h1 className="display" style={{ maxWidth: 760, fontSize: 38 }}>One PIKOM membership. The whole AI Xchange network.</h1>
        <p className="muted" style={{ fontSize: 17, maxWidth: 700 }}>AI Xchange is included with PIKOM membership. You join PIKOM through the secretariat — once you're a member, we whitelist your company email domain and up to 5 colleagues can sign in.</p>
        <div className="row" style={{ justifyContent: "center" }}><a className="btn accent" href="#contact">Join PIKOM</a>{!me && <Link className="btn" href="/register">Already a member? Activate access</Link>}</div>
      </section>

      <section className="wrap section">
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          {TIERS.map(t => (
            <div key={t.name} className={`card stack${t.hl ? " hl" : ""}`} style={{ gap: 8 }}>
              {t.hl && <span className="badge dark" style={{ alignSelf: "flex-start", background: "var(--blue)" }}>Most AI companies</span>}
              <h2 className="h2" style={{ fontSize: 19 }}>{t.name}</h2>
              <span className="small muted" style={{ fontSize: 14 }}>{t.who}</span>
              <div className="row" style={{ gap: 6, alignItems: "baseline" }}><span style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 28, fontWeight: 800 }}>{t.annual}</span><span className="muted">/ year</span></div>
              <span className="small muted">+ {t.entry} one-time entrance fee</span>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.9 }}>{t.items.map(i => <li key={i}>{i}</li>)}</ul>
              <a className={`btn${t.hl ? " accent" : ""}`} style={{ marginTop: "auto" }} href="#contact">Enquire with PIKOM</a>
            </div>))}
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>Company fees are PIKOM's published rates. On AI Xchange every paying member gets full access.</p>
      </section>

      <section className="wrap section">
        <h2 className="h2" style={{ marginBottom: 16 }}>Guest vs member access</h2>
        <div className="table-wrap"><table style={{ minWidth: 620 }}>
          <thead><tr><th>What you can do</th><th>Free guest account</th><th>PIKOM members (company or individual)</th></tr></thead>
          <tbody>{ROWS.map(r => <tr key={r[0]}><th scope="row" style={{ background: "none", textTransform: "none", letterSpacing: 0, fontSize: 14, color: "var(--ink)", fontWeight: 500, whiteSpace: "normal" }}>{r[0]}</th>{r.slice(1).map((c, i) => <td key={i} className={i === 0 ? "muted" : ""}>{c}</td>)}</tr>)}</tbody>
        </table></div>
      </section>

      <section className="wrap section">
        <h2 className="h2" style={{ marginBottom: 16 }}>Questions</h2>
        <div className="grid2">
          {[["My company is a PIKOM member but I get error AX-101", "Your email domain hasn't been whitelisted yet. Ask your company's PIKOM contact, or the secretariat, to add it."],
            ["We've used all 5 seats (AX-102)", "Your main account holder can remove someone under My account → Team seats. For more seats, contact PIKOM."],
            ["We use more than one email domain", "The secretariat can whitelist each domain. All of them share your company's 5 seats [to confirm]."],
            ["Who is the main account holder?", "The person PIKOM names when your domain is whitelisted — usually your PIKOM contact. They see everyone who joins and edit the company profile."],
            ["I left my company", "Your account stops when your work email is removed. Individual members can keep a personal account."],
            ["Can I sign up with Gmail?", "Yes, as a free guest. For full access you need to be a PIKOM Individual Member, and the secretariat whitelists that exact address."]].map(([q, a]) => (
            <div key={q} className="card stack" style={{ gap: 6 }}><h3 className="h3" style={{ fontSize: 16 }}>{q}</h3><p className="muted" style={{ fontSize: 14 }}>{a}</p></div>))}
        </div>
      </section>

      <section id="contact" className="wrap section">
        <div className="card row between" style={{ background: "var(--navy)", color: "#fff", borderColor: "var(--navy)", padding: 28 }}>
          <div className="stack" style={{ gap: 8, maxWidth: 640 }}>
            <h2 className="h2" style={{ color: "#fff" }}>Join PIKOM or get your domain whitelisted</h2>
            <p style={{ color: "#CBD5E1" }}>Membership applications, renewals and whitelisting are handled by the PIKOM secretariat.</p>
            <p style={{ color: "#CBD5E1" }}>Email: [secretariat email] · Phone: [secretariat phone]</p>
          </div>
          <a className="btn accent" href="https://pikom.org.my" target="_blank" rel="noreferrer">Visit pikom.org.my ↗</a>
        </div>
      </section>
    </>
  );
}
