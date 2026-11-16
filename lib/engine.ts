// AI Xchange data model and rules. Shared by the browser (instant updates) and the server
// (the saved, authoritative copy in Supabase Postgres). No React here.
import { SEAT_LIMIT, PUBLIC_EMAIL_DOMAINS, type MemberType } from "./options";
import { MEMBERS, CATS } from "./data";

/** main = Company admin (max 2 per company), editor = Company content admin, contentadmin = PIKOM admin. */
export type Role = "superadmin" | "contentadmin" | "main" | "editor" | "member" | "individual" | "guest";
export const PAYING: Role[] = ["main", "editor", "member", "individual"];
export const MAX_COMPANY_ADMINS = 2;
export interface Settings { memberCompaniesStat: string; companiesStat: string; secretariatEmail: string; secretariatPhone: string; defaultSeatLimit: number; maxAdmins: number; }
export const DEFAULT_SETTINGS: Settings = { memberCompaniesStat: "2,000+", companiesStat: "157", secretariatEmail: "", secretariatPhone: "", defaultSeatLimit: 5, maxAdmins: 2 };
export interface Notify { eventReminders: boolean; rfpReplies: boolean; newMembers: boolean; }
export type TrashKind = "user" | "org" | "event" | "content" | "job" | "individual";
export interface TrashItem { id: string; kind: TrashKind; label: string; at: string; by: string; orgId?: string | null; data: any; }
export const STAFF: Role[] = ["superadmin", "contentadmin"];
/** Full access = paying members and PIKOM staff. Guests and visitors see listings only. */
export const isSuper = (u: User | null) => !!u && (u.role === "superadmin" || u.staff === "super");
export const isStaff = (u: User | null) => !!u && (STAFF.includes(u.role) || !!u.staff);
export const fullAccess = (u: User | null) => !!u && (PAYING.includes(u.role) || isStaff(u));
export const canManageContent = isStaff;
/** Company admin of this company (or super admin). */
export const canManageCompany = (u: User | null, orgId: string | null | undefined) => !!u && !!orgId && (isSuper(u) || (u.orgId === orgId && u.role === "main"));
/** Can edit the company profile and its jobs/RFPs. */
export const canEditCompany = (u: User | null, orgId: string | null | undefined) => !!u && !!orgId && (isSuper(u) || (u.orgId === orgId && (u.role === "main" || u.role === "editor")));
/** Jobs are posted by companies only: company admins and company content admins. */
export const canPostJob = (u: User | null) => !!u && !!u.orgId && (u.role === "main" || u.role === "editor");
/** RFPs: company admins/content admins, individual members, and super admins. */
export const canPostRfp = (u: User | null) => canPostJob(u) || (!!u && (u.role === "individual" || isSuper(u)));
export const adminsOf = (db: DB, orgId: string) => db.users.filter(u => u.orgId === orgId && u.role === "main");

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
  /** Directory privacy (default shown) and email preferences. */
  showPhone?: boolean; showLinkedin?: boolean; notify?: Notify;
  /** Bumped by "sign out everywhere" / password change; old sessions stop working. */
  sv?: number;
}
export interface Job {
  id: string; title: string; orgId: string | null; company: string; category: string; type: string;
  location: string; mode: string; experience: string; salary: string; description: string;
  linkedinUrl: string; applyEmail: string; postedOn: string; postedBy: string; hidden?: boolean;
}
export interface Rfp {
  id: string; title: string; buyer: string; orgId: string | null; sector: string; type: string; budget: string;
  closes: string; description: string; contactEmail: string; status: "Open" | "Closed" | "Awarded"; postedOn: string; postedBy: string; hidden?: boolean;
  /** Tender-style details (Tenders On Time format). All optional. */
  ref?: string; docRef?: string; country?: string; noticeType?: string; competition?: string; publishedOn?: string; emd?: string;
  ownership?: string; procurementType?: string; financier?: string; summary?: string; source?: string; sourceUrl?: string;
  /** Who shared it on AI Xchange (company or person), when different from the buyer. */
  poster?: string;
}
export const RFP_FIELDS = ["title", "buyer", "sector", "type", "budget", "closes", "description", "contactEmail", "status", "hidden", "ref", "docRef", "country", "noticeType", "competition", "publishedOn", "emd", "ownership", "procurementType", "financier", "summary", "source", "sourceUrl"] as const;
export const PROCUREMENT_TYPES = ["Goods", "Services", "Works", "Consultancy", "Other"];
/** Past the bid deadline counts as closed, whatever the stored status. */
export const rfpStatus = (r: Rfp, t = new Date().toISOString().slice(0, 10)) => r.status === "Open" && r.closes && r.closes < t ? "Closed" : r.status;
export type EventType = "Online" | "Physical" | "Hybrid";
export interface Registration { userId: string; at: string; status: "confirmed" | "waitlist" | "cancelled"; attended?: boolean; }
export interface PEvent {
  id: string; title: string; type: EventType; date: string; time: string; venue: string; link: string;
  capacity: number | null; perCompany: number | null; audience: "members" | "all"; price: string; description: string;
  regClose: string; status: "Published" | "Draft" | "Cancelled"; materials: string; registrations: Registration[]; host: string;
  /** Shown instead of the formatted date, e.g. "5–7 Oct 2026" or "December 2026 · date TBC". */
  dateLabel?: string;
  /** Event website. With external=true, registration happens there instead of on AI Xchange. */
  url?: string; external?: boolean;
  /** Event page extras (all optional). regUrl: where to register when it differs from the event website. */
  tagline?: string; regUrl?: string; regLabel?: string; highlights?: string[]; agenda?: string[]; speakers?: string[]; whoShouldAttend?: string; contact?: string;
  /** Promoted on the home page, Events page and the top bar until the event date. */
  featured?: boolean;
}
export type ContentKind = "policy" | "research" | "news";
export interface Content {
  id: string; kind: ContentKind; title: string; summary: string; body: string; source: string; url: string; file: string;
  date: string; policyStatus: string; featured: boolean; published: boolean;
  /** Cover image (path or URL), direct PDF link (opens/downloads on click), date shown e.g. "July 2026", key findings. */
  image?: string; fileUrl?: string; dateLabel?: string; highlights?: string[];
}
export interface Announcement { id: string; text: string; link: string; active: boolean; }
export interface LogEntry { at: string; who: string; what: string; }
export interface DB {
  orgs: Org[]; individuals: Individual[]; users: User[]; jobs: Job[]; rfps: Rfp[]; events: PEvent[];
  content: Content[]; announcements: Announcement[]; spotlight: string[]; log: LogEntry[];
  settings?: Settings; trash?: TrashItem[]; migrations?: string[];
}
/** Fill in fields added after data was first saved. */
export function normalize(d: DB): DB {
  const out: DB = { ...d, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) }, trash: d.trash || [], migrations: d.migrations || [] };
  // 16 Nov 2026: public AI tenders (from Tenders On Time) shared by PIKOM; IDs are fixed so this runs once.
  if (!out.migrations!.includes("tenders-2026-11")) {
    const have = new Set(out.rfps.map(r => r.id));
    out.rfps = [...TENDERS_2026_11.filter(t => !have.has(t.id)), ...out.rfps];
    out.migrations = [...out.migrations!, "tenders-2026-11"];
  }
  // 16 Nov 2026: real PIKOM events replace the sample events; sample RFPs removed.
  if (!out.migrations!.includes("events-2026-11")) {
    const isSample = (t: string) => /sample/i.test(t);
    const have = new Set(out.events.map(e => e.id));
    out.events = [...EVENTS_2026_11.filter(e => !have.has(e.id)), ...out.events.filter(e => !isSample(e.title))];
    out.rfps = out.rfps.filter(r => !isSample(r.title));
    out.announcements = out.announcements.map(a => a.text.startsWith("Preview of AI Xchange for PIKOM review") || a.text.startsWith("This is a demo") ? { ...a, text: "Preview of AI Xchange for PIKOM review — job listings shown are samples." } : a);
    out.migrations = [...out.migrations!, "events-2026-11"];
  }
  // 16 Nov 2026: event page details + promote the next PIKOM event. Only fills fields that are still empty.
  if (!out.migrations!.includes("events-2026-11b")) {
    out.events = out.events.map(e => {
      const x = EVENT_DETAILS_2026_11[e.id]; if (!x) return e;
      const fill: Partial<PEvent> = {};
      (Object.keys(x) as (keyof PEvent)[]).forEach(k => { if (e[k] === undefined || e[k] === "") (fill as Record<string, unknown>)[k] = x[k]; });
      return { ...e, ...fill };
    });
    out.migrations = [...out.migrations!, "events-2026-11b"];
  }
  // 16 Nov 2026: PIKOM Research / White Papers from pikom.org.my/research-white-paper replace the sample research items.
  if (!out.migrations!.includes("research-2026-11")) {
    const have = new Set(out.content.map(c => c.id));
    const samples = ["Economic & Digital Job Market Outlook", "Digital Economy Strategic Outlook"];
    out.content = [...RESEARCH_2026_11.filter(c => !have.has(c.id)), ...out.content.filter(c => !(c.kind === "research" && samples.includes(c.title)))];
    out.migrations = [...out.migrations!, "research-2026-11"];
  }
  // 16 Nov 2026: verified data only. Keep company and user data; remove sample jobs; sample policy/news replaced with sourced items; unverified event wording removed.
  if (!out.migrations!.includes("verified-only-2026-11")) {
    out.jobs = out.jobs.filter(j => !/sample/i.test(j.title));
    const oldTitles = ["Malaysia AI Governance Bill", "BNM guidelines on AI in financial services", "PDPA amendments for AI-generated data", "National AI Action Plan 2026–2030 published", "Stanford AI Index 2026", "Economic & Digital Job Market Outlook", "Digital Economy Strategic Outlook"];
    const have = new Set(out.content.map(c => c.id));
    out.content = [...VERIFIED_CONTENT_2026_11.filter(c => !have.has(c.id)), ...out.content.filter(c => !oldTitles.includes(c.title))];
    const fix: Record<string, [string, string][]> = {
      "ev-pikom-funrun-2026": [["PIKOM's community fun run for members, their teams and families — a chance to meet the wider tech community outside the boardroom.", "PIKOM Fun Run 2026. Date, venue and registration details to be confirmed by PIKOM."]],
      "ev-members-meet-4-2026": [["The fourth AI Xchange members' meet of 2026: member updates, AI policy news and networking. Register here to hold your place — we'll confirm the date and venue by email.", "AI Xchange Members Meet (4). Date, venue and programme to be confirmed by PIKOM. Register here to hold your place — we'll confirm the details by email."]],
    };
    out.events = out.events.map(e => {
      let x = e;
      for (const [o, n] of fix[e.id] || []) if (x.description === o) x = { ...x, description: n };
      if (e.id === "ev-members-meet-4-2026" && x.tagline === "Member updates, AI policy news and networking") x = { ...x, tagline: undefined, highlights: undefined, whoShouldAttend: undefined, contact: undefined };
      if (e.id === "ev-gbs-global-summit-2026" && x.whoShouldAttend === "GBS and shared-services leaders, technology and AI providers, investors and policymakers.") x = { ...x, whoShouldAttend: "Industry leaders, innovators, policymakers and decision-makers in Global Business Services." };
      return x;
    });
    out.announcements = out.announcements.map(a => a.text.startsWith("Preview of AI Xchange for PIKOM review") ? { ...a, text: "Preview of AI Xchange for PIKOM review — member companies and accounts shown are samples." } : a);
    // Ritesh (super admin) owns the current shared tenders and RFPs.
    out.rfps = out.rfps.map(r => r.postedBy ? r : { ...r, postedBy: "ritesh.devarajan@forest-interactive.com" });
    out.migrations = [...out.migrations!, "verified-only-2026-11"];
  }
  return out;
}
const vc = (id: string, kind: ContentKind, title: string, source: string, date: string, summary: string, url: string, extra: Partial<Content> = {}): Content => ({
  id, kind, title, source, date, summary, url, body: "", file: "", policyStatus: "", featured: false, published: true, ...extra,
});
/** Sourced policy and news items (checked 16 Nov 2026). */
export const VERIFIED_CONTENT_2026_11: Content[] = [
  vc("pv-ai-governance-bill-2026", "policy", "Proposed AI Governance Bill — public consultation", "National AI Office (NAIO)", "2026-07-10",
    "NAIO consulted from 10 to 31 July 2026 on Malaysia's first AI law. The proposal covers AI systems across their lifecycle and is expected in Parliament by Q1 2027.",
    "https://www.bakermckenzie.com/en/insight/publications/2026/07/malaysia-public-consultation-on-the-ai-governance-bill",
    { policyStatus: "Consultation closed", featured: true, highlights: ["Three risk tiers: unacceptable (prohibited), high and low", "A Central AI Authority for safety, enforcement and enablement", "Incident reporting by AI developers and deployers", "A supervised AI Sandbox for testing"] }),
  vc("pv-pdpd-ai-framework-2026", "policy", "Proposed AI and Personal Data Protection Framework — consultation", "Personal Data Protection Department (PDPD)", "2026-10-05",
    "How organisations that develop, buy or deploy AI should comply with the PDPA 2010 when processing personal data: lawful basis, testing, third-party AI and cross-border transfers, data subject rights, security and governance. Submissions closed 23 October 2026.",
    "https://www.bakermckenzie.com/en/insight/publications/2026/10/malaysia-consultation-on-proposed-ai-and-personal-data-protection-framework",
    { policyStatus: "Consultation closed" }),
  vc("pv-bnm-ai-financial-2025", "policy", "Discussion Paper on AI in the Malaysian Financial Sector", "Bank Negara Malaysia", "2025-08-05",
    "Bank Negara's proposed approach to responsible AI adoption by financial institutions. Feedback closed 17 October 2025.",
    "https://www.bnm.gov.my/-/dp-aifs25", { policyStatus: "Feedback closed" }),
  vc("nv-national-ai-action-plan", "news", "National AI Action Plan 2026–2030 (AI Nation 2030)", "AI Malaysia / National AI Office", "2026-07-01",
    "Malaysia's AI roadmap: 28 initiatives — 14 impact engines for sectors and 14 foundation enablers such as talent, research, data, compute and governance.",
    "https://ai.gov.my/faq/national-ai-action-plan-2026-2030-fact-sheet/",
    { dateLabel: "2026", highlights: ["300,000–500,000 new AI-related jobs by 2030", "Top 10 in global AI readiness by 2030", "0.8–1.2 percentage points of extra GDP growth a year"] }),
  vc("nv-stanford-ai-index-2026", "news", "The 2026 AI Index Report", "Stanford HAI", "2026-04-01",
    "Stanford's annual report on global AI research, investment, adoption and policy.",
    "https://hai.stanford.edu/ai-index/2026-ai-index-report",
    { dateLabel: "2026", highlights: ["A record 362 reported AI incidents in 2025", "Generative AI reached 53% adoption within three years"] }),
];
const PIKOM_RESEARCH_PAGE = "https://pikom.org.my/research-white-paper/";
export const RESEARCH_2026_11: Content[] = [
  { id: "rs-econ-outlook-2026-07", kind: "research", title: "Malaysia Economic Outlook Review — July 2026", source: "PIKOM Research", date: "2026-07-21", dateLabel: "July 2026",
    summary: "A sector-by-sector review of Malaysia's Q2 2026 economic performance, structural risks and policy landscape, drawing on DOSM and Bank Negara data, with a business outlook.",
    highlights: ["Q2 2026 GDP grew 5.8% year on year (advance estimate), up from 5.4% in Q1", "H1 2026 growth of 5.6%, against 4.5% in H1 2025", "June 2026 inflation eased to 1.9%", "BNM forecasts 4.0–5.0% growth for 2026; the review sees the upper half as plausible"],
    body: "", url: PIKOM_RESEARCH_PAGE, file: "", fileUrl: "https://pikom.org.my/PIKOM/Malaysia_Economic_Outlook_Review-July2026.pdf", image: "/research/econ-outlook-jul-2026.jpg", policyStatus: "", featured: true, published: true },
  { id: "rs-mv-aig-2026", kind: "research", title: "A Minimum Viable AI Governance (MV-AIG)", source: "PIKOM Oversight Committee", date: "2026-06-01", dateLabel: "June 2026",
    summary: "A lightweight AI governance model for small and micro organisations that use AI rather than build it, focused on everyday uses like document analysis and meeting transcription.",
    highlights: ["Classify every AI tool by impact (low, medium, high) before use", "Clear prohibited uses, e.g. decisions about people without human review", "Real AI incident case studies", "A three-phase roadmap: establish, operationalise, maintain"],
    body: "", url: PIKOM_RESEARCH_PAGE, file: "", fileUrl: "https://pikom.org.my/Research/MV_AIG_V5.pdf", image: "/research/mv-aig-2026.jpg", policyStatus: "", featured: true, published: true },
  { id: "rs-cyber-resilience-2026", kind: "research", title: "Beyond Compliance: The State of Cyber Resilience in Malaysia 2026", source: "Cybersecurity by PIKOM", date: "2026-04-01", dateLabel: "April 2026",
    summary: "PIKOM's national baseline report from a March 2026 survey of mainly PIKOM members: incidents and threats, Zero Trust, budgets and staffing, third-party risk, AI and quantum readiness and the Cyber Security Act 2024, with recommendations.",
    highlights: ["35.9% had at least one successful cyber incident in 2024–2025", "51.3% have annual cyber budgets below RM250,000", "78.8% have five or fewer dedicated cyber staff"],
    body: "", url: PIKOM_RESEARCH_PAGE, file: "", fileUrl: "https://pikom.org.my/2026/Cyber_Resilience_in_Malaysia_2026.pdf", image: "/research/cyber-resilience-2026.jpg", policyStatus: "", featured: true, published: true },
];
const tot = (ref: string, title: string, buyer: string, sector: string, procurementType: string, publishedOn: string, closes: string, docRef: string, budget: string, summary: string, description: string): Rfp => ({
  id: "tot" + ref.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 16), ref: /^\d+$/.test(ref) ? `TOT ${ref}` : ref, title, buyer, orgId: null, sector, type: "Public tender", budget, closes, description, summary, contactEmail: "",
  status: "Open", postedOn: publishedOn, postedBy: "", poster: "PIKOM", hidden: false, docRef, country: "Malaysia", noticeType: "Tender",
  competition: "ICB", publishedOn, emd: "Refer document", ownership: "Public", procurementType, financier: "Self financed",
  source: "Tenders On Time", sourceUrl: "https://www.tendersontime.com",
});
const pev = (id: string, p: Partial<PEvent> & Pick<PEvent, "title" | "type" | "date" | "venue" | "description" | "host">): PEvent => ({
  id, time: "", link: "", capacity: null, perCompany: null, audience: "all", price: "See event website", regClose: p.date, status: "Published", materials: "", registrations: [], ...p,
});
/** The event promoted across the site: the soonest upcoming published event marked featured. */
export function promotedEvent(db: DB, todayIso: string): PEvent | undefined {
  return db.events.filter(e => e.featured && e.status === "Published" && e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date))[0];
}
export const EVENT_DETAILS_2026_11: Record<string, Partial<PEvent>> = {
  "ev-gbs-global-summit-2026": {
    featured: true, tagline: "Shaping the future of Global Business Services",
    regUrl: "https://forms.gle/zvS5XBovhRjPqSWT8", regLabel: "Register interest",
    highlights: ["Latest trends shaping Global Business Services (GBS) worldwide", "Meet decision-makers, innovators and policymakers", "GBS Awards — celebrating excellence in the industry", "Register interest for early updates and invitations"],
    whoShouldAttend: "Industry leaders, innovators, policymakers and decision-makers in Global Business Services.",
    contact: "events@gbsmalaysia.org.my · PIKOM 03-7622 0079",
  },
  "ev-pikom-lead-2026": { tagline: "Inspire · Innovate · Invest" },
};
export const EVENTS_2026_11: PEvent[] = [
  pev("ev-pikom-funrun-2026", { title: "PIKOM Fun Run 2026", type: "Physical", date: "2026-10-31", dateLabel: "October 2026", venue: "Kuala Lumpur — venue to be confirmed", host: "PIKOM",
    description: "PIKOM Fun Run 2026. Date, venue and registration details to be confirmed by PIKOM.", price: "Details from PIKOM" }),
  pev("ev-asocio-ai-summit-2026", { title: "ASOCIO Digital & AI Summit 2026", type: "Physical", date: "2026-10-05", dateLabel: "5–7 Oct 2026", venue: "Jakarta, Indonesia", host: "ASOCIO · hosted by APTIKNAS",
    description: "Asia-Oceania's digital and AI summit for government leaders, industry, academia and C-level executives: technology advances, business transformation, responsible AI governance and regional collaboration. Includes the ASOCIO Digital AI Award 2026.",
    url: "https://asocio.org/event.php", external: true }),
  pev("ev-pikom-lead-2026", { title: "PIKOM LEAD 2026 — Leading Malaysia's Digital Economy into the AI Era", type: "Physical", date: "2026-11-03", venue: "CCEC The Vertical, Bangsar South, Kuala Lumpur", host: "PIKOM",
    description: "PIKOM's C-level leadership summit (Inspire · Innovate · Invest) on the business, investment and policy choices of Malaysia's AI-era digital economy, for CEOs, CIOs/CTOs, investors and public-sector leaders. LEAD 2025 drew 460 delegates.",
    url: "https://pikom.org.my/LEAD/", external: true }),
  pev("ev-gbs-global-summit-2026", { title: "GBS Global Summit & Awards 2026", type: "Physical", date: "2026-11-18", venue: "KLGCC Convention Centre, 1A Jalan Bukit Kiara 1, Bukit Kiara, Kuala Lumpur", host: "GBS Malaysia · PIKOM",
    description: "Industry leaders, innovators and policymakers shaping Global Business Services meet to explore what's next for GBS, connect with decision-makers and celebrate GBS excellence at the awards. Questions: events@gbsmalaysia.org.my.",
    price: "Register interest on the event site", url: "https://pikom.org.my/gbsglobalsummit/", external: true }),
  pev("ev-members-meet-4-2026", { title: "AI Xchange Members Meet (4)", type: "Physical", date: "2026-12-31", dateLabel: "December 2026 · date to be confirmed", venue: "Kuala Lumpur — venue to be confirmed", host: "PIKOM AI Chapter",
    description: "AI Xchange Members Meet (4). Date, venue and programme to be confirmed by PIKOM. Register here to hold your place — we'll confirm the details by email.", audience: "members", capacity: 100, perCompany: 3, price: "Free for members" }),
];
export const TENDERS_2026_11: Rfp[] = [
  tot("150633071", "AI software subscription — TransAI literature transformation project", "Dewan Bahasa dan Pustaka (DBP)", "Government", "Goods", "2026-10-08", "2026-10-12", "PT/54709/2026/PERKHIDMATAN", "MYR 14,575.68",
    "Dewan Bahasa dan Pustaka (DBP) issued a tender for an AI software subscription for its TransAI (Artificial Intelligence Literature Transformation) project.",
    "Procurement of AI artificial intelligence software subscription for the TransAI Artificial Intelligence Literature Transformation Project. Tender documents were available 8–12 Oct 2026; closing 12 Oct 2026, 12:00."),
  tot("149673176", "AI improvement services for the e-Parliament system", "Ministry of Transport Malaysia (HQ)", "Government", "Services", "2026-09-23", "2026-09-30", "QT260000000027197", "Refer document",
    "The Ministry of Transport Malaysia headquarters issued a tender for artificial intelligence (AI) improvement services for the ministry's e-Parliament system.",
    "Procurement of Artificial Intelligence (AI) improvement services of the e-Parliament system for the Ministry of Transport."),
  tot("147381304", "CCTV upgrade with AI system — Menara MBJB, Johor Bahru", "Majlis Bandaraya Johor Bahru (MBJB)", "Government", "Works", "2026-08-17", "2026-09-08", "MBJB/K/57/2026", "Refer document",
    "Majlis Bandaraya Johor Bahru issued a tender for upgrading works, including installation and testing, of a CCTV system with artificial intelligence (AI) at the Majlis Bandaraya tower in Johor Bahru.",
    "Upgrading work including installation, testing and commissioning of closed-circuit camera (CCTV) with Artificial Intelligence (AI) system at the Majlis Bandaraya Tower, Johor Bahru."),
  tot("150765930", "AI server infrastructure for MCMC AI Excellence (AIX) Laboratories, MMU", "TM (Telekom Malaysia)", "Education / research", "Services", "2026-10-10", "2026-11-06", "DIT/2026/T/12/A1H/AI INFRA FOR AIX LAB", "Refer document",
    "TM issued a tender for the AI server infrastructure of the MCMC Artificial Intelligence Excellence (AIX) Laboratories at Multimedia University (MMU). Suppliers submit a complete solution as per the technical specification.",
    "Tender for the Artificial Intelligence (AI) server infrastructure for MCMC Artificial Intelligence Excellence (AIX) Laboratories for Multimedia University (MMU). Suppliers are invited to submit a complete solution as per the technical specification."),
  tot("150066635", "End User Computing (EUC) and accessories for AIX Laboratories, MMU", "Multimedia University (MMU)", "Education / research", "Services", "2026-09-29", "2026-10-27", "TM 200201003726 (571389-H)", "Refer document",
    "Multimedia University (MMU) issued a tender for End User Computing (EUC) and accessories for its Artificial Intelligence Excellence (AIX) Laboratories, for the Cyberjaya campus, Melaka campus, or both.",
    "Tender for End User Computing (EUC) and accessories for Artificial Intelligence Excellence (AIX) Laboratories. Suppliers may propose for Cyberjaya campus, Melaka campus, or both. Proposals must follow the technical specifications; only one proposal is accepted per bidder."),
  {
    ...tot("NAIO-AIRA-2026", "Study of AI awareness and readiness assessment instrument", "National AI Office (NAIO), MyDIGITAL Corporation", "Government", "Consultancy", "2026-07-20", "2026-08-12", "Not stated", "Not stated",
      "NAIO invited proposals for an end-to-end study to build a national AI awareness and readiness assessment framework — instruments, scoring, stakeholder engagement, pilot testing and a national rollout roadmap (4–6 months).",
      "Register interest and email a signed NDA to the procurement secretariat; only registered participants receive the RFP. Proposals closed 12 Aug 2026, 12:00 noon."),
    ref: "", noticeType: "RFP", competition: "Open", emd: "Not stated", financier: "Not stated", contactEmail: "admin@mydigital.gov.my",
    source: "MyDIGITAL", sourceUrl: "https://www.mydigital.gov.my/request-for-proposal-rfp-study-of-ai-awareness-and-readiness-assessment-instrument/",
  },
  {
    ...tot("NAIO-AITF-2026", "Industry-based AI apprenticeship programme (AI Talent Foundry)", "National AI Office (NAIO), MyDIGITAL Corporation", "Education / training", "Services", "2026-08-13", "2026-09-03", "Not stated", "Not stated",
      "NAIO requested quotations to design, deliver and manage an applied AI apprenticeship programme: curriculum, recruitment, industry placement, assessment, certification and programme administration.",
      "Part of the AI Talent Foundry (AITF) initiative. Register interest and email a signed NDA to the procurement secretariat; only registered participants receive the RFQ. Proposals closed 3 Sep 2026."),
    ref: "", noticeType: "RFQ", competition: "Open", emd: "Not stated", financier: "Not stated", contactEmail: "admin@mydigital.gov.my",
    source: "MyDIGITAL", sourceUrl: "https://www.mydigital.gov.my/request-for-quotation-rfq-industry-based-ai-apprenticeship-programme/",
  },
];
export const settingsOf = (d: DB): Settings => ({ ...DEFAULT_SETTINGS, ...(d.settings || {}) });

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

