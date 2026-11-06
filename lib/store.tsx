"use client";
// DEMO STORE — everything lives in this browser's localStorage so the portal can be
// clicked through without a backend. Phase 2 replaces this with Supabase Auth + Postgres
// (same shapes, same rules). Never put real passwords or personal data in the demo.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SEAT_LIMIT, PUBLIC_EMAIL_DOMAINS, type MemberType } from "./options";

export type Role = "superadmin" | "main" | "member" | "individual";

export interface CompanyProfile {
  about: string; website: string; category: string; capabilities: string[]; industries: string[];
  state: string; employees: string; phone: string; linkedin: string; logo?: string; showInDirectory: boolean;
}
export interface Org {
  id: string; domain: string; name: string; type: MemberType; pikomNo: string; mainEmail: string;
  seatLimit: number; status: "active" | "suspended"; whitelistedOn: string; renewal: string; profile: CompanyProfile;
}
export interface Individual { email: string; name: string; pikomNo: string; whitelistedOn: string; renewal: string; }
export interface User {
  id: string; email: string; name: string; password: string; role: Role; orgId: string | null;
  jobTitle: string; phone: string; linkedin: string; bio: string; interests: string[];
  showInDirectory: boolean; createdOn: string; lastSignIn?: string;
}
export interface Job {
  id: string; title: string; orgId: string | null; company: string; category: string; type: string;
  location: string; mode: string; experience: string; salary: string; description: string;
  linkedinUrl: string; applyEmail: string; postedOn: string; postedBy: string;
}
export interface LogEntry { at: string; who: string; what: string; }
export interface DB { orgs: Org[]; individuals: Individual[]; users: User[]; jobs: Job[]; log: LogEntry[]; }

export const ERR = {
  NOT_WHITELISTED: "AX-101",
  SEATS_FULL: "AX-102",
  ALREADY_REGISTERED: "AX-103",
  PUBLIC_EMAIL: "AX-104",
  SUSPENDED: "AX-105",
  BAD_LOGIN: "AX-201",
} as const;

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);
export const domainOf = (email: string) => email.trim().toLowerCase().split("@")[1] || "";
const emptyProfile = (): CompanyProfile => ({ about: "", website: "", category: "", capabilities: [], industries: [], state: "", employees: "", phone: "", linkedin: "", showInDirectory: true });

