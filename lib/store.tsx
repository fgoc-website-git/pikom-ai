"use client";
// DEMO STORE — everything lives in this browser's localStorage so the portal can be clicked
// through without a backend. Phase 2 replaces this with Supabase Auth + Postgres (same shapes,
// same rules). Never put real passwords or personal data in the demo.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SEAT_LIMIT, PUBLIC_EMAIL_DOMAINS, type MemberType } from "./options";
import { MEMBERS, CATS } from "./data";

export type Role = "superadmin" | "contentadmin" | "main" | "member" | "individual" | "guest";
export const PAYING: Role[] = ["main", "member", "individual"];
export const STAFF: Role[] = ["superadmin", "contentadmin"];
/** Full access = paying members and PIKOM staff. Guests and visitors see listings only. */
export const isSuper = (u: User | null) => !!u && (u.role === "superadmin" || u.staff === "super");
export const isStaff = (u: User | null) => !!u && (STAFF.includes(u.role) || !!u.staff);
export const fullAccess = (u: User | null) => !!u && (PAYING.includes(u.role) || isStaff(u));
export const canManageContent = isStaff;

export interface CompanyProfile {
  about: string; website: string; category: string; capabilities: string[]; industries: string[];
  state: string; employees: string; phone: string; linkedin: string; logo?: string;
}
export interface Org {
  id: string; domain: string; name: string; type: MemberType; pikomNo: string; mainEmail: string;
  seatLimit: number; status: "active" | "suspended"; whitelistedOn: string; renewal: string; profile: CompanyProfile;
}
export interface Individual { email: string; name: string; pikomNo: string; whitelistedOn: string; renewal: string; }
export interface User {
  id: string; email: string; name: string; password: string; role: Role; orgId: string | null;
  jobTitle: string; phone: string; linkedin: string; bio: string; interests: string[]; company?: string;
  /** PIKOM admin rights held on top of a member account (e.g. a member who also runs the site). */
  staff?: "super" | "content";
  createdOn: string; lastSignIn?: string;
}
export interface Job {
  id: string; title: string; orgId: string | null; company: string; category: string; type: string;
  location: string; mode: string; experience: string; salary: string; description: string;
  linkedinUrl: string; applyEmail: string; postedOn: string; postedBy: string; hidden?: boolean;
}
export interface Rfp {
  id: string; title: string; buyer: string; orgId: string | null; sector: string; type: string; budget: string;
  closes: string; description: string; contactEmail: string; status: "Open" | "Closed" | "Awarded"; postedOn: string; postedBy: string; hidden?: boolean;
}
export type EventType = "Online" | "Physical" | "Hybrid";
export interface Registration { userId: string; at: string; status: "confirmed" | "waitlist" | "cancelled"; attended?: boolean; }
export interface PEvent {
  id: string; title: string; type: EventType; date: string; time: string; venue: string; link: string;
  capacity: number | null; perCompany: number | null; audience: "members" | "all"; price: string; description: string;
  regClose: string; status: "Published" | "Draft" | "Cancelled"; materials: string; registrations: Registration[]; host: string;
}
export type ContentKind = "policy" | "research" | "news";
export interface Content {
  id: string; kind: ContentKind; title: string; summary: string; body: string; source: string; url: string; file: string;
  date: string; policyStatus: string; featured: boolean; published: boolean;
}
export interface Announcement { id: string; text: string; link: string; active: boolean; }
export interface LogEntry { at: string; who: string; what: string; }
export interface DB {
  orgs: Org[]; individuals: Individual[]; users: User[]; jobs: Job[]; rfps: Rfp[]; events: PEvent[];
  content: Content[]; announcements: Announcement[]; spotlight: string[]; log: LogEntry[];
}

export const ERR = {
  NOT_WHITELISTED: "AX-101", SEATS_FULL: "AX-102", ALREADY_REGISTERED: "AX-103", PUBLIC_EMAIL: "AX-104",
  SUSPENDED: "AX-105", BAD_LOGIN: "AX-201",
} as const;

export const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
export const domainOf = (email: string) => email.trim().toLowerCase().split("@")[1] || "";
export const emptyProfile = (): CompanyProfile => ({ about: "", website: "", category: "", capabilities: [], industries: [], state: "", employees: "", phone: "", linkedin: "" });

