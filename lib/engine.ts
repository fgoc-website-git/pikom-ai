// AI Xchange data model and rules. Shared by the browser (instant updates) and the server
// (the saved, authoritative copy in Supabase Postgres). No React here.
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
const rand = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
/** IDs come from a pool the client sends with each action, so the browser's instant update and the
 *  server's saved copy use the same IDs. Falls back to random. */
let POOL: string[] = [];
const uid = () => POOL.shift() || rand();
export const makeIds = (n = 6) => Array.from({ length: n }, rand);
export const domainOf = (email: string) => email.trim().toLowerCase().split("@")[1] || "";
export const emptyProfile = (): CompanyProfile => ({ about: "", website: "", category: "", capabilities: [], industries: [], state: "", employees: "", phone: "", linkedin: "" });

export function seed(): DB {
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
    u("johary@forest-interactive.com", "Johary", "member", "fi", "CEO", "", { staff: "super" }),
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
  events[0].registrations = [users[4], users[5], users[10]].map(x => ({ userId: x.id, at: "2026-11-04 09:00", status: "confirmed" as const }));
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
    announcements: [{ id: uid(), text: "Preview of AI Xchange for PIKOM review — events, jobs and RFPs shown are samples.", link: "/membership", active: true }],
    log: [{ at: "2026-11-02 10:12", who: "Ritesh Devarajan", what: "Whitelisted forest-interactive.com for Forest Interactive Sdn. Bhd." }],
  };
}

export type Result = { ok: true; msg?: string } | { ok: false; code: string; msg: string };
export type Check = (Result & { kind?: "org" | "individual" | "guest"; org?: Org });

export function eventCounts(e: PEvent) {
  const confirmed = e.registrations.filter(r => r.status === "confirmed").length;
  const waitlist = e.registrations.filter(r => r.status === "waitlist").length;
  const left = e.capacity == null ? null : Math.max(0, e.capacity - confirmed);
  return { confirmed, waitlist, left };
}
export const roleLabel = (r: Role) => ({ superadmin: "Super admin", contentadmin: "Content admin", main: "Main account holder", member: "Company member", individual: "Individual member", guest: "Guest (free account)" }[r]);
export const newId = () => uid();
export const stamp = () => new Date(Date.now() + 8 * 36e5).toISOString().slice(0, 16).replace("T", " "); // Malaysia time
export const seatsUsedIn = (db: DB, orgId: string) => db.users.filter(u => u.orgId === orgId).length;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function checkEmail(db: DB, raw: string): Check {
  const email = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, code: "AX-100", msg: "Enter a valid email address." };
  if (db.users.some(u => u.email === email)) return { ok: false, code: ERR.ALREADY_REGISTERED, msg: "This email already has an AI Xchange account. Sign in instead, or reset your password." };
  if (db.individuals.some(i => i.email === email)) return { ok: true, kind: "individual" };
  const dom = domainOf(email);
  const org = db.orgs.find(o => o.domain && o.domain === dom);
  if (!org) {
    if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return { ok: false, code: ERR.PUBLIC_EMAIL, msg: "This personal email isn't linked to a PIKOM membership. Individual members: ask the PIKOM secretariat to whitelist this exact email. You can also continue with a free guest account." };
    return { ok: false, code: ERR.NOT_WHITELISTED, msg: `Your company domain (@${dom}) is not registered with AI Xchange. Contact PIKOM to sign up as a member, or, if your company is already a PIKOM member, ask the site admin to whitelist your domain. You can also continue with a free guest account.` };
  }
  if (org.status === "suspended") return { ok: false, code: ERR.SUSPENDED, msg: `Access for ${org.name} is paused (membership renewal pending). Please contact the PIKOM secretariat.` };
  if (seatsUsedIn(db, org.id) >= org.seatLimit) {
    const main = db.users.find(u => u.orgId === org.id && u.role === "main");
    return { ok: false, code: ERR.SEATS_FULL, msg: `${org.name} has used all ${org.seatLimit} of its ${org.seatLimit} seats. Ask your main account holder${main ? ` (${main.name})` : ""} to manage your company's seat allocation and free up a seat.` };
  }
  return { ok: true, kind: "org", org };
}