function seed(): DB {
  const u = (email: string, name: string, role: Role, orgId: string | null, jobTitle: string, extra: Partial<User> = {}): User => ({
    id: uid(), email, name, password: "demo1234", role, orgId, jobTitle, phone: "", linkedin: "", bio: "", interests: [], showInDirectory: true, createdOn: "2026-10-20", ...extra,
  });
  const orgs: Org[] = [
    { id: "fi", domain: "forest-interactive.com", name: "Forest Interactive Sdn. Bhd.", type: "Ordinary Member", pikomNo: "[PIKOM no.]", mainEmail: "aina@forest-interactive.com", seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: "2026-10-15", renewal: "2027-10-14",
      profile: { ...emptyProfile(), about: "Digital ecosystems and AI-enabled platforms for telecom operators across Southeast Asia and emerging markets.", website: "https://forest-interactive.com", category: "AI Platform", capabilities: ["Generative AI / LLM", "AI agents & automation", "Predictive analytics"], industries: ["Telecom", "Retail & e-commerce"], state: "Kuala Lumpur", employees: "201–500", logo: "/logos/forest-interactive-sdn-bhd.png" } },
    { id: "inx", domain: "inextlabs.com", name: "iNextLabs (M) Sdn. Bhd.", type: "Ordinary Member", pikomNo: "[PIKOM no.]", mainEmail: "daniel@inextlabs.com", seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: "2026-10-12", renewal: "2027-10-11",
      profile: { ...emptyProfile(), about: "Generative and agentic AI automation for enterprises.", website: "https://inextlabs.com", category: "AI Platform", capabilities: ["Generative AI / LLM", "AI agents & automation"], industries: ["Financial services"], state: "Kuala Lumpur", employees: "51–200", logo: "/logos/inextlabs-m-sdn-bhd.png" } },
    { id: "dxc", domain: "dxc.com", name: "DXC Technology Malaysia", type: "Overseas Member", pikomNo: "[PIKOM no.]", mainEmail: "it.lead@dxc.com", seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: "2026-11-02", renewal: "2027-11-01",
      profile: { ...emptyProfile(), about: "", category: "SI & Solutions" } },
  ];
  const users: User[] = [
    u("admin@pikom.org.my", "PIKOM Secretariat (demo)", "superadmin", null, "Super admin"),
    u("aina@forest-interactive.com", "Aina Rahman", "main", "fi", "Head of Partnerships", { interests: ["Finding AI partners / vendors", "Events & networking"] }),
    u("kumar@forest-interactive.com", "Kumar Selvam", "member", "fi", "Product Manager"),
    u("mei@forest-interactive.com", "Tan Mei Ling", "member", "fi", "Data Scientist"),
    u("daniel@inextlabs.com", "Daniel Wong", "main", "inx", "Chief Executive Officer"),
    u("sara@inextlabs.com", "Sara Ismail", "member", "inx", "Sales Director"),
    u("arif@inextlabs.com", "Arif Hakim", "member", "inx", "Solutions Architect"),
    u("priya@inextlabs.com", "Priya Nair", "member", "inx", "Marketing Lead"),
    u("ken@inextlabs.com", "Ken Lee", "member", "inx", "ML Engineer"),
    u("farah.ai@gmail.com", "Dr Farah Aziz", "individual", null, "Independent AI governance consultant", { bio: "AI policy and responsible-AI advisor to public and private sector." }),
  ];
  const individuals: Individual[] = [
    { email: "farah.ai@gmail.com", name: "Dr Farah Aziz", pikomNo: "[PIKOM no.]", whitelistedOn: "2026-10-18", renewal: "2027-10-17" },
    { email: "lim.researcher@outlook.com", name: "Lim Wei Jie", pikomNo: "[PIKOM no.]", whitelistedOn: "2026-11-03", renewal: "2027-11-02" },
  ];
  const job = (title: string, orgId: string, company: string, category: string, location: string, mode: string, experience: string, postedOn: string): Job => ({
    id: uid(), title, orgId, company, category, type: "Full-time", location, mode, experience, salary: "[RM range]", description: "Sample listing for the demo.", linkedinUrl: "", applyEmail: "", postedOn, postedBy: "",
  });
  const jobs: Job[] = [
    job("Senior ML Engineer (LLM)", "inx", "iNextLabs", "Engineering", "Kuala Lumpur", "Hybrid", "Senior / Lead", "2026-11-04"),
    job("AI Solutions Architect", "dxc", "DXC Technology", "Engineering", "Cyberjaya", "On-site", "Senior / Lead", "2026-11-02"),
    job("Data Scientist, Telco Analytics", "fi", "Forest Interactive", "Data & Analytics", "Kuala Lumpur", "Hybrid", "Mid-level", "2026-10-30"),
    job("AI Graduate Programme 2027", "fi", "Forest Interactive", "Graduate / Internship", "Kuala Lumpur", "On-site", "Graduate / Intern", "2026-10-25"),
  ];
  return { orgs, individuals, users, jobs, log: [{ at: "2026-11-02 10:12", who: "PIKOM Secretariat (demo)", what: "Whitelisted dxc.com for DXC Technology Malaysia" }] };
}

const KEY = "ax-demo-v1";
const SESSION = "ax-demo-session";

export type Result = { ok: true; msg?: string } | { ok: false; code: string; msg: string };

