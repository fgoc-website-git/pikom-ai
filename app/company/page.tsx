"use client";
import Link from "next/link";
import { useStore, roleLabel, adminsOf, canManageCompany } from "@/lib/store";
import { slugify } from "@/lib/directory";
import { MembersOnly, Avatar, SeatDots, useToast, Tip } from "@/components/ui";
import { CompanyManager } from "@/components/company/CompanyManager";
import { TIP, PAGE_HELP } from "@/lib/help";

export default function MyCompany() { return <MembersOnly><Inner /></MembersOnly>; }

function Inner() {
  const { db, me, myOrg, seatsUsed } = useStore();
  const toast = useToast();
  if (!myOrg) return (
    <div className="wrap page-head"><div className="card stack" style={{ maxWidth: 560 }}>
      <h1 className="h2">No company linked</h1>
      <p className="muted">{me!.role === "individual" ? "You're an Individual Member, so your account isn't linked to a company. Your RFPs are under Account settings → My RFPs." : "Your account isn't linked to a member company."}</p>
      <Link className="btn" style={{ alignSelf: "flex-start" }} href="/account">Account settings</Link>
    </div></div>
  );
  const admins = adminsOf(db, myOrg.id);
  const tip = me!.role === "main" ? TIP.companyAdmin : me!.role === "editor" ? TIP.contentAdmin : TIP.companyMember;
  return (
    <div className="wrap page-head stack" style={{ gap: 20 }}>
      <div className="card row between" style={{ gap: 16 }}>
        <div className="row" style={{ flexWrap: "nowrap", gap: 14 }}>
          <Avatar name={myOrg.name} logo={myOrg.profile.logo} lg />
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">My company</span>
            <h1 className="h2">{myOrg.name}</h1>
            <span className="small muted">{myOrg.type}{myOrg.domain ? ` · @${myOrg.domain}` : ""} · Admin{admins.length === 1 ? "" : "s"}: {admins.map(a => a.name).join(", ") || "not set"}</span>
            <span className="row" style={{ gap: 6 }}><span className="badge blue">You: {roleLabel(me!.role)}</span><Tip text={tip} label="What can I do here?" /></span>
          </div>
        </div>
        <div className="row"><SeatDots used={seatsUsed(myOrg.id)} limit={myOrg.seatLimit} /><Link className="btn sm" href={`/members/${slugify(myOrg.name)}`}>View public page</Link></div>
      </div>
      {!canManageCompany(me, myOrg.id) && me!.role !== "editor" && <div className="alert info small">{PAGE_HELP.company[0]} Only company admins and content admins can make changes.</div>}
      <CompanyManager org={myOrg} toast={toast.show} />
      {toast.node}
    </div>
  );
}
