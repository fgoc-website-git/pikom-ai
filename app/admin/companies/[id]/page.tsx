"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore, isSuper, adminsOf } from "@/lib/store";
import { slugify } from "@/lib/directory";
import { ErrorBox, SeatDots, Avatar, useToast, fmtDate } from "@/components/ui";
import { CompanyManager } from "@/components/company/CompanyManager";

export default function ManageCompany() { return <Inner />; }

function Inner() {
  const { id } = useParams<{ id: string }>();
  const { db, me, seatsUsed } = useStore();
  const router = useRouter();
  const toast = useToast();
  if (!isSuper(me)) return <ErrorBox code="AX-403" msg="Only super admins can manage companies." />;
  const org = db.orgs.find(o => o.id === id);
  if (!org) return <div className="stack"><ErrorBox code="AX-404" msg="This company isn't on AI Xchange (it may have been removed)." /><Link href="/admin/companies">← Companies</Link></div>;
  const admins = adminsOf(db, org.id);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Link href="/admin/companies" className="small">← Companies</Link>
      <div className="card row between" style={{ gap: 16 }}>
        <div className="row" style={{ flexWrap: "nowrap", gap: 14 }}>
          <Avatar name={org.name} logo={org.profile.logo} lg />
          <div className="stack" style={{ gap: 4 }}>
            <h1 className="h2">{org.name}</h1>
            <span className="small muted">{org.type} · {org.domain ? `@${org.domain}` : "domain not set"} · whitelisted {fmtDate(org.whitelistedOn)} · renews {fmtDate(org.renewal)}</span>
            <span className="row" style={{ gap: 6 }}>
              {org.status === "active" ? <span className="badge green">Active</span> : <span className="badge red">Paused</span>}
              {!org.domain && <span className="badge red">Domain needed</span>}
              <span className="badge">{admins.length ? `Admin: ${admins.map(a => a.name).join(", ")}` : org.mainEmail ? `Admin invited: ${org.mainEmail}` : "No company admin yet"}</span>
            </span>
          </div>
        </div>
        <div className="row"><SeatDots used={seatsUsed(org.id)} limit={org.seatLimit} /><Link className="btn sm" href={`/members/${slugify(org.name)}`}>View public page</Link></div>
      </div>
      <CompanyManager org={org} toast={toast.show} onRemoved={() => router.push("/admin/companies")} initial={org.domain ? "people" : "settings"} />
      {toast.node}
    </div>
  );
}