export type Result = { ok: true; msg?: string; undo?: string } | { ok: false; code: string; msg: string };
export type Check = (Result & { kind?: "org" | "individual" | "guest"; org?: Org });

export function eventCounts(e: PEvent) {
  const confirmed = e.registrations.filter(r => r.status === "confirmed").length;
  const waitlist = e.registrations.filter(r => r.status === "waitlist").length;
  const left = e.capacity == null ? null : Math.max(0, e.capacity - confirmed);
  return { confirmed, waitlist, left };
}
export const roleLabel = (r: Role) => ({ superadmin: "Super admin", contentadmin: "PIKOM admin", main: "Company admin", editor: "Company content admin", member: "Company member", individual: "Individual member", guest: "Guest (free account)" }[r]);
export const COMPANY_ROLES: Role[] = ["main", "editor", "member"];
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
  const role: Role = guestOk ? "guest" : org ? (org.mainEmail === email && adminsOf(db, org.id).length < settingsOf(db).maxAdmins ? "main" : "member") : "individual";
  const user: User = { id: uid(), email, name: d.name.trim().slice(0, 120), password: d.password, role, orgId: org?.id || null, jobTitle: (d.jobTitle || "").slice(0, 120), phone: "", linkedin: "", bio: "", interests: [], company: d.company?.slice(0, 120), createdOn: today(), lastSignIn: stamp() };
  const what = `${user.name} registered as ${role === "guest" ? "a guest" : org ? `${role === "main" ? "company admin" : "member"} of ${org.domain} (${seatsUsedIn(db, org.id) + 1}/${org.seatLimit})` : "an Individual Member"}`;
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
const SELF_FIELDS = ["name", "jobTitle", "phone", "linkedin", "bio", "interests", "company", "showPhone", "showLinkedin", "notify"] as const;
const PROFILE_FIELDS = ["about", "website", "category", "capabilities", "industries", "state", "employees", "phone", "linkedin", "logo"] as const;
const ORG_FIELDS = ["domain", "name", "type", "pikomNo", "mainEmail", "seatLimit", "status", "renewal"] as const;
const pick = <T extends object>(o: any, keys: readonly string[]): Partial<T> => Object.fromEntries(Object.entries(o || {}).filter(([k]) => keys.includes(k))) as Partial<T>;

