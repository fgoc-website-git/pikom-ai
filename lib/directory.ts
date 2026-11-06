import { MEMBERS, CATS } from "./data";
import type { DB, Org } from "./store";

export interface Company {
  slug: string; name: string; category: string; tagline: string; capabilities: string[]; logo?: string;
  org?: Org; onXchange: boolean;
}
export const slugify = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/sdn\.?|bhd\.?/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const key = (s: string) => slugify(s).split("-")[0];

export function companies(db: DB): Company[] {
  const out: Company[] = [];
  const used = new Set<string>();
  for (const o of db.orgs) {
    if (!o.profile.showInDirectory) { used.add(key(o.name)); continue; }
    const m = MEMBERS.find(x => key(x.name) === key(o.name));
    used.add(key(o.name));
    out.push({
      slug: slugify(o.name), name: o.name.replace(/ Sdn\. Bhd\.$/, ""), org: o, onXchange: true,
      category: o.profile.category || (m ? (CATS.find(c => c.id === m.cat)?.label || "") : ""),
      tagline: o.profile.about || m?.tagline || "Profile being completed.",
      capabilities: o.profile.capabilities.length ? o.profile.capabilities : m?.services || [],
      logo: o.profile.logo || m?.logo,
    });
  }
  for (const m of MEMBERS) {
    if (used.has(key(m.name))) continue;
    out.push({ slug: slugify(m.name), name: m.name, category: CATS.find(c => c.id === m.cat)?.label || "", tagline: m.tagline, capabilities: m.services, logo: m.logo, onXchange: false });
  }
  return out.sort((a, b) => Number(b.onXchange) - Number(a.onXchange) || a.name.localeCompare(b.name));
}