/** Creates the user (password is stored as given — the server hashes it before saving). */
export function registerUser(db: DB, d: { email: string; name: string; password: string; jobTitle: string; consent: boolean; asGuest?: boolean; company?: string }, ids: string[] = []): { db: DB; result: Result; user?: User } {
  POOL = [...ids];
  const email = d.email.trim().toLowerCase();
  const chk = checkEmail(db, email);
  const guestOk = !chk.ok && d.asGuest && (chk.code === ERR.NOT_WHITELISTED || chk.code === ERR.PUBLIC_EMAIL);
  if (!chk.ok && !guestOk) return { db, result: chk };
  if (!d.consent) return { db, result: { ok: false, code: "AX-106", msg: "Please accept the privacy notice to continue." } };
  if (d.password.length < 8) return { db, result: { ok: false, code: "AX-107", msg: "Password must be at least 8 characters." } };
  if (!d.name.trim()) return { db, result: { ok: false, code: "AX-109", msg: "Please enter your name." } };
  const org = chk.ok && chk.kind === "org" ? chk.org! : null;
  const role: Role = guestOk ? "guest" : org ? (org.mainEmail === email ? "main" : "member") : "individual";
  const user: User = { id: uid(), email, name: d.name.trim().slice(0, 120), password: d.password, role, orgId: org?.id || null, jobTitle: (d.jobTitle || "").slice(0, 120), phone: "", linkedin: "", bio: "", interests: [], company: d.company?.slice(0, 120), createdOn: today(), lastSignIn: stamp() };
  const what = `${user.name} registered as ${role === "guest" ? "a guest" : org ? `${role === "main" ? "main holder" : "member"} of ${org.domain} (${seatsUsedIn(db, org.id) + 1}/${org.seatLimit})` : "an Individual Member"}`;
  return { db: addLog({ ...db, users: [...db.users, user] }, user.name, what), result: { ok: true }, user };
}

const addLog = (d: DB, who: string, what: string): DB => ({ ...d, log: [{ at: stamp(), who, what }, ...d.log].slice(0, 500) });

function promote(e: PEvent): PEvent {
  const regs = e.registrations.map(r => ({ ...r }));
  const conf = () => regs.filter(r => r.status === "confirmed").length;
  for (const r of regs) if (r.status === "waitlist" && (e.capacity == null || conf() < e.capacity)) r.status = "confirmed";
  return { ...e, registrations: regs };
}

const DENY: Result = { ok: false, code: "AX-403", msg: "You don't have permission to do that." };
const SELF_FIELDS = ["name", "jobTitle", "phone", "linkedin", "bio", "interests", "company"] as const;
const PROFILE_FIELDS = ["about", "website", "category", "capabilities", "industries", "state", "employees", "phone", "linkedin", "logo"] as const;
const ORG_FIELDS = ["domain", "name", "type", "pikomNo", "mainEmail", "seatLimit", "status", "renewal"] as const;
const pick = <T extends object>(o: any, keys: readonly string[]): Partial<T> => Object.fromEntries(Object.entries(o || {}).filter(([k]) => keys.includes(k))) as Partial<T>;

export const ACTIONS = ["updateMe", "updateOrgProfile", "removeUser", "setMainHolder", "addOrg", "updateOrg", "removeOrg", "addIndividual", "removeIndividual", "addUserAsAdmin", "addStaff", "removeStaff", "postJob", "deleteJob", "toggleJob", "postRfp", "updateRfp", "saveEvent", "deleteEvent", "registerEvent", "cancelEvent", "markAttended", "saveContent", "deleteContent", "saveAnnouncement", "deleteAnnouncement", "setSpotlight"] as const;
export type ActionName = typeof ACTIONS[number];

/** Runs one action as `me`. Pure: returns the new data and the result. Permission checks live here,
 *  so the server enforces exactly the same rules the screens show. */
