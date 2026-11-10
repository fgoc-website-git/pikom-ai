"use client";
import { useState } from "react";
import { useStore, isSuper as superCheck } from "@/lib/store";
import { MembersOnly, useToast } from "@/components/ui";
import { Companies, Individuals, People, AdminRoles } from "@/components/admin/Access";
import { EventsAdmin, InsightsAdmin, HomeAdmin, PostsAdmin, Reports } from "@/components/admin/Content";

type Tab = "companies" | "individuals" | "people" | "roles" | "events" | "insights" | "home" | "posts" | "reports" | "log";
const GROUPS: { title: string; superOnly: boolean; tabs: [Tab, string][] }[] = [
  { title: "Access", superOnly: true, tabs: [["companies", "Companies"], ["individuals", "Individual members"], ["people", "All people"], ["roles", "Site admins"]] },
  { title: "Content", superOnly: false, tabs: [["events", "Events"], ["insights", "Insights & policy"], ["home", "Announcements"], ["posts", "Post checks"]] },
  { title: "Oversight", superOnly: false, tabs: [["reports", "Reports"], ["log", "Activity log"]] },
];

export default function Admin() { return <MembersOnly staff><AdminInner /></MembersOnly>; }

function AdminInner() {
  const { db, me } = useStore();
  const isSuper = superCheck(me);
  const groups = GROUPS.filter(g => isSuper || !g.superOnly).map(g => ({ ...g, tabs: g.tabs.filter(([k]) => isSuper || k !== "log") }));
  const [tab, setTab] = useState<Tab>(isSuper ? "companies" : "events");
  const toast = useToast();
  return (
    <div className="wrap page-head">
      <div className="stack" style={{ gap: 4, marginBottom: 20 }}>
        <span className="eyebrow">Site management</span>
        <h1 className="h1">{isSuper ? "Super admin" : "PIKOM admin"}</h1>
        <p className="muted">{isSuper ? "Manage who can access AI Xchange, and everything published on it." : "Manage PIKOM events, insights and policy, announcements and member posts."}</p>
      </div>
      <div className="side-layout">
        <nav aria-label="Admin sections" className="card stack" style={{ gap: 14, padding: 16 }}>
          {groups.map(g => (
            <div key={g.title} className="stack" style={{ gap: 2 }}>
              <span className="small muted" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{g.title}{g.superOnly && <span className="badge dark" style={{ marginLeft: 6, fontSize: 10 }}>Super admin</span>}</span>
              {g.tabs.map(([k, l]) => <button key={k} className="btn sm" aria-current={tab === k ? "page" : undefined} style={{ justifyContent: "flex-start", border: 0, background: tab === k ? "var(--blue-bg)" : "transparent", color: tab === k ? "#1E3A8A" : "var(--ink)" }} onClick={() => setTab(k)}>{l}</button>)}
            </div>))}
        </nav>
        <div style={{ minWidth: 0 }}>
          {tab === "companies" && <Companies toast={toast.show} />}
          {tab === "individuals" && <Individuals toast={toast.show} />}
          {tab === "people" && <People />}
          {tab === "roles" && <AdminRoles toast={toast.show} />}
          {tab === "events" && <EventsAdmin toast={toast.show} />}
          {tab === "insights" && <InsightsAdmin toast={toast.show} />}
          {tab === "home" && <HomeAdmin toast={toast.show} />}
          {tab === "posts" && <PostsAdmin toast={toast.show} />}
          {tab === "reports" && <Reports />}
          {tab === "log" && <div className="table-wrap"><table><thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead><tbody>{db.log.map((l, i) => <tr key={i}><td style={{ whiteSpace: "nowrap" }}>{l.at}</td><td>{l.who}</td><td>{l.what}</td></tr>)}</tbody></table></div>}
        </div>
      </div>
      {toast.node}
    </div>
  );
}