export const ACTIONS = ["updateMe", "updateOrgProfile", "removeUser", "setMainHolder", "setCompanyRole", "addOrg", "updateOrg", "removeOrg", "addIndividual", "removeIndividual", "addUserAsAdmin", "addStaff", "removeStaff", "postJob", "deleteJob", "toggleJob", "postRfp", "updateRfp", "saveEvent", "deleteEvent", "registerEvent", "cancelEvent", "markAttended", "saveContent", "deleteContent", "saveAnnouncement", "deleteAnnouncement", "setSpotlight", "restore", "importOrgs", "updateSettings", "resetPassword"] as const;
export type ActionName = typeof ACTIONS[number];

/** Runs one action as `me`. Pure: returns the new data and the result. Permission checks live here,
 *  so the server enforces exactly the same rules the screens show. */
export function act(db: DB, me: User | null, name: ActionName, args: any[], ids: string[] = []): { db: DB; result: Result } {
  POOL = [...ids];
  if (!me) return { db, result: { ok: false, code: "AX-401", msg: "Please sign in first." } };
  const ok = (d: DB, what: string | null, msg?: string, undo?: string) => ({ db: what ? addLog(d, me.name, what) : d, result: { ok: true, msg, undo } as Result });
  /** Keep a removed item for 30 days so it can be restored. Returns the new data and the trash id. */
  const bin = (d: DB, kind: TrashKind, label: string, data: any, orgId?: string | null): [DB, string] => {
    const id = uid(); const cutoff = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return [{ ...d, trash: [{ id, kind, label, at: stamp(), by: me.name, orgId, data }, ...(d.trash || []).filter(t => t.at.slice(0, 10) >= cutoff)].slice(0, 100) }, id];
  };
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
      const [orgId, raw] = args; if (!canEditCompany(me, orgId)) return deny;
      const p = pick<CompanyProfile>(raw, PROFILE_FIELDS);
      return ok({ ...db, orgs: db.orgs.map(o => o.id === orgId ? { ...o, profile: { ...o.profile, ...p } } : o) }, `Company profile updated for ${orgName(orgId)}`);
    }
    case "removeUser": {
      const u = db.users.find(x => x.id === args[0]); if (!u) return no("AX-404", "Person not found.");
      if (!(sup || canManageCompany(me, u.orgId))) return deny;
      if (u.id === me.id) return no("AX-403", "You can't remove your own account here.");
      if (u.role === "main" && u.orgId && adminsOf(db, u.orgId).length <= 1 && !sup) return no("AX-111", "A company needs at least one admin. Make someone else admin first.");
      if (isStaff(u) && !sup) return no("AX-403", "This person is a PIKOM admin. Ask a super admin to remove them.");
      const regs = db.events.flatMap(e => e.registrations.filter(r => r.userId === u.id).map(r => ({ eventId: e.id, reg: r })));
      const [d1, t] = bin(db, "user", `${u.name} (${u.email})`, { user: u, regs }, u.orgId);
      return ok({ ...d1, users: db.users.filter(x => x.id !== u.id), events: db.events.map(e => promote({ ...e, registrations: e.registrations.filter(r => r.userId !== u.id) })) }, `Removed ${u.name} (${u.email})`, `${u.name} removed — seat freed.`, t);
    }
    case "setMainHolder": {
      const [orgId, raw] = args; if (!sup) return deny;
      const email = String(raw || "").trim().toLowerCase(); const o = db.orgs.find(x => x.id === orgId);
      if (!o) return no("AX-404", "Company not found.");
      if (email && o.domain && domainOf(email) !== o.domain) return no("AX-304", `The admin's email must end in @${o.domain}.`);
      const u = db.users.find(x => x.email === email && x.orgId === orgId);
      if (u && u.role !== "main" && adminsOf(db, orgId).length >= settingsOf(db).maxAdmins) return no("AX-110", `${o.name} already has ${settingsOf(db).maxAdmins} company admins. Change one of them to another role first.`);
      return ok({ ...db, orgs: db.orgs.map(x => x.id === orgId ? { ...x, mainEmail: email } : x), users: db.users.map(x => u && x.id === u.id ? { ...x, role: "main" } : x) },
        `Company admin for ${o.name} set to ${email || "(none)"}`, u ? `${u.name} is now a company admin.` : email ? `${email} becomes company admin when they register.` : "Saved.");
    }
    case "setCompanyRole": {
      const [userId, role] = args as [string, Role];
      const u = db.users.find(x => x.id === userId); if (!u || !u.orgId) return no("AX-404", "Person not found.");
      if (!COMPANY_ROLES.includes(role)) return no("AX-400", "Unknown role.");
      if (!canManageCompany(me, u.orgId)) return deny;
      const admins = adminsOf(db, u.orgId);
      if (role === "main" && u.role !== "main" && admins.length >= settingsOf(db).maxAdmins) return no("AX-110", `A company can have up to ${settingsOf(db).maxAdmins} admins. Change one admin to another role first.`);
      if (u.role === "main" && role !== "main" && admins.length <= 1) return no("AX-111", "A company needs at least one admin. Make someone else admin first.");
      return ok({ ...db, users: db.users.map(x => x.id === u.id ? { ...x, role } : x) }, `${u.name} (${orgName(u.orgId)}) is now ${roleLabel(role).toLowerCase()}`, `${u.name} is now ${roleLabel(role).toLowerCase()}.`);
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
      const o: Org = { id: uid(), domain: dom, name: String(nm || dom).trim(), type, pikomNo: pikomNo || "", mainEmail: main, seatLimit: settingsOf(db).defaultSeatLimit, status: "active", whitelistedOn: today(), renewal: renewal || "", profile: { ...emptyProfile(), category: category || "", about: about || "" } };
      return ok({ ...db, orgs: [o, ...db.orgs] }, `Whitelisted ${dom} for ${o.name} — added to the member directory`, `${o.name} is now in the member directory. Anyone with an @${dom} email can register (up to ${settingsOf(db).defaultSeatLimit} people).`);
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
      const o = db.orgs.find(x => x.id === orgId); if (!o) return no("AX-404", "Company not found.");
      const [d1, t] = bin(db, "org", o.name, { org: o, users: db.users.filter(u => u.orgId === orgId), jobs: db.jobs.filter(j => j.orgId === orgId) });
      return ok({ ...d1, orgs: db.orgs.filter(x => x.id !== orgId), users: db.users.filter(u => u.orgId !== orgId), jobs: db.jobs.filter(j => j.orgId !== orgId), spotlight: db.spotlight.filter(s => s !== orgId) }, `Removed ${o.name} and its accounts from AI Xchange`, `${o.name} removed.`, t);
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
      if (!sup) return deny; const email = args[0]; const ind = db.individuals.find(i => i.email === email); if (!ind) return no("AX-404", "Not found.");
      const [d1, t] = bin(db, "individual", email, { ind, users: db.users.filter(u => u.role === "individual" && u.email === email) });
      return ok({ ...d1, individuals: db.individuals.filter(i => i.email !== email), users: db.users.filter(u => !(u.role === "individual" && u.email === email)) }, `Removed individual ${email}`, `${email} removed.`, t);
    }
    case "addUserAsAdmin": {
      const [orgId, email, nm, roleArg] = args; if (!canManageCompany(me, orgId)) return deny;
      const o = db.orgs.find(x => x.id === orgId); const e = String(email || "").trim().toLowerCase();
      const wanted: Role = COMPANY_ROLES.includes(roleArg) ? roleArg : "member";
      if (!o) return no("AX-101", "Unknown company.");
      if (!o.domain) return no("AX-101", "Add the company's email domain first.");
      if (domainOf(e) !== o.domain) return no("AX-304", `Email must end in @${o.domain}.`);
      if (db.users.some(u => u.email === e)) return no(ERR.ALREADY_REGISTERED, "This email is already registered.");
      if (seatsUsedIn(db, orgId) >= o.seatLimit) return no(ERR.SEATS_FULL, `All ${o.seatLimit} seats are used. Remove someone first.`);
      if (wanted === "main" && adminsOf(db, orgId).length >= settingsOf(db).maxAdmins) return no("AX-110", `A company can have up to ${settingsOf(db).maxAdmins} admins.`);
      const user: User = { id: uid(), email: e, name: String(nm || "").trim() || e, password: "demo1234", role: wanted, orgId, jobTitle: "", phone: "", linkedin: "", bio: "", interests: [], createdOn: today() };
      return ok({ ...db, users: [...db.users, user] }, `Added ${e} to ${o.name}`, `${e} added with the temporary password demo1234 — ask them to change it under My account → Password.`);
    }
    case "addStaff": {
      if (!sup) return deny;
      const e = String(args[0] || "").trim().toLowerCase(); const level: "super" | "content" = args[2] === "super" ? "super" : "content";
      const label = level === "super" ? "super admin" : "PIKOM admin";
      if (!EMAIL_RE.test(e)) return no("AX-305", "Enter a valid email address.");
      const existing = db.users.find(u => u.email === e);
      if (existing) {
        if (isStaff(existing) && !(level === "super" && !isSuper(existing))) return no(ERR.ALREADY_REGISTERED, "This person already has site admin access.");
        return ok({ ...db, users: db.users.map(u => u.id === existing.id ? (u.orgId || PAYING.includes(u.role) ? { ...u, staff: level } : { ...u, role: level === "super" ? "superadmin" : "contentadmin", staff: undefined }) : u) }, `Gave ${label} access to ${e}`, `${existing.name} is now a ${label}. They keep their existing account.`);
      }
      const user: User = { id: uid(), email: e, name: String(args[1] || "").trim() || e, password: "demo1234", role: level === "super" ? "superadmin" : "contentadmin", orgId: null, jobTitle: level === "super" ? "Super admin" : "PIKOM admin", phone: "", linkedin: "", bio: "", interests: [], createdOn: today() };
      return ok({ ...db, users: [...db.users, user] }, `Gave ${label} access to ${e}`, `${e} is now a ${label} (temporary password demo1234).`);
    }
    case "removeStaff": {
      if (!sup) return deny; const u = db.users.find(x => x.id === args[0]);
      if (!u || u.id === me.id) return no("AX-403", "You can't remove your own admin access.");
      const keepAccount = !!u.orgId || PAYING.includes(u.role);
      return ok({ ...db, users: keepAccount ? db.users.map(x => x.id === u.id ? { ...x, staff: undefined } : x) : db.users.filter(x => x.id !== u.id) }, `Removed site admin access for ${u.email}`, keepAccount ? `${u.name} keeps their member account.` : undefined);
    }
    case "postJob": {
      if (!canPostJob(me)) return no("AX-403", "Jobs are posted by company admins and company content admins.");
      const j = args[0] || {}; const myOrg = me.orgId ? db.orgs.find(o => o.id === me.orgId) : null;
      if (!String(j.title || "").trim()) return no("AX-501", "Add a job title.");
      return ok({ ...db, jobs: [{ ...j, id: uid(), orgId: me.orgId, company: myOrg ? myOrg.name.replace(/ Sdn\. Bhd\.| \(M\)/g, "") : me.name, postedOn: today(), postedBy: me.email, hidden: false }, ...db.jobs] }, `${me.name} posted job “${j.title}”`);
    }
    case "deleteJob": {
      const j = db.jobs.find(x => x.id === args[0]); if (!j) return no("AX-404", "Job not found.");
      if (!(staff || j.postedBy === me.email || canEditCompany(me, j.orgId))) return deny;
      const [d1, t] = bin(db, "job", j.title, j, j.orgId);
      return ok({ ...d1, jobs: db.jobs.filter(x => x.id !== j.id) }, `Closed job post “${j.title}”`, "Job post closed.", t);
    }
    case "toggleJob": {
      if (!staff) return deny;
      return ok({ ...db, jobs: db.jobs.map(j => j.id === args[0] ? { ...j, hidden: !j.hidden } : j) }, "Changed visibility of a job post");
    }
    case "postRfp": {
      if (!canPostRfp(me)) return no("AX-403", "RFPs are posted by company admins, company content admins and individual members.");
      const r = args[0] || {}; const myOrg = me.orgId ? db.orgs.find(o => o.id === me.orgId) : null;
      if (!String(r.title || "").trim()) return no("AX-501", "Add a title.");
      const poster = myOrg ? myOrg.name.replace(" Sdn. Bhd.", "") : me.name;
      const clean = pick<Rfp>(r, RFP_FIELDS);
      return ok({ ...db, rfps: [{ ...clean, title: String(r.title).trim(), id: uid(), orgId: me.orgId, buyer: String(r.buyer || "").trim() || poster, poster, sector: r.sector || "", type: r.type || "", budget: r.budget || "", closes: r.closes || "", description: r.description || "", contactEmail: r.contactEmail || me.email, status: "Open", postedOn: today(), postedBy: me.email, hidden: false } as Rfp, ...db.rfps] }, `${me.name} posted RFP “${r.title}”`);
    }
    case "updateRfp": {
      const r = db.rfps.find(x => x.id === args[0]); if (!r) return no("AX-404", "RFP not found.");
      if (!(staff || r.postedBy === me.email || canEditCompany(me, r.orgId))) return deny;
      const p = pick<Rfp>(args[1], RFP_FIELDS);
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
      if (!staff) return deny; const ev = db.events.find(e => e.id === args[0]); if (!ev) return no("AX-404", "Event not found.");
      const [d1, t] = bin(db, "event", ev.title, ev);
      return ok({ ...d1, events: db.events.filter(e => e.id !== ev.id) }, `Deleted event “${ev.title}”`, "Event deleted.", t);
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
      if (!staff) return deny; const c = db.content.find(x => x.id === args[0]); if (!c) return no("AX-404", "Item not found.");
      const [d1, t] = bin(db, "content", c.title, c);
      return ok({ ...d1, content: db.content.filter(x => x.id !== c.id) }, `Deleted “${c.title}”`, "Item deleted.", t);
    }
    case "saveAnnouncement": {
      if (!staff) return deny; const a: Announcement = args[0];
      return ok({ ...db, announcements: db.announcements.some(x => x.id === a.id) ? db.announcements.map(x => x.id === a.id ? a : x) : [{ ...a, id: a.id || uid() }, ...db.announcements] }, "Updated announcement");
    }
    case "deleteAnnouncement": {
      if (!staff) return deny;
      return ok({ ...db, announcements: db.announcements.filter(a => a.id !== args[0]) }, "Deleted announcement");
    }
    case "restore": {
      const t = (db.trash || []).find(x => x.id === args[0]); if (!t) return no("AX-404", "This item can no longer be restored.");
      const allowed = sup || (t.kind === "user" ? canManageCompany(me, t.orgId) : t.kind === "job" ? (staff || canEditCompany(me, t.orgId) || t.data.postedBy === me.email) : (t.kind === "event" || t.kind === "content") ? staff : false);
      if (!allowed) return deny;
      let d: DB = { ...db, trash: (db.trash || []).filter(x => x.id !== t.id) };
      const has = (arr: { id: string }[], id: string) => arr.some(x => x.id === id);
      if (t.kind === "user") {
        const u = t.data.user as User;
        if (d.users.some(x => x.email === u.email)) return no("AX-103", "Someone has registered with this email since. It can't be restored.");
        const o = u.orgId ? d.orgs.find(x => x.id === u.orgId) : null;
        if (u.orgId && !o) return no("AX-404", "The company no longer exists.");
        if (o && seatsUsedIn(d, o.id) >= o.seatLimit) return no(ERR.SEATS_FULL, "All seats are now taken. Free a seat first.");
        const regs = t.data.regs as { eventId: string; reg: Registration }[];
        d = { ...d, users: [...d.users, u], events: d.events.map(e => { const r = regs.find(x => x.eventId === e.id); return r && !e.registrations.some(x => x.userId === u.id) ? { ...e, registrations: [...e.registrations, { ...r.reg, status: e.capacity != null && eventCounts(e).confirmed >= e.capacity ? "waitlist" : r.reg.status }] } : e; }) };
      } else if (t.kind === "org") {
        const o = t.data.org as Org;
        if (o.domain && d.orgs.some(x => x.domain === o.domain)) return no("AX-303", "Another company now uses this domain.");
        d = { ...d, orgs: [o, ...d.orgs], users: [...d.users, ...(t.data.users as User[]).filter(u => !d.users.some(x => x.email === u.email))], jobs: [...(t.data.jobs as Job[]).filter(j => !has(d.jobs, j.id)), ...d.jobs] };
      } else if (t.kind === "individual") {
        if (d.individuals.some(i => i.email === t.data.ind.email)) return no("AX-303", "This email is whitelisted again already.");
        d = { ...d, individuals: [t.data.ind, ...d.individuals], users: [...d.users, ...(t.data.users as User[]).filter(u => !d.users.some(x => x.email === u.email))] };
      } else if (t.kind === "event") { if (!has(d.events, t.data.id)) d = { ...d, events: [t.data, ...d.events] }; }
      else if (t.kind === "content") { if (!has(d.content, t.data.id)) d = { ...d, content: [t.data, ...d.content] }; }
      else if (t.kind === "job") { if (!has(d.jobs, t.data.id)) d = { ...d, jobs: [t.data, ...d.jobs] }; }
      return ok(d, `Restored ${t.label}`, `${t.label} restored.`);
    }
    case "importOrgs": {
      if (!sup) return deny;
      const rows = (args[0] || []) as { name: string; domain: string; type: MemberType; mainEmail: string; pikomNo: string; renewal: string; category: string; about: string }[];
      let d = db; let added = 0, updated = 0; const skipped: string[] = [];
      for (const r of rows.slice(0, 1000)) {
        const name = String(r.name || "").trim(); const dom = String(r.domain || "").trim().toLowerCase().replace(/^@/, "");
        const main = String(r.mainEmail || "").trim().toLowerCase();
        if (!name) { skipped.push("(row with no name)"); continue; }
        if (dom && (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom) || PUBLIC_EMAIL_DOMAINS.includes(dom))) { skipped.push(`${name}: invalid domain`); continue; }
        if (main && dom && domainOf(main) !== dom) { skipped.push(`${name}: admin email not on @${dom}`); continue; }
        const byDomain = dom ? d.orgs.find(o => o.domain === dom) : undefined;
        const byName = d.orgs.find(o => o.name.toLowerCase() === name.toLowerCase());
        const target = byDomain || byName;
        if (target) {
          if (byDomain && byName && byDomain.id !== byName.id) { skipped.push(`${name}: domain already used by ${byDomain.name}`); continue; }
          d = { ...d, orgs: d.orgs.map(o => o.id !== target.id ? o : { ...o, domain: o.domain || dom, mainEmail: o.mainEmail || main, pikomNo: r.pikomNo || o.pikomNo, renewal: r.renewal || o.renewal, type: r.type || o.type, profile: { ...o.profile, category: o.profile.category || r.category || "", about: o.profile.about || r.about || "" } }) };
          updated++;
        } else {
          const o: Org = { id: uid() || rand(), domain: dom, name, type: r.type || "Ordinary Member", pikomNo: r.pikomNo || "", mainEmail: main, seatLimit: settingsOf(d).defaultSeatLimit, status: "active", whitelistedOn: today(), renewal: r.renewal || "", profile: { ...emptyProfile(), category: r.category || "", about: r.about || "" } };
          d = { ...d, orgs: [...d.orgs, o] }; added++;
        }
      }
      return ok(d, `Imported companies: ${added} added, ${updated} updated${skipped.length ? `, ${skipped.length} skipped` : ""}`, `${added} added, ${updated} updated${skipped.length ? `. Skipped: ${skipped.slice(0, 8).join("; ")}${skipped.length > 8 ? "…" : ""}` : "."}`);
    }
    case "updateSettings": {
      if (!sup) return deny;
      const p = pick<Settings>(args[0], ["memberCompaniesStat", "companiesStat", "secretariatEmail", "secretariatPhone", "defaultSeatLimit", "maxAdmins"]);
      if (p.maxAdmins !== undefined && !(Number(p.maxAdmins) >= 1 && Number(p.maxAdmins) <= 5)) return no("AX-120", "Admins per company must be between 1 and 5.");
      if (p.defaultSeatLimit !== undefined && !(Number(p.defaultSeatLimit) >= 1 && Number(p.defaultSeatLimit) <= 50)) return no("AX-120", "Default seats must be between 1 and 50.");
      return ok({ ...db, settings: { ...settingsOf(db), ...p, ...(p.maxAdmins !== undefined ? { maxAdmins: Number(p.maxAdmins) } : {}), ...(p.defaultSeatLimit !== undefined ? { defaultSeatLimit: Number(p.defaultSeatLimit) } : {}) } }, "Updated site settings", "Site settings saved.");
    }
    case "resetPassword": {
      if (!sup) return deny; const u = db.users.find(x => x.id === args[0]); if (!u) return no("AX-404", "Person not found.");
      return ok({ ...db, users: db.users.map(x => x.id === u.id ? { ...x, password: "demo1234", sv: (x.sv || 0) + 1 } : x) }, `Reset password for ${u.email}`, `${u.name}'s password is now demo1234. Ask them to change it after signing in.`);
    }
    case "setSpotlight": {
      if (!staff) return deny;
      return ok({ ...db, spotlight: (args[0] || []).slice(0, 4) }, "Updated member spotlight");
    }
  }
  return no("AX-400", "Unknown action.");
}

