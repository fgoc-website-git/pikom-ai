import { PageHero } from "@/components/PageHero";
export default function Privacy() {
  return (<>
    <PageHero title="Privacy notice" lead="Draft for PIKOM review — to be finalised by the secretariat in line with the Personal Data Protection Act 2010." />
    <section className="wrap section card stack" style={{ gap: 12, marginTop: 24 }}>
      <p><b>What we collect:</b> name, work email, job title, optional phone and LinkedIn URL, company profile details, and sign-in activity.</p>
      <p><b>Why:</b> to verify you belong to a PIKOM member, to run the member directory and networking features, and to keep the platform secure.</p>
      <p><b>Who sees it:</b> your name, job title and company are visible to signed-in members. Your main account holder and the PIKOM secretariat can see who from your company has registered. You can hide your profile in My account.</p>
      <p><b>Your rights:</b> access, correct or delete your data by contacting the PIKOM secretariat at [email].</p>
      <p className="muted small">[Retention period, data processor (hosting) details and cross-border transfer statement to be confirmed.]</p>
    </section>
  </>);
}