export function act(db: DB, me: User | null, name: ActionName, args: any[], ids: string[] = []): { db: DB; result: Result } {
  POOL = [...ids];
  if (!me) return { db, result: { ok: false, code: "AX-401", msg: "Please sign in first." } };
  const ok = (d: DB, what: string | null, msg?: string) => ({ db: what ? addLog(d, me.name, what) : d, result: { ok: true, msg } as Result });
  const no = (code: string, msg: string) => ({ db, result: { ok: false, code, msg } as Result });
  const deny = { db, result: DENY };
  const sup = isSuper(me), staff = isStaff(me), full = fullAccess(me);
  const orgName = (id: string) => db.orgs.find(o => o.id === id)?.name;

  switch (name) {
    case "updateMe": {
      const p = pick<User>(args[0], SELF_FIELDS);
      return ok({ ...db, users: db.users.map(u => u.id === me.id ? { ...u, ...p } : u) }, null);
    }
    case "updateOrgProfile": {
      const [orgId, raw] = args; if (!(sup || (me.orgId === orgId && me.role === "main"))) return deny;
      const p = pick<CompanyProfile>(raw, PROFILE_FIELDS);
      return ok({ ...db, orgs: db.orgs.map(o => o.id === orgId ? { ...o, profile: { ...o.profile, ...p } } : o) }, `Company profile updated for ${orgName(orgId)}`);
    }
    case "removeUser": {
      const u = db.users.find(x => x.id === args[0]); if (!u) return no("AX-404", "Person not found.");
      if (!(sup || (me.role === "main" && u.orgId === me.orgId && u.id !== me.id))) return deny;
      if (u.id === me.id) return no("AX-403", "You can't remove your own account here.");
      return ok({ ...db, users: db.users.filter(x => x.id !== u.id), events: db.events.map(e => promote({ ...e, registrations: e.registrations.filter(r => r.userId !== u.id) })) }, `Removed ${u.name} (${u.email})`);
    }
    case "setMainHolder": {
      const [orgId, email] = args; if (!sup) return deny;
      return ok({ ...db, orgs: db.orgs.map(o => o.id === orgId ? { ...o, mainEmail: email } : o), users: db.users.map(u => u.orgId !== orgId ? u : { ...u, role: u.email === email ? "main" : "member" }) }, `Main account holder for ${orgName(orgId)} set to ${email}`);
    }
    case "addOrg": {
      if (!sup) return deny;
      const { domain, name: nm, type, mainEmail, pikomNo, renewal, category, about } = args[0] || {};
      const dom = String(domain || "").trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom)) return no("AX-301", "Enter a valid domain, e.g. company.com.my");
      if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return no("AX-302", "Public email domains can't be whitelisted for a company. Add the person as an Individual Member instead.");
      if (db.orgs.some(o => o.domain === dom)) return no("AX-303", "This domain is already whitelisted.");
      const main = String(mainEmail || "").trim().toLowerCase();
      if (main && domainOf(main) !== dom) return no("AX-304", `The main account holder's email must end in @${dom}.`);
      const o: Org = { id: uid(), domain: dom, name: String(nm || dom).trim(), type, pikomNo: pikomNo || "", mainEmail: main, seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: today(), renewal: renewal || "", profile: { ...emptyProfile(), category: category || "", about: about || "" } };
      return ok({ ...db, orgs: [o, ...db.orgs] }, `Whitelisted ${dom} for ${o.name} — added to the member directory`, `${o.name} is now in the member directory. Anyone with an @${dom} email can register (up to ${SEAT_LIMIT} people).`);
    }
    case "updateOrg": {
      if (!sup) return deny;
      const orgId = args[0]; let p = pick<Org>(args[1], ORG_FIELDS);
      if (p.domain !== undefined) {
        const dom = String(p.domain).trim().toLowerCase().replace(/^@/, "");
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom)) return no("AX-301", "Enter a valid domain, e.g. company.com.my");
        if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return no("AX-302", "Public email domains can't be whitelisted for a company.");
        if (db.orgs.some(o => o.domain === dom && o.id !== orgId)) return no("AX-303", "Another company already uses this domain.");
        p = { ...p, domain: dom };
      }
      return ok({ ...db, orgs: db.orgs.map(o => o.id === orgId ? { ...o, ...p } : o) }, `Updated ${orgName(orgId)}: ${Object.keys(p).join(", ")}`);
    }
    case "removeOrg": {
      if (!sup) return deny;
      const orgId = args[0]; if (me.orgId === orgId) return no("AX-403", "You can't remove your own company while signed in with it.");
      return ok({ ...db, orgs: db.orgs.filter(x => x.id !== orgId), users: db.users.filter(u => u.orgId !== orgId), jobs: db.jobs.filter(j => j.orgId !== orgId), spotlight: db.spotlight.filter(s => s !== orgId) }, `Removed ${orgName(orgId)} and its accounts from AI Xchange`);
    }
    case "addIndividual": {
      if (!sup) return deny;
      const { email, name: nm, pikomNo, renewal } = args[0] || {};
      const e = String(email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(e)) return no("AX-305", "Enter a valid email address.");
      if (db.individuals.some(i => i.email === e)) return no("AX-303", "This email is already whitelisted.");
      const guest = db.users.find(u => u.email === e && u.role === "guest");
      return ok({ ...db, individuals: [{ email: e, name: String(nm || "").trim(), pikomNo: pikomNo || "", whitelistedOn: today(), renewal: renewal || "" }, ...db.individuals], users: db.users.map(u => u.email === e && u.role === "guest" ? { ...u, role: "individual" } : u) },
        `Whitelisted individual ${e}${guest ? " (guest account upgraded)" : ""}`, guest ? `${e} already had a guest account — it now has full member access.` : `${e} can now register as an Individual Member.`);
    }
    case "removeIndividual": {
      if (!sup) return deny; const email = args[0];
      return ok({ ...db, individuals: db.individuals.filter(i => i.email !== email), users: db.users.filter(u => !(u.role === "individual" && u.email === email)) }, `Removed individual ${email}`);
    }
    case "addUserAsAdmin": {
      if (!sup) return deny;
      const [orgId, email, nm] = args; const o = db.orgs.find(x => x.id === orgId); const e = String(email || "").trim().toLowerCase();
      if (!o) return no("AX-101", "Unknown company.");
      if (!o.domain) return no("AX-101", "Add the company's email domain first.");
      if (domainOf(e) !== o.domain) return no("AX-304", `Email must end in @${o.domain}.`);
      if (db.users.some(u => u.email === e)) return no(ERR.ALREADY_REGISTERED, "This email is already registered.");
      if (seatsUsedIn(db, orgId) >= o.seatLimit) return no(ERR.SEATS_FULL, `All ${o.seatLimit} seats are used. Remove someone first.`);
      const user: User = { id: uid(), email: e, name: String(nm || "").trim() || e, password: "demo1234", role: o.mainEmail === e ? "main" : "member", orgId, jobTitle: "", phone: "", linkedin: "", bio: "", interests: [], createdOn: today() };
      return ok({ ...db, users: [...db.users, user] }, `Added ${e} to ${o.name}`, `${e} added with the temporary password demo1234 — ask them to change it under My account → Password.`);
    }
    case "addStaff": {
      if (!sup) return deny;
      const e = String(args[0] || "").trim().toLowerCase();
      if (!EMAIL_RE.test(e)) return no("AX-305", "Enter a valid email address.");
      if (db.users.some(u => u.email === e)) return no(ERR.ALREADY_REGISTERED, "This email already has an account.");
      const user: User = { id: uid(), email: e, name: String(args[1] || "").trim() || e, password: "demo1234", role: "contentadmin", orgId: null, jobTitle: "Content admin", phone: "", linkedin: "", bio: "", interests: [], createdOn: today() };
      return ok({ ...db, users: [...db.users, user] }, `Gave content admin access to ${e}`, `${e} is now a content admin (temporary password demo1234).`);
    }
    case "removeStaff": {
      if (!sup) return deny; const u = db.users.find(x => x.id === args[0]);
      if (!u || u.id === me.id) return no("AX-403", "You can't remove your own admin access.");
      return ok({ ...db, users: db.users.filter(x => x.id !== u.id) }, `Removed admin access for ${u.email}`);
    }
    case "postJob": {
      if (!full || me.role === "superadmin" || me.role === "contentadmin") return deny;
      const j = args[0] || {}; const myOrg = me.orgId ? db.orgs.find(o => o.id === me.orgId) : null;
      if (!String(j.title || "").trim()) return no("AX-501", "Add a job title.");
      return ok({ ...db, jobs: [{ ...j, id: uid(), orgId: me.orgId, company: myOrg ? myOrg.name.replace(/ Sdn\. Bhd\.| \(M\)/g, "") : me.name, postedOn: today(), postedBy: me.email, hidden: false }, ...db.jobs] }, `${me.name} posted job “${j.title}”`);
    }
    case "deleteJob": {
      const j = db.jobs.find(x => x.id === args[0]); if (!j) return no("AX-404", "Job not found.");
      if (!(staff || j.postedBy === me.email)) return deny;
      return ok({ ...db, jobs: db.jobs.filter(x => x.id !== j.id) }, `Closed job post “${j.title}”`);
    }
    case "toggleJob": {
      if (!staff) return deny;
      return ok({ ...db, jobs: db.jobs.map(j => j.id === args[0] ? { ...j, hidden: !j.hidden } : j) }, "Changed visibility of a job post");
    }
    case "postRfp": {
      if (!full) return deny;
      const r = args[0] || {}; const myOrg = me.orgId ? db.orgs.find(o => o.id === me.orgId) : null;
      if (!String(r.title || "").trim()) return no("AX-501", "Add a title.");
      return ok({ ...db, rfps: [{ ...r, id: uid(), orgId: me.orgId, buyer: myOrg ? myOrg.name.replace(" Sdn. Bhd.", "") : me.name, status: "Open", postedOn: today(), postedBy: me.email, hidden: false }, ...db.rfps] }, `${me.name} posted RFP “${r.title}”`);
    }
    case "updateRfp": {
      const r = db.rfps.find(x => x.id === args[0]); if (!r) return no("AX-404", "RFP not found.");
      if (!(staff || r.postedBy === me.email)) return deny;
      const p = pick<Rfp>(args[1], ["title", "sector", "type", "budget", "closes", "description", "contactEmail", "status", "hidden"]);
      return ok({ ...db, rfps: db.rfps.map(x => x.id === r.id ? { ...x, ...p } : x) }, `Updated RFP “${r.title}”: ${Object.keys(p).join(", ")}`);
    }
    case "saveEvent": {
      if (!staff) return deny;
      const e: PEvent = args[0]; if (!e || !String(e.title || "").trim()) return no("AX-501", "Add an event title.");
      const exists = db.events.find(x => x.id === e.id);
      const saved = exists ? promote({ ...e, registrations: exists.registrations }) : { ...e, id: e.id || uid(), registrations: [] };
      return ok({ ...db, events: exists ? db.events.map(x => x.id === e.id ? saved : x) : [saved, ...db.events] }, `Saved event “${e.title}”`);
    }
    case "deleteEvent": {
      if (!staff) return deny;
      return ok({ ...db, events: db.events.filter(e => e.id !== args[0]) }, "Deleted an event");
    }
    case "registerEvent": {
      const e = db.events.find(x => x.id === args[0]);
      if (!e || e.status !== "Published") return no("AX-401", "Event not found.");
      if (e.audience === "members" && !full) return no("AX-402", "This event is for PIKOM members only.");
      if (e.regClose && e.regClose < today()) return no("AX-403", "Registration has closed.");
      if (e.perCompany && me.orgId) {
        const ids2 = db.users.filter(u => u.orgId === me.orgId).map(u => u.id);
        const n = e.registrations.filter(r => r.status !== "cancelled" && r.userId !== me.id && ids2.includes(r.userId)).length;
        if (n >= e.perCompany) return no("AX-404", `This event allows ${e.perCompany} people per company, and your company has already registered ${n}.`);
      }
      const others = { ...e, registrations: e.registrations.filter(r => r.userId !== me.id) };
      const status = eventCounts(others).left === 0 ? "waitlist" : "confirmed";
      return ok({ ...db, events: db.events.map(x => x.id !== e.id ? x : { ...others, registrations: [...others.registrations, { userId: me.id, at: stamp(), status }] }) },
        `${me.name} ${status === "waitlist" ? "joined the waitlist for" : "registered for"} “${e.title}”`,
        status === "waitlist" ? "The event is full — you're on the waitlist. You'll be moved up automatically if a seat opens." : e.type === "Physical" ? "You're registered. See you there." : "You're registered. The joining link is now shown on the event.");
    }
    case "cancelEvent": {
      const e = db.events.find(x => x.id === args[0]); if (!e) return no("AX-404", "Event not found.");
      return ok({ ...db, events: db.events.map(x => x.id !== e.id ? x : promote({ ...x, registrations: x.registrations.filter(r => r.userId !== me.id) })) }, `${me.name} cancelled registration for “${e.title}”`);
    }
    case "markAttended": {
      if (!staff) return deny; const [eventId, userId, v] = args;
      return ok({ ...db, events: db.events.map(x => x.id !== eventId ? x : { ...x, registrations: x.registrations.map(r => r.userId === userId ? { ...r, attended: !!v } : r) }) }, null);
    }
    case "saveContent": {
      if (!staff) return deny; const c: Content = args[0];
      if (!c || !String(c.title || "").trim()) return no("AX-501", "Add a title.");
      return ok({ ...db, content: db.content.some(x => x.id === c.id) ? db.content.map(x => x.id === c.id ? c : x) : [{ ...c, id: c.id || uid() }, ...db.content] }, `Saved ${c.kind} item “${c.title}”`);
    }
    case "deleteContent": {
      if (!staff) return deny;
      return ok({ ...db, content: db.content.filter(c => c.id !== args[0]) }, "Deleted a content item");
    }
    case "saveAnnouncement": {
      if (!staff) return deny; const a: Announcement = args[0];
      return ok({ ...db, announcements: db.announcements.some(x => x.id === a.id) ? db.announcements.map(x => x.id === a.id ? a : x) : [{ ...a, id: a.id || uid() }, ...db.announcements] }, "Updated announcement");
    }
    case "deleteAnnouncement": {
      if (!staff) return deny;
      return ok({ ...db, announcements: db.announcements.filter(a => a.id !== args[0]) }, "Deleted announcement");
    }
    case "setSpotlight": {
      if (!staff) return deny;
      return ok({ ...db, spotlight: (args[0] || []).slice(0, 4) }, "Updated member spotlight");
    }
  }
  return no("AX-400", "Unknown action.");
}