interface Ctx {
  db: DB; me: User | null; myOrg: Org | null; ready: boolean;
  seatsUsed: (orgId: string) => number;
  orgUsers: (orgId: string) => User[];
  checkEmail: (email: string) => Result & { kind?: "org" | "individual"; org?: Org };
  register: (d: { email: string; name: string; password: string; jobTitle: string; consent: boolean }) => Result;
  signIn: (email: string, password: string) => Result;
  signOut: () => void;
  updateMe: (p: Partial<User>) => void;
  changePassword: (current: string, next: string) => Result;
  updateOrgProfile: (orgId: string, p: Partial<CompanyProfile>) => void;
  removeUser: (userId: string) => void;
  setMainHolder: (orgId: string, email: string) => void;
  addOrg: (o: { domain: string; name: string; type: MemberType; mainEmail: string; pikomNo: string; renewal: string }) => Result;
  updateOrg: (orgId: string, p: Partial<Org>) => void;
  removeOrg: (orgId: string) => void;
  addIndividual: (i: { email: string; name: string; pikomNo: string; renewal: string }) => Result;
  removeIndividual: (email: string) => void;
  addUserAsAdmin: (orgId: string, email: string, name: string) => Result;
  postJob: (j: Omit<Job, "id" | "postedOn" | "postedBy" | "orgId" | "company">) => void;
  deleteJob: (id: string) => void;
  reset: () => void;
  quickSignIn: (email: string) => void;
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
  const log = (d: DB, what: string): DB => ({ ...d, log: [{ at: stamp(), who: me?.name || "System", what }, ...d.log].slice(0, 200) });

  const seatsUsed = useCallback((orgId: string) => db.users.filter(u => u.orgId === orgId).length, [db]);
  const orgUsers = useCallback((orgId: string) => db.users.filter(u => u.orgId === orgId), [db]);

  const checkEmail: Ctx["checkEmail"] = (raw) => {
    const email = raw.trim().toLowerCase();
    if (db.users.some(u => u.email === email)) return { ok: false, code: ERR.ALREADY_REGISTERED, msg: "This email already has an AI Xchange account. Sign in instead, or reset your password." };
    const ind = db.individuals.find(i => i.email === email);
    if (ind) return { ok: true, kind: "individual" };
    const dom = domainOf(email);
    const org = db.orgs.find(o => o.domain === dom);
    if (!org) {
      if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return { ok: false, code: ERR.PUBLIC_EMAIL, msg: "Personal email addresses can only join as a PIKOM Individual Member. If you are one, ask the PIKOM secretariat to whitelist this exact email. Company members must use their company email." };
      return { ok: false, code: ERR.NOT_WHITELISTED, msg: `Your company domain (@${dom || "…"}) is not registered with AI Xchange. Contact PIKOM to sign up as a member, or if your company is already a PIKOM member, ask the site admin to whitelist your domain.` };
    }
    if (org.status === "suspended") return { ok: false, code: ERR.SUSPENDED, msg: `Access for ${org.name} is paused (membership renewal pending). Please contact the PIKOM secretariat.` };
    if (seatsUsed(org.id) >= org.seatLimit) {
      const main = db.users.find(u => u.orgId === org.id && u.role === "main");
      return { ok: false, code: ERR.SEATS_FULL, msg: `${org.name} has used all ${org.seatLimit} of its ${org.seatLimit} seats. Ask your main account holder${main ? ` (${main.name})` : ""} to manage your company's seat allocation and free up a seat.` };
    }
    return { ok: true, kind: "org", org };
  };

  const register: Ctx["register"] = ({ email: raw, name, password, jobTitle, consent }) => {
    const email = raw.trim().toLowerCase();
    const chk = checkEmail(email);
    if (!chk.ok) return chk;
    if (!consent) return { ok: false, code: "AX-106", msg: "Please accept the privacy notice to continue." };
    if (password.length < 8) return { ok: false, code: "AX-107", msg: "Password must be at least 8 characters." };
    const org = chk.kind === "org" ? chk.org! : null;
    const role: Role = org ? (org.mainEmail === email ? "main" : "member") : "individual";
    const user: User = { id: uid(), email, name: name.trim(), password, role, orgId: org?.id || null, jobTitle, phone: "", linkedin: "", bio: "", interests: [], showInDirectory: true, createdOn: today(), lastSignIn: stamp() };
    setDb(d => log({ ...d, users: [...d.users, user] }, `${user.name} registered${org ? ` under ${org.domain} (${seatsUsed(org.id) + 1}/${org.seatLimit} seats)` : " as Individual Member"}`));
    setMeId(user.id);
    return { ok: true, msg: role === "main" ? "You are the main account holder for your company." : undefined };
  };