function seed(): DB {
  const u = (email: string, name: string, role: Role, orgId: string | null, jobTitle: string, phone = "", extra: Partial<User> = {}): User => ({
    id: uid(), email, name, password: "demo1234", role, orgId, jobTitle, phone, linkedin: "", bio: "", interests: [], createdOn: "2026-10-20", ...extra,
  });
  const org = (id: string, domain: string, name: string, type: MemberType, mainEmail: string, p: Partial<CompanyProfile>, on = "2026-10-15"): Org => ({
    id, domain, name, type, pikomNo: "[PIKOM no.]", mainEmail, seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: on, renewal: "2027-10-14", profile: { ...emptyProfile(), ...p },
  });
  const orgs: Org[] = [
    org("fi", "forest-interactive.com", "Forest Interactive Sdn. Bhd.", "Ordinary Member", "ritesh.devarajan@forest-interactive.com", { about: "Digital ecosystems and AI-enabled platforms for telecom operators across Southeast Asia and emerging markets.", website: "https://forest-interactive.com", category: "AI Platform", capabilities: ["Generative AI / LLM", "AI agents & automation", "Predictive analytics"], industries: ["Telecom", "Retail & e-commerce"], state: "Kuala Lumpur", employees: "201–500", logo: "/logos/forest-interactive-sdn-bhd.png" }),
    // Fictional company used to show the 5-seat limit. Not a real member.
    org("demo", "demo-company.com.my", "Demo Company Sdn. Bhd. (sample)", "Ordinary Member", "main@demo-company.com.my", { about: "Sample company for the demo — shows what happens when all 5 seats are used.", category: "SI & Solutions" }, "2026-10-12"),
  ];
  // Rest of the PIKOM member list, loaded by the secretariat. Their email domains still need adding.
  const catLabel = (id: string) => CATS.find(c => c.id === id)?.label || "";
  const taken = ["forest"];
  MEMBERS.filter(m => !taken.some(t => m.name.toLowerCase().includes(t))).forEach((m, i) => {
    orgs.push(org(`m${m.id}`, "", m.name, m.cat === "enterprise" ? "Associate Member" : "Ordinary Member", "", { about: m.tagline, category: catLabel(m.cat), capabilities: m.services, logo: m.logo }, "2026-10-01"));
  });
  const users: User[] = [
    u("ritesh.devarajan@forest-interactive.com", "Ritesh Devarajan", "main", "fi", "Assistant Manager – PMO", "", { staff: "super" }),
    u("admin@pikom.org.my", "PIKOM Secretariat (sample)", "superadmin", null, "Super admin"),
    u("content@pikom.org.my", "PIKOM Content Team (sample)", "contentadmin", null, "Content admin"),
    u("colleague@forest-interactive.com", "Sample Colleague", "member", "fi", "Product Manager"),
    u("main@demo-company.com.my", "Sample Main Holder", "main", "demo", "Managing Director"),
    ...[1, 2, 3, 4].map(n => u(`user${n}@demo-company.com.my`, `Sample User ${n}`, "member", "demo", "Staff")),
    u("individual.sample@gmail.com", "Sample Individual Member", "individual", null, "Independent AI consultant"),
    u("guest.sample@gmail.com", "Sample Guest", "guest", null, "Student", "", { company: "University (sample)" }),
  ];
  const individuals: Individual[] = [
    { email: "individual.sample@gmail.com", name: "Sample Individual Member", pikomNo: "[PIKOM no.]", whitelistedOn: "2026-10-18", renewal: "2027-10-17" },
    { email: "new.individual@outlook.com", name: "Sample Individual (not registered)", pikomNo: "[PIKOM no.]", whitelistedOn: "2026-11-03", renewal: "2027-11-02" },
  ];
  const job = (title: string, orgId: string, company: string, category: string, location: string, mode: string, experience: string, postedOn: string, salary: string): Job => ({
    id: uid(), title, orgId, company, category, type: "Full-time", location, mode, experience, salary, description: "Sample listing for the demo.", linkedinUrl: "", applyEmail: "careers@example.com", postedOn, postedBy: "ritesh.devarajan@forest-interactive.com",
  });
  const jobs: Job[] = [
    job("Senior ML Engineer (LLM) — sample", "fi", "Forest Interactive", "Engineering", "Kuala Lumpur", "Hybrid", "Senior / Lead", "2026-11-04", "RM 14,000 – 20,000"),
    job("AI Solutions Architect — sample", "fi", "Forest Interactive", "Engineering", "Kuala Lumpur", "On-site", "Senior / Lead", "2026-11-02", "RM 15,000 – 22,000"),
    job("Data Scientist, Telco Analytics — sample", "fi", "Forest Interactive", "Data & Analytics", "Kuala Lumpur", "Hybrid", "Mid-level", "2026-10-30", "RM 8,000 – 12,000"),
    job("AI Graduate Programme 2027 — sample", "fi", "Forest Interactive", "Graduate / Internship", "Kuala Lumpur", "On-site", "Graduate / Intern", "2026-10-25", "RM 4,000 – 5,000"),
  ];
  const rfp = (title: string, buyer: string, orgId: string | null, sector: string, type: string, budget: string, closes: string, description: string): Rfp => ({
    id: uid(), title, buyer, orgId, sector, type, budget, closes, description, contactEmail: "ritesh.devarajan@forest-interactive.com", status: "Open", postedOn: "2026-11-01", postedBy: "ritesh.devarajan@forest-interactive.com",
  });
  const rfps: Rfp[] = [
    rfp("AI fraud detection for a digital bank — sample", "Forest Interactive", "fi", "Financial services", "Solution required", "RM 500K – 1M", plus(21), "Sample RFP for the demo: real-time transaction fraud scoring with explainability for compliance. POC in 8 weeks."),
    rfp("Predictive maintenance for semiconductor lines — sample", "Forest Interactive", "fi", "Manufacturing / E&E", "Solution required", "RM 600K – 1.5M", plus(30), "Sample RFP for the demo: sensor data from 40 lines; on-premise deployment required."),
    rfp("Bahasa + English GenAI customer service agent — sample", "Forest Interactive", "fi", "Retail & e-commerce", "POC first", "RM 150K – 350K", plus(14), "Sample RFP for the demo: chat and voice agent in BM and English, integrated with a CRM."),
  ];
  const ev = (title: string, type: EventType, date: string, time: string, venue: string, capacity: number | null, audience: "members" | "all", price: string, description: string, perCompany: number | null = null): PEvent => ({
    id: uid(), title, type, date, time, venue, link: type === "Physical" ? "" : "https://meet.example.com/ax-demo", capacity, perCompany, audience, price, description, regClose: date, status: "Published", materials: "", registrations: [], host: "Forest Interactive",
  });
  const events: PEvent[] = [
    ev("AI Xchange Members Meetup — sample", "Physical", plus(13), "18:30 – 21:00", "Forest Interactive, Megan Avenue II, Kuala Lumpur", 4, "members", "Free for members", "Sample event: demos, deal-sharing and a policy update. Only 4 seats so you can try the waitlist.", 2),
    ev("AI Governance Bill briefing — sample", "Online", plus(8), "10:00 – 11:30", "Online (link sent after registering)", null, "members", "Free for members", "Sample event: what the proposed risk tiers mean for your products and clients."),
    ev("AI in Telecom open session — sample", "Hybrid", plus(35), "09:00 – 12:00", "Forest Interactive, Kuala Lumpur + livestream", 60, "all", "Free", "Sample event open to members and guests."),
    { ...ev("AI Xchange Meetup — October (sample)", "Physical", "2026-10-16", "18:30 – 21:00", "Forest Interactive, Kuala Lumpur", 80, "members", "Free for members", "Sample past event."), materials: "Slides and recording available to members" },
  ];
  events[0].registrations = [users[3], users[4], users[9]].map(x => ({ userId: x.id, at: "2026-11-04 09:00", status: "confirmed" as const }));
  const ct = (kind: ContentKind, title: string, summary: string, source: string, date: string, extra: Partial<Content> = {}): Content => ({
    id: uid(), kind, title, summary, body: "", source, url: "", file: "", date, policyStatus: "", featured: false, published: true, ...extra,
  });
  const content: Content[] = [
    ct("policy", "Malaysia AI Governance Bill", "NAIO consultation closed 31 July 2026: three risk tiers, a Central AI Authority, incident reporting and an AI sandbox. PIKOM's position paper is being prepared with the working group.", "National AI Office (NAIO)", "2026-07-31", { policyStatus: "Consultation closed", featured: true }),
    ct("policy", "BNM guidelines on AI in financial services", "Regulatory expectations for AI use in banking and insurance.", "Bank Negara Malaysia", "2026-06-15", { policyStatus: "Active" }),
    ct("policy", "PDPA amendments for AI-generated data", "Updates to the Personal Data Protection Act addressing AI-generated data and automated decisions.", "PDPC / Ministry of Digital", "2026-09-01", { policyStatus: "Under review" }),
    ct("research", "Economic & Digital Job Market Outlook", "PIKOM's annual outlook on digital salaries and hiring demand.", "PIKOM Research", "2026-08-20", { file: "job-market-outlook.pdf", featured: true }),
    ct("research", "Digital Economy Strategic Outlook", "Where Malaysia's digital economy is heading and what it means for members.", "PIKOM Research", "2026-05-10", { file: "digital-economy-outlook.pdf" }),
    ct("news", "National AI Action Plan 2026–2030 published", "28 initiatives across 14 impact engines.", "AI Malaysia", "2026-07-01", { url: "https://www.ai.gov.my" }),
    ct("news", "Stanford AI Index 2026", "Global adoption and investment trends.", "Stanford HAI", "2026-04-15", { url: "https://hai.stanford.edu" }),
  ];
  const spotlight = ["fi", ...["AKATI", "PEOPLElogy", "Straits"].map(n => orgs.find(o => o.name.startsWith(n))?.id || "")].filter(Boolean);
  return {
    orgs, individuals, users, jobs, rfps, events, content, spotlight,
    announcements: [{ id: uid(), text: "This is a demo of AI Xchange for PIKOM review — all events, jobs and RFPs are samples.", link: "/membership", active: true }],
    log: [{ at: "2026-11-02 10:12", who: "Ritesh Devarajan", what: "Whitelisted forest-interactive.com for Forest Interactive Sdn. Bhd." }],
  };
}

