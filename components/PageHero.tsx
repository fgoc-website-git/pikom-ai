export function PageHero({ title, lead, children }: { title: string; lead: string; children?: React.ReactNode }) {
  return <section className="page-hero"><div className="wrap"><h1 className="h1">{title}</h1><p>{lead}</p>{children}</div></section>;
}
export function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
