// PIKOM AI Chapter (AI Xchange Malaysia) committee 2025/2026.
// People, order and photos: PIKOM "Malaysia AI 2026" members briefing (15 Oct 2026) committee slide — the latest line-up (Ritesh).
// Full names, Chair / Deputy Chair roles and companies: pikom.org.my/ai committee table (checked 23 Nov 2026).
export type CommitteeRole = "Chair" | "Deputy Chair" | "Committee" | "Advisor";
export interface CommitteeMember { name: string; role: CommitteeRole; org?: string; photo: string; }

export const COMMITTEE_TERM = "2025/2026";
export const COMMITTEE: CommitteeMember[] = [
  { name: "Alex Loh", role: "Chair", org: "Dynatrace Malaysia", photo: "/committee/alex-loh.jpg" },
  { name: "Akhil Gupta", role: "Deputy Chair", org: "Talbotiq Technologies", photo: "/committee/akhil-gupta.jpg" },
  { name: "Johary Mustapha", role: "Deputy Chair", org: "Forest Interactive", photo: "/committee/johary-mustapha.jpg" },
  { name: "Chan Tzu Kit", role: "Committee", photo: "/committee/chan-tzu-kit.jpg" },
  { name: "Wong Chee Voon", role: "Committee", org: "Maxis", photo: "/committee/chee-voon.jpg" },
  { name: "Neil Tomkinson", role: "Committee", org: "U Mobile", photo: "/committee/neil-tomkinson.jpg" },
  { name: "Datuk Alvin Yuen", role: "Committee", org: "Isatec", photo: "/committee/alvin-yuen.jpg" },
  { name: "Datuk Tan Seng Kit", role: "Committee", org: "Strateq", photo: "/committee/seng-kit.jpg" },
  { name: "James Lim", role: "Committee", photo: "/committee/james-lim.jpg" },
  { name: "TS Koay", role: "Committee", org: "Dell Global Business Centre", photo: "/committee/ts-koay.jpg" },
  { name: "JH Soong", role: "Committee", org: "VSTECS Berhad", photo: "/committee/jh-soong.jpg" },
  { name: "Ong Chin Seong", role: "Committee", org: "Powerware Systems", photo: "/committee/cs-ong.jpg" },
  { name: "Keane Leong", role: "Committee", org: "Bridgenet", photo: "/committee/keane-leong.jpg" },
  { name: "Joo Swee Keong", role: "Committee", org: "Hexphyre Technologies", photo: "/committee/sk-joo.jpg" },
  { name: "Dr Dzaharudin Mansor", role: "Committee", photo: "/committee/dzahar.jpg" },
  { name: "Chan Tze Ming", role: "Committee", org: "Glocomp Systems", photo: "/committee/tze-ming-chan.jpg" },
];