const KEY = "ax-demo-v3";
const SESSION = "ax-demo-session";
export type Result = { ok: true; msg?: string } | { ok: false; code: string; msg: string };
type Check = (Result & { kind?: "org" | "individual" | "guest"; org?: Org });

export function eventCounts(e: PEvent) {
  const confirmed = e.registrations.filter(r => r.status === "confirmed").length;
  const waitlist = e.registrations.filter(r => r.status === "waitlist").length;
  const left = e.capacity == null ? null : Math.max(0, e.capacity - confirmed);
  return { confirmed, waitlist, left };
}

interface Ctx {
  db: DB; me: User | null; myOrg: Org | null; ready: boolean; full: boolean;
  seatsUsed: (orgId: string) => number; orgUsers: (orgId: string) => User[];
  checkEmail: (email: string) => Check;
  register: (d: { email: string; name: string; password: string; jobTitle: string; consent: boolean; asGuest?: boolean; company?: string }) => Result;
  signIn: (email: string, password: string) => Result; signOut: () => void;
  updateMe: (p: Partial<User>) => void; changePassword: (current: string, next: string) => Result;
  updateOrgProfile: (orgId: string, p: Partial<CompanyProfile>) => void;
  removeUser: (userId: string) => void; setMainHolder: (orgId: string, email: string) => void;
  addOrg: (o: { domain: string; name: string; type: MemberType; mainEmail: string; pikomNo: string; renewal: string; category: string; about: string }) => Result;
  updateOrg: (orgId: string, p: Partial<Org>) => Result; removeOrg: (orgId: string) => void;
  addIndividual: (i: { email: string; name: string; pikomNo: string; renewal: string }) => Result; removeIndividual: (email: string) => void;
  addUserAsAdmin: (orgId: string, email: string, name: string) => Result;
  addStaff: (email: string, name: string) => Result; removeStaff: (id: string) => void;
  postJob: (j: Omit<Job, "id" | "postedOn" | "postedBy" | "orgId" | "company">) => void; deleteJob: (id: string) => void; toggleJob: (id: string) => void;
  postRfp: (r: Omit<Rfp, "id" | "postedOn" | "postedBy" | "orgId" | "buyer" | "status">) => void; updateRfp: (id: string, p: Partial<Rfp>) => void;
  saveEvent: (e: PEvent) => void; deleteEvent: (id: string) => void;
  registerEvent: (eventId: string) => Result; cancelEvent: (eventId: string) => void; markAttended: (eventId: string, userId: string, v: boolean) => void;
  saveContent: (c: Content) => void; deleteContent: (id: string) => void;
  saveAnnouncement: (a: Announcement) => void; deleteAnnouncement: (id: string) => void;
  setSpotlight: (ids: string[]) => void;
  reset: () => void; quickSignIn: (email: string) => void;
}

