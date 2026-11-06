import type { DB, Org } from "./store";

export interface Company { slug: string; name: string; category: string; tagline: string; capabilities: string[]; logo?: string; org: Org; people: number; }
export const slugify = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/sdn\.?|bhd\.?|berhad/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const shortName = (s: string) => s.replace(/ Sdn\. Bhd\.?$| Sdn Bhd$| \(M\)/g, "").trim();

/** The member directory = every company the secretariat has whitelisted. */
export function companies(db: DB): Company[] {
  return db.orgs.map(o => ({
    slug: slugify(o.name), name: shortName(o.name), org: o, category: o.profile.category, tagline: o.profile.about || "Profile being completed.",
    capabilities: o.profile.capabilities, logo: o.profile.logo, people: db.users.filter(u => u.orgId === o.id).length,
  })).sort((a, b) => b.people - a.people || a.name.localeCompare(b.name));
}