  const signIn: Ctx["signIn"] = (raw, password) => {
    const email = raw.trim().toLowerCase();
    const u = db.users.find(x => x.email === email);
    if (!u || u.password !== password) return { ok: false, code: ERR.BAD_LOGIN, msg: "Email or password is incorrect." };
    const org = u.orgId ? db.orgs.find(o => o.id === u.orgId) : null;
    if (org?.status === "suspended") return { ok: false, code: ERR.SUSPENDED, msg: `Access for ${org.name} is paused. Please contact the PIKOM secretariat.` };
    setDb(d => ({ ...d, users: d.users.map(x => x.id === u.id ? { ...x, lastSignIn: stamp() } : x) }));
    setMeId(u.id);
    return { ok: true };
  };

  const value: Ctx = {
    db, me, myOrg, ready, seatsUsed, orgUsers, checkEmail, register, signIn,
    signOut: () => setMeId(null),
    updateMe: (p) => me && setDb(d => ({ ...d, users: d.users.map(u => u.id === me.id ? { ...u, ...p } : u) })),
    changePassword: (cur, next) => {
      if (!me) return { ok: false, code: ERR.BAD_LOGIN, msg: "Not signed in." };
      if (me.password !== cur) return { ok: false, code: ERR.BAD_LOGIN, msg: "Current password is incorrect." };
      if (next.length < 8) return { ok: false, code: "AX-107", msg: "New password must be at least 8 characters." };
      setDb(d => ({ ...d, users: d.users.map(u => u.id === me.id ? { ...u, password: next } : u) }));
      return { ok: true, msg: "Password updated." };
    },
    updateOrgProfile: (orgId, p) => setDb(d => log({ ...d, orgs: d.orgs.map(o => o.id === orgId ? { ...o, profile: { ...o.profile, ...p } } : o) }, `Company profile updated for ${d.orgs.find(o => o.id === orgId)?.name}`)),
    removeUser: (userId) => setDb(d => { const u = d.users.find(x => x.id === userId); return log({ ...d, users: d.users.filter(x => x.id !== userId) }, `Removed ${u?.name} (${u?.email}) from AI Xchange`); }),
    setMainHolder: (orgId, email) => setDb(d => log({ ...d,
      orgs: d.orgs.map(o => o.id === orgId ? { ...o, mainEmail: email } : o),
      users: d.users.map(u => u.orgId !== orgId ? u : { ...u, role: u.email === email ? "main" : "member" }),
    }, `Main account holder for ${d.orgs.find(o => o.id === orgId)?.domain} set to ${email}`)),
    addOrg: ({ domain, name, type, mainEmail, pikomNo, renewal }) => {
      const dom = domain.trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom)) return { ok: false, code: "AX-301", msg: "Enter a valid domain, e.g. company.com.my" };
      if (PUBLIC_EMAIL_DOMAINS.includes(dom)) return { ok: false, code: "AX-302", msg: "Public email domains can't be whitelisted for a company. Add the person as an Individual Member instead." };
      if (db.orgs.some(o => o.domain === dom)) return { ok: false, code: "AX-303", msg: "This domain is already whitelisted." };
      const main = mainEmail.trim().toLowerCase();
      if (main && domainOf(main) !== dom) return { ok: false, code: "AX-304", msg: `The main account holder's email must end in @${dom}.` };
      const org: Org = { id: uid(), domain: dom, name: name.trim(), type, pikomNo, mainEmail: main, seatLimit: SEAT_LIMIT, status: "active", whitelistedOn: today(), renewal, profile: emptyProfile() };
      setDb(d => log({ ...d, orgs: [org, ...d.orgs] }, `Whitelisted ${dom} for ${org.name}`));
      return { ok: true, msg: `${dom} whitelisted. Anyone with an @${dom} email can now register (up to ${SEAT_LIMIT} people).` };
    },
    updateOrg: (orgId, p) => setDb(d => log({ ...d, orgs: d.orgs.map(o => o.id === orgId ? { ...o, ...p } : o) }, `Updated ${d.orgs.find(o => o.id === orgId)?.domain}: ${Object.keys(p).join(", ")}`)),
    removeOrg: (orgId) => setDb(d => { const o = d.orgs.find(x => x.id === orgId); return log({ ...d, orgs: d.orgs.filter(x => x.id !== orgId), users: d.users.filter(u => u.orgId !== orgId), jobs: d.jobs.filter(j => j.orgId !== orgId) }, `Removed domain ${o?.domain} and its accounts`); }),
    addIndividual: ({ email, name, pikomNo, renewal }) => {
      const e = email.trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, code: "AX-305", msg: "Enter a valid email address." };
      if (db.individuals.some(i => i.email === e)) return { ok: false, code: "AX-303", msg: "This email is already whitelisted." };
      setDb(d => log({ ...d, individuals: [{ email: e, name: name.trim(), pikomNo, whitelistedOn: today(), renewal }, ...d.individuals] }, `Whitelisted individual ${e}`));
      return { ok: true, msg: `${e} can now register as an Individual Member.` };
    },
    removeIndividual: (email) => setDb(d => log({ ...d, individuals: d.individuals.filter(i => i.email !== email), users: d.users.filter(u => !(u.role === "individual" && u.email === email)) }, `Removed individual ${email}`)),
    addUserAsAdmin: (orgId, email, name) => {
      const org = db.orgs.find(o => o.id === orgId);
      const e = email.trim().toLowerCase();
      if (!org) return { ok: false, code: "AX-101", msg: "Unknown company." };
      if (domainOf(e) !== org.domain) return { ok: false, code: "AX-304", msg: `Email must end in @${org.domain}.` };
      if (db.users.some(u => u.email === e)) return { ok: false, code: ERR.ALREADY_REGISTERED, msg: "This email is already registered." };
      if (seatsUsed(orgId) >= org.seatLimit) return { ok: false, code: ERR.SEATS_FULL, msg: `All ${org.seatLimit} seats are used. Remove someone first.` };
      const role: Role = org.mainEmail === e ? "main" : "member";
      const user: User = { id: uid(), email: e, name: name.trim() || e, password: "demo1234", role, orgId, jobTitle: "", phone: "", linkedin: "", bio: "", interests: [], showInDirectory: true, createdOn: today() };
      setDb(d => log({ ...d, users: [...d.users, user] }, `Added ${e} to ${org.domain} (invite email sent — demo)`));
      return { ok: true, msg: `${e} added. In the live version they get an email to set their password.` };
    },
    postJob: (j) => me && setDb(d => log({ ...d, jobs: [{ ...j, id: uid(), orgId: me.orgId, company: myOrg ? myOrg.name.replace(/ Sdn\. Bhd\.| \(M\)/g, "") : me.name, postedOn: today(), postedBy: me.email }, ...d.jobs] }, `${me.name} posted job “${j.title}”`)),
    deleteJob: (id) => setDb(d => ({ ...d, jobs: d.jobs.filter(j => j.id !== id) })),
    reset: () => { setDb(seed()); setMeId(null); },
    quickSignIn: (email) => { const u = db.users.find(x => x.email === email); setMeId(u ? u.id : null); },
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
export const isAdmin = (u: User | null) => u?.role === "superadmin";
export const roleLabel = (r: Role) => ({ superadmin: "Super admin", main: "Main account holder", member: "Company member", individual: "Individual member" }[r]);