const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(() => seed());
  const [meId, setMeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setDb(JSON.parse(raw)); } catch {}
    try { setMeId(localStorage.getItem(SESSION)); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} } }, [db, ready]);
  useEffect(() => { if (ready) { try { meId ? localStorage.setItem(SESSION, meId) : localStorage.removeItem(SESSION); } catch {} } }, [meId, ready]);

  const me = db.users.find(u => u.id === meId) || null;
  const myOrg = me?.orgId ? db.orgs.find(o => o.id === me.orgId) || null : null;
  const stamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");
  const log = (d: DB, what: string): DB => ({ ...d, log: [{ at: stamp(), who: me?.name || "System", what }, ...d.log].slice(0, 300) });
  const mut = (what: string | null, f: (d: DB) => DB) => setDb(d => (what ? log(f(d), what) : f(d)));

  const seatsUsed = useCallback((orgId: string) => db.users.filter(u => u.orgId === orgId).length, [db]);
  const orgUsers = useCallback((orgId: string) => db.users.filter(u => u.orgId === orgId), [db]);

  const checkEmail = (raw: string): Check => {
    const email = raw.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, code: "AX-100", msg: "Enter a valid email address." };
    if (db.users.some(u => u.email === email)) return { ok: false, code: ERR.ALREADY_REGISTERED, msg: "This email already has an AI Xchange account. Sign in instead, or reset your password." };
    if (db.individuals.some(i => i.email === email)) return { ok: true, kind: "individual" };
    const dom = domainOf(email);
    const org = db.orgs.find(o => o.domain && o.domain === dom);
    if (!org) {
      if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return { ok: false, code: ERR.PUBLIC_EMAIL, msg: "This personal email isn't linked to a PIKOM membership. Individual members: ask the PIKOM secretariat to whitelist this exact email. You can also continue with a free guest account." };
      return { ok: false, code: ERR.NOT_WHITELISTED, msg: `Your company domain (@${dom}) is not registered with AI Xchange. Contact PIKOM to sign up as a member, or, if your company is already a PIKOM member, ask the site admin to whitelist your domain. You can also continue with a free guest account.` };
    }
    if (org.status === "suspended") return { ok: false, code: ERR.SUSPENDED, msg: `Access for ${org.name} is paused (membership renewal pending). Please contact the PIKOM secretariat.` };
    if (seatsUsed(org.id) >= org.seatLimit) {
      const main = db.users.find(u => u.orgId === org.id && u.role === "main");
      return { ok: false, code: ERR.SEATS_FULL, msg: `${org.name} has used all ${org.seatLimit} of its ${org.seatLimit} seats. Ask your main account holder${main ? ` (${main.name})` : ""} to manage your company's seat allocation and free up a seat.` };
    }
    return { ok: true, kind: "org", org };
  };

  const register: Ctx["register"] = ({ email: raw, name, password, jobTitle, consent, asGuest, company }) => {
    const email = raw.trim().toLowerCase();
    const chk = checkEmail(email);
    const guestOk = !chk.ok && asGuest && (chk.code === ERR.NOT_WHITELISTED || chk.code === ERR.PUBLIC_EMAIL);
    if (!chk.ok && !guestOk) return chk;
    if (!consent) return { ok: false, code: "AX-106", msg: "Please accept the privacy notice to continue." };
    if (password.length < 8) return { ok: false, code: "AX-107", msg: "Password must be at least 8 characters." };
    const org = chk.ok && chk.kind === "org" ? chk.org! : null;
    const role: Role = guestOk ? "guest" : org ? (org.mainEmail === email ? "main" : "member") : "individual";
    const user: User = { id: uid(), email, name: name.trim(), password, role, orgId: org?.id || null, jobTitle, phone: "", linkedin: "", bio: "", interests: [], company, createdOn: today(), lastSignIn: stamp() };
    mut(`${user.name} registered as ${role === "guest" ? "a guest" : org ? `${role === "main" ? "main holder" : "member"} of ${org.domain} (${seatsUsed(org.id) + 1}/${org.seatLimit})` : "an Individual Member"}`, d => ({ ...d, users: [...d.users, user] }));
    setMeId(user.id);
    return { ok: true };
  };

  const signIn: Ctx["signIn"] = (raw, password) => {
    const email = raw.trim().toLowerCase();
    const u = db.users.find(x => x.email === email);
    if (!u || u.password !== password) return { ok: false, code: ERR.BAD_LOGIN, msg: "Email or password is incorrect." };
    const org = u.orgId ? db.orgs.find(o => o.id === u.orgId) : null;
    if (org?.status === "suspended") return { ok: false, code: ERR.SUSPENDED, msg: `Access for ${org.name} is paused. Please contact the PIKOM secretariat.` };
    mut(null, d => ({ ...d, users: d.users.map(x => x.id === u.id ? { ...x, lastSignIn: stamp() } : x) }));
    setMeId(u.id);
    return { ok: true };
  };

  const promote = (e: PEvent): PEvent => {
    // Fill freed seats from the waitlist, in order.
    let regs = [...e.registrations];
    const conf = () => regs.filter(r => r.status === "confirmed").length;
    for (const r of regs) if (r.status === "waitlist" && (e.capacity == null || conf() < e.capacity)) r.status = "confirmed";
    return { ...e, registrations: regs };
  };

  const value: Ctx = {
    db, me, myOrg, ready, full: fullAccess(me), seatsUsed, orgUsers, checkEmail, register, signIn,
    signOut: () => setMeId(null),
    updateMe: (p) => me && mut(null, d => ({ ...d, users: d.users.map(u => u.id === me.id ? { ...u, ...p } : u) })),
    changePassword: (cur, next) => {
      if (!me) return { ok: false, code: ERR.BAD_LOGIN, msg: "Not signed in." };
      if (me.password !== cur) return { ok: false, code: ERR.BAD_LOGIN, msg: "Current password is incorrect." };
      if (next.length < 8) return { ok: false, code: "AX-107", msg: "New password must be at least 8 characters." };
      mut(null, d => ({ ...d, users: d.users.map(u => u.id === me.id ? { ...u, password: next } : u) }));
      return { ok: true, msg: "Password updated." };
    },
    updateOrgProfile: (orgId, p) => mut(`Company profile updated for ${db.orgs.find(o => o.id === orgId)?.name}`, d => ({ ...d, orgs: d.orgs.map(o => o.id === orgId ? { ...o, profile: { ...o.profile, ...p } } : o) })),
    removeUser: (userId) => { const u = db.users.find(x => x.id === userId); mut(`Removed ${u?.name} (${u?.email})`, d => ({ ...d, users: d.users.filter(x => x.id !== userId), events: d.events.map(e => promote({ ...e, registrations: e.registrations.filter(r => r.userId !== userId) })) })); },
    setMainHolder: (orgId, email) => mut(`Main account holder for ${db.orgs.find(o => o.id === orgId)?.name} set to ${email}`, d => ({ ...d,
      orgs: d.orgs.map(o => o.id === orgId ? { ...o, mainEmail: email } : o),
      users: d.users.map(u => u.orgId !== orgId ? u : { ...u, role: u.email === email ? "main" : "member" }) })),
    addOrg: ({ domain, name, type, mainEmail, pikomNo, renewal, category, about }) => {
      const dom = domain.trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom)) return { ok: false, code: "AX-301", msg: "Enter a valid domain, e.g. company.com.my" };
      if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return { ok: false, code: "AX-302", msg: "Public email domains can't be whitelisted for a company. Add the person as an Individual Member instead." };
      if (db.orgs.some(o => o.domain === dom)) return { ok: false, code: "AX-303", msg: "This domain is already whitelisted." };
      const main = mainEmail.trim().toLowerCase();
      if (main && domainOf(main) !== dom) return { ok: false, code: "AX-304", msg: `The main account holder's email must end in @${dom}.` };
      const o: Org = { id: uid(), domain: dom, name: name.trim(), type, pikomNo, mainEmail: main, seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: today(), renewal, profile: { ...emptyProfile(), category, about } };
      mut(`Whitelisted ${dom} for ${o.name} — added to the member directory`, d => ({ ...d, orgs: [o, ...d.orgs] }));
      return { ok: true, msg: `${o.name} is now in the member directory. Anyone with an @${dom} email can register (up to ${SEAT_LIMIT} people).` };
    },
    updateOrg: (orgId, p) => {
      if (p.domain !== undefined) {
        const dom = p.domain.trim().toLowerCase().replace(/^@/, "");
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom)) return { ok: false, code: "AX-301", msg: "Enter a valid domain, e.g. company.com.my" };
        if (db.orgs.some(o => o.domain === dom && o.id !== orgId)) return { ok: false, code: "AX-303", msg: "Another company already uses this domain." };
        p = { ...p, domain: dom };
      }
      mut(`Updated ${db.orgs.find(o => o.id === orgId)?.name}: ${Object.keys(p).join(", ")}`, d => ({ ...d, orgs: d.orgs.map(o => o.id === orgId ? { ...o, ...p } : o) }));
      return { ok: true };
    },
    removeOrg: (orgId) => { const o = db.orgs.find(x => x.id === orgId); mut(`Removed ${o?.name} and its accounts from AI Xchange`, d => ({ ...d, orgs: d.orgs.filter(x => x.id !== orgId), users: d.users.filter(u => u.orgId !== orgId), jobs: d.jobs.filter(j => j.orgId !== orgId), spotlight: d.spotlight.filter(s => s !== orgId) })); },
    addIndividual: ({ email, name, pikomNo, renewal }) => {
      const e = email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, code: "AX-305", msg: "Enter a valid email address." };
      if (db.individuals.some(i => i.email === e)) return { ok: false, code: "AX-303", msg: "This email is already whitelisted." };
      const guest = db.users.find(u => u.email === e && u.role === "guest");
      mut(`Whitelisted individual ${e}${guest ? " (guest account upgraded)" : ""}`, d => ({ ...d,
        individuals: [{ email: e, name: name.trim(), pikomNo, whitelistedOn: today(), renewal }, ...d.individuals],
        users: d.users.map(u => u.email === e && u.role === "guest" ? { ...u, role: "individual" } : u) }));
      return { ok: true, msg: guest ? `${e} already had a guest account — it now has full member access.` : `${e} can now register as an Individual Member.` };
    },
    removeIndividual: (email) => mut(`Removed individual ${email}`, d => ({ ...d, individuals: d.individuals.filter(i => i.email !== email), users: d.users.filter(u => !(u.role === "individual" && u.email === email)) })),
    addUserAsAdmin: (orgId, email, name) => {
      const o = db.orgs.find(x => x.id === orgId); const e = email.trim().toLowerCase();
      if (!o) return { ok: false, code: "AX-101", msg: "Unknown company." };
      if (!o.domain) return { ok: false, code: "AX-101", msg: "Add the company's email domain first." };
      if (domainOf(e) !== o.domain) return { ok: false, code: "AX-304", msg: `Email must end in @${o.domain}.` };
      if (db.users.some(u => u.email === e)) return { ok: false, code: ERR.ALREADY_REGISTERED, msg: "This email is already registered." };
      if (seatsUsed(orgId) >= o.seatLimit) return { ok: false, code: ERR.SEATS_FULL, msg: `All ${o.seatLimit} seats are used. Remove someone first.` };
      const user: User = { id: uid(), email: e, name: name.trim() || e, password: "demo1234", role: o.mainEmail === e ? "main" : "member", orgId, jobTitle: "", phone: "", linkedin: "", bio: "", interests: [], createdOn: today() };
      mut(`Added ${e} to ${o.name} (invite email — demo)`, d => ({ ...d, users: [...d.users, user] }));
      return { ok: true, msg: `${e} added. In the live version they get an email to set their password.` };
    },
    addStaff: (email, name) => {
      const e = email.trim().toLowerCase();
      if (db.users.some(u => u.email === e)) return { ok: false, code: ERR.ALREADY_REGISTERED, msg: "This email already has an account." };
      const user: User = { id: uid(), email: e, name: name.trim() || e, password: "demo1234", role: "contentadmin", orgId: null, jobTitle: "Content admin", phone: "", linkedin: "", bio: "", interests: [], createdOn: today() };
      mut(`Gave content admin access to ${e}`, d => ({ ...d, users: [...d.users, user] }));
      return { ok: true, msg: `${e} is now a content admin.` };
    },
    removeStaff: (id) => { const u = db.users.find(x => x.id === id); mut(`Removed admin access for ${u?.email}`, d => ({ ...d, users: d.users.filter(x => x.id !== id) })); },
    postJob: (j) => me && mut(`${me.name} posted job “${j.title}”`, d => ({ ...d, jobs: [{ ...j, id: uid(), orgId: me.orgId, company: myOrg ? myOrg.name.replace(/ Sdn\. Bhd\.| \(M\)/g, "") : me.name, postedOn: today(), postedBy: me.email }, ...d.jobs] })),
    deleteJob: (id) => mut("Closed a job post", d => ({ ...d, jobs: d.jobs.filter(j => j.id !== id) })),
    toggleJob: (id) => mut("Changed visibility of a job post", d => ({ ...d, jobs: d.jobs.map(j => j.id === id ? { ...j, hidden: !j.hidden } : j) })),
    postRfp: (r) => me && mut(`${me.name} posted RFP “${r.title}”`, d => ({ ...d, rfps: [{ ...r, id: uid(), orgId: me.orgId, buyer: myOrg ? myOrg.name.replace(" Sdn. Bhd.", "") : me.name, status: "Open", postedOn: today(), postedBy: me.email }, ...d.rfps] })),
    updateRfp: (id, p) => mut(`Updated RFP: ${Object.keys(p).join(", ")}`, d => ({ ...d, rfps: d.rfps.map(r => r.id === id ? { ...r, ...p } : r) })),
    saveEvent: (e) => mut(`Saved event “${e.title}”`, d => ({ ...d, events: d.events.some(x => x.id === e.id) ? d.events.map(x => x.id === e.id ? promote(e) : x) : [{ ...e, id: e.id || uid() }, ...d.events] })),
    deleteEvent: (id) => mut("Deleted an event", d => ({ ...d, events: d.events.filter(e => e.id !== id) })),
    registerEvent: (eventId) => {
      const e = db.events.find(x => x.id === eventId);
      if (!e || !me) return { ok: false, code: "AX-401", msg: "Please sign in to register." };
      if (e.audience === "members" && !fullAccess(me)) return { ok: false, code: "AX-402", msg: "This event is for PIKOM members only." };
      if (e.regClose && e.regClose < today()) return { ok: false, code: "AX-403", msg: "Registration has closed." };
      if (e.perCompany && me.orgId) {
        const ids = db.users.filter(u => u.orgId === me.orgId).map(u => u.id);
        const n = e.registrations.filter(r => r.status !== "cancelled" && ids.includes(r.userId)).length;
        if (n >= e.perCompany) return { ok: false, code: "AX-404", msg: `This event allows ${e.perCompany} people per company, and your company has already registered ${n}.` };
      }
      const { left } = eventCounts(e);
      const status = left === 0 ? "waitlist" : "confirmed";
      mut(`${me.name} ${status === "waitlist" ? "joined the waitlist for" : "registered for"} “${e.title}”`, d => ({ ...d, events: d.events.map(x => x.id !== eventId ? x : { ...x, registrations: [...x.registrations.filter(r => r.userId !== me.id), { userId: me.id, at: stamp(), status }] }) }));
      return { ok: true, msg: status === "waitlist" ? "The event is full — you're on the waitlist. We'll email you if a seat opens." : e.type === "Physical" ? "You're registered. A confirmation is on its way (demo)." : "You're registered. The joining link is now shown on the event." };
    },
    cancelEvent: (eventId) => me && mut(`${me.name} cancelled registration`, d => ({ ...d, events: d.events.map(x => x.id !== eventId ? x : promote({ ...x, registrations: x.registrations.filter(r => r.userId !== me.id) })) })),
    markAttended: (eventId, userId, v) => mut(null, d => ({ ...d, events: d.events.map(x => x.id !== eventId ? x : { ...x, registrations: x.registrations.map(r => r.userId === userId ? { ...r, attended: v } : r) }) })),
    saveContent: (c) => mut(`Saved ${c.kind} item “${c.title}”`, d => ({ ...d, content: d.content.some(x => x.id === c.id) ? d.content.map(x => x.id === c.id ? c : x) : [{ ...c, id: c.id || uid() }, ...d.content] })),
    deleteContent: (id) => mut("Deleted a content item", d => ({ ...d, content: d.content.filter(c => c.id !== id) })),
    saveAnnouncement: (a) => mut("Updated announcement", d => ({ ...d, announcements: d.announcements.some(x => x.id === a.id) ? d.announcements.map(x => x.id === a.id ? a : x) : [{ ...a, id: a.id || uid() }, ...d.announcements] })),
    deleteAnnouncement: (id) => mut("Deleted announcement", d => ({ ...d, announcements: d.announcements.filter(a => a.id !== id) })),
    setSpotlight: (ids) => mut("Updated member spotlight", d => ({ ...d, spotlight: ids })),
    reset: () => { setDb(seed()); setMeId(null); },
    quickSignIn: (email) => { const u = db.users.find(x => x.email === email); setMeId(u ? u.id : null); },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() { const c = useContext(C); if (!c) throw new Error("useStore outside provider"); return c; }
export const roleLabel = (r: Role) => ({ superadmin: "Super admin", contentadmin: "Content admin", main: "Main account holder", member: "Company member", individual: "Individual member", guest: "Guest (free account)" }[r]);
export const newId = uid;