const noPw = (u: User) => ({ ...u, password: "" });
function scrubTrash(t: TrashItem) {
  if (t.kind === "user") return { ...t.data, user: noPw(t.data.user) };
  if (t.kind === "org" || t.kind === "individual") return { ...t.data, users: (t.data.users as User[]).map(noPw) };
  return t.data;
}
/** What a given viewer is allowed to receive. Passwords never leave the server. */
export function viewFor(db: DB, me: User | null): DB {
  const staff = isStaff(me), sup = isSuper(me), full = fullAccess(me);
  const users = db.users.map(u => {
    const { password, ...rest } = u; void password;
    if (u.id === me?.id || sup) return { ...rest, password: "" };
    if (full) return { ...rest, password: "", phone: u.showPhone === false ? "" : u.phone, linkedin: u.showLinkedin === false ? "" : u.linkedin };
    return { ...rest, password: "", email: "", name: "PIKOM member", phone: "", linkedin: "", bio: "", jobTitle: "", interests: [], company: "", lastSignIn: undefined };
  });
  const mine = (by: string) => !!me && by === me.email;
  return {
    ...db,
    users,
    individuals: sup ? db.individuals : db.individuals.filter(i => i.email === me?.email),
    log: sup ? db.log : [],
    settings: settingsOf(db),
    trash: sup ? (db.trash || []).map(t => ({ ...t, data: scrubTrash(t) })) : staff ? (db.trash || []).filter(t => t.kind === "event" || t.kind === "content" || t.kind === "job") : [],
    orgs: full ? db.orgs : db.orgs.map(o => ({ ...o, mainEmail: "", pikomNo: "", profile: { ...o.profile, phone: "", linkedin: "" } })),
    jobs: db.jobs.filter(j => !j.hidden || staff || mine(j.postedBy)).map(j => full ? j : { ...j, salary: "", description: "", applyEmail: "", linkedinUrl: "", postedBy: "" }),
    rfps: db.rfps.filter(r => !r.hidden || staff || mine(r.postedBy)).map(r => full ? r : { ...r, budget: "", description: "", contactEmail: "", postedBy: "", summary: "", ref: "", docRef: "", emd: "", sourceUrl: "", financier: "" }),
    events: db.events.filter(e => e.status !== "Draft" || staff).map(e => {
      const reg = e.registrations.find(r => r.userId === me?.id && r.status === "confirmed");
      return staff || reg ? e : { ...e, link: "" };
    }),
    content: db.content.filter(c => c.published || staff),
    announcements: db.announcements.filter(a => a.active || staff),
  };
}