/** What a given viewer is allowed to receive. Passwords never leave the server. */
export function viewFor(db: DB, me: User | null): DB {
  const staff = isStaff(me), sup = isSuper(me), full = fullAccess(me);
  const users = db.users.map(u => {
    const { password, ...rest } = u; void password;
    if (full || u.id === me?.id) return { ...rest, password: "" };
    return { ...rest, password: "", email: "", name: "PIKOM member", phone: "", linkedin: "", bio: "", jobTitle: "", interests: [], company: "", lastSignIn: undefined };
  });
  const mine = (by: string) => !!me && by === me.email;
  return {
    ...db,
    users,
    individuals: sup ? db.individuals : db.individuals.filter(i => i.email === me?.email),
    log: staff ? db.log : [],
    orgs: full ? db.orgs : db.orgs.map(o => ({ ...o, mainEmail: "", pikomNo: "", profile: { ...o.profile, phone: "", linkedin: "" } })),
    jobs: db.jobs.filter(j => !j.hidden || staff || mine(j.postedBy)).map(j => full ? j : { ...j, salary: "", description: "", applyEmail: "", linkedinUrl: "", postedBy: "" }),
    rfps: db.rfps.filter(r => !r.hidden || staff || mine(r.postedBy)).map(r => full ? r : { ...r, budget: "", description: "", contactEmail: "", postedBy: "" }),
    events: db.events.filter(e => e.status !== "Draft" || staff).map(e => {
      const reg = e.registrations.find(r => r.userId === me?.id && r.status === "confirmed");
      return staff || reg ? e : { ...e, link: "" };
    }),
    content: db.content.filter(c => c.published || staff),
    announcements: db.announcements.filter(a => a.active || staff),
  };
}
