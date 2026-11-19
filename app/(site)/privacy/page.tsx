export const metadata = {title: 'Privacy'};
export default function Privacy() {
  return <article className="container about-page"><span className="eyebrow">YOUR INFORMATION</span><h1>Your privacy,<br/><i>kept simple.</i></h1>
    <h2>Public browsing</h2><p>LearnWithRich serves published projects, articles, courses and other resources from its own PostgreSQL catalog. Search and browsing do not require an account. Bookmarks are stored in local browser storage and can be removed by clearing this site's storage.</p>
    <h2>Creator studio</h2><p>The creator studio uses Google sign-in through Better Auth. Account identity, OAuth session records, and creator resources are stored in LearnWithRich's database. Studio access also requires the creator's authenticator MFA. The public site does not offer learner accounts, purchases or payment processing in this release.</p>
    <h2>Files and external services</h2><p>Public resource pages can link to hosted files and images supplied by the creator. Those file hosts may have their own privacy practices. Google provides the studio sign-in interface; fonts and site assets are served by LearnWithRich.</p>
    <h2>Newsletter and contact</h2><p>The newsletter form is not connected and does not submit your email. For questions about the website or creator studio, use the contact links on the About page.</p>
  </article>;
}
