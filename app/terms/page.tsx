import { PageHero } from "@/components/PageHero";
export default function Terms() {
  return (<>
    <PageHero title="Terms of use" lead="Draft for PIKOM review." />
    <section className="wrap section card stack" style={{ gap: 12, marginTop: 24 }}>
      <p>AI Xchange is for PIKOM members. Accounts are personal — don't share your password. Company seats are managed by your company admin.</p>
      <p>Don't post misleading information, other people's personal data, or confidential client information. PIKOM may remove content or accounts that break these terms.</p>
      <p>Job posts and RFPs are the responsibility of the member who posts them. PIKOM does not take part in hiring or procurement decisions.</p>
      <p className="muted small">[Full terms to be confirmed by PIKOM.]</p>
    </section>
  </>);
}
