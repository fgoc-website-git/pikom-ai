// Every selection list that can reasonably be incomplete ends with "Other",
// which opens a free-text box (see SelectOther / MultiOther in components/ui.tsx).
export const OTHER = "Other";

export const CAPABILITIES = [
  "Generative AI / LLM", "AI agents & automation", "Computer vision", "NLP (Bahasa Malaysia)", "Speech & voice AI",
  "Predictive analytics", "MLOps", "Data engineering", "AI governance & safety", "AI cybersecurity",
  "AI infrastructure & compute", "AI training & upskilling", OTHER,
];

export const COMPANY_CATEGORIES = [
  "AI Platform", "SI & Solutions", "Cloud & Infra", "Cybersecurity", "Education & Talent", "Consultancy",
  "Enterprise (AI buyer)", "Government & Agency", "Telecom", "Research & University", OTHER,
];

export const INDUSTRIES_SERVED = [
  "Financial services", "Healthcare", "Manufacturing / E&E", "Public sector", "Retail & e-commerce",
  "Oil & gas / Energy", "Telecom", "Education", "Agriculture & plantation", "Logistics", OTHER,
];

export const STATES = [
  "Kuala Lumpur", "Selangor", "Putrajaya", "Penang", "Johor", "Perak", "Kedah", "Kelantan", "Terengganu",
  "Pahang", "Negeri Sembilan", "Melaka", "Perlis", "Sabah", "Sarawak", "Labuan", "Outside Malaysia",
];

export const EMPLOYEES = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+"];

export const JOB_CATEGORIES = [
  "Engineering", "Data & Analytics", "AI Research", "Product", "Sales & Pre-sales", "Consulting",
  "Graduate / Internship", OTHER,
];
export const WORK_MODES = ["On-site", "Hybrid", "Remote (Malaysia)", OTHER];
export const EXPERIENCE = ["Graduate / Intern", "Mid-level", "Senior / Lead", "Management"];
export const JOB_TYPES = ["Full-time", "Contract", "Part-time", "Internship", OTHER];

export const INTERESTS = [
  "Finding AI partners / vendors", "Selling AI solutions", "Hiring AI talent", "Policy & advocacy",
  "Research & insights", "Events & networking", "Funding & grants", OTHER,
];

export const MEMBER_TYPES = ["Ordinary Member", "Associate Member", "Overseas Member", "Individual Member"] as const;
export type MemberType = typeof MEMBER_TYPES[number];

export const SEAT_LIMIT = 5;

export const PUBLIC_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "proton.me", "protonmail.com", "ymail.com"];
