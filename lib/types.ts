export interface Category { id: string; label: string; color: string; count: number; }
export interface Engine   { id: string; label: string; color: string; phase: string; }
export interface Member   { id: number; name: string; cat: string; tagline: string; services: string[]; verified: boolean; featured?: boolean; engines?: string[]; zone?: string; mbm?: boolean; }
export interface RFP      { id: number; title: string; sector: string; budget: string; type: string; cat: string; posted: string; responses: number; urgent: boolean; source?: "industry"|"government"; engine?: string; }
export interface Article  { id: number; src: string; logo: string; color: string; title: string; desc: string; date: string; tag: string; url: string; min: number; essential?: boolean; }
export interface Job      { id: number; title: string; co: string; cat: string; type: string; loc: string; sal: string; posted: string; }
export interface Course   { id: number; title: string; provider: string; dur: string; cert: string; hrd: boolean; level: string; }
export interface Policy   { id: number; title: string; body: string; status: string; sc: string; due: string; urgent: boolean; desc: string; phase?: string; }
export interface Forum    { id: string; name: string; posts: number; members: number; last: string; hot: boolean; }
export interface PortalEvent { id: number; title: string; day: string; month: string; type: string; loc: string; }
export type View = "home"|"directory"|"marketplace"|"community"|"talent"|"policy"|"intelligence";
