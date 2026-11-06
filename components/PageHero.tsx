export function PageHero({ title, lead }: { title: string; lead: string }) {
  return <section className="hero"><div className="wrap stack" style={{ padding: "44px 24px", gap: 10 }}><h1 className="h1">{title}</h1><p className="lead">{lead}</p></div></section>;
}
