export const metadata = {title: 'Privacy', alternates: {canonical: '/privacy'}};
export default function Privacy() {
  return <article className="container about-page"><span className="eyebrow">YOUR INFORMATION</span><h1>Your privacy,<br/><i>kept simple.</i></h1>
    <h2>Public browsing</h2><p>LearnWithRich serves published resources from its PostgreSQL catalog. Search and browsing do not require an account. You can save resources in your browser or, when signed in, sync them to your learner account.</p>
    <h2>Accounts and purchases</h2><p>Google sign-in creates a learner account used to keep saved resources and completed purchases together. Paystack processes payments; LearnWithRich stores purchase references and amounts, not card numbers. The owner studio also uses Google sign-in and requires authenticator MFA.</p>
    <h2>Files and external services</h2><p>Creator uploads are stored in a private S3-compatible bucket. Short-lived download links are issued after resource, account or purchase access is checked. Google provides sign-in; Paystack processes checkout; fonts and site assets are served by LearnWithRich.</p>
    <h2>Newsletter and contact</h2><p>The newsletter form is not connected and does not submit your email. For questions about the website or creator studio, use the contact links on the About page.</p>
  </article>;
}
