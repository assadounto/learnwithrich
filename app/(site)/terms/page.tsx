import Link from 'next/link';

export const metadata = {title: 'Terms of use', description: 'Terms for using LearnWithRich resources, accounts, purchases, and services.', alternates: {canonical: '/terms'}};

export default function Terms() {
  return <article className="ref-container site-policy">
    <header><h1>Terms of use</h1><p>These terms cover your use of LearnWithRich, operated by Richmond Adu-Kyere. The <Link href="/privacy">privacy notice</Link> explains how personal information is handled.</p></header>

    <h2>Accounts and access</h2>
    <p>You can browse public material without signing in. Some resources and features require a learner account or a purchase. Keep your sign-in secure and contact the studio if you suspect unauthorized use. Please respect access controls and other users’ accounts and data.</p>

    <h2>Resources and licenses</h2>
    <p>Use resources under the license or usage terms shown with each resource. If no license is stated, access lets you use the resource for your own learning. It does not transfer copyright or grant permission to redistribute, resell, or publish the files. Third-party code, media, and linked resources may have separate licenses.</p>

    <h2>Purchases and payments</h2>
    <p>Review the resource, price, and currency before paying. Paystack processes payments and LearnWithRich grants account access after payment is confirmed. Contact the studio with your purchase reference if you have a billing or access problem. Refund requests are handled under any terms provided with the purchase and applicable consumer law.</p>

    <h2>Service requests and revisions</h2>
    <p>Sending a project brief is a request for review. Work proceeds under the scope and terms stated in an accepted quote, including deliverables, pricing, and any included revisions. Additional revisions may carry the price shown in the quote or your account. Review deliverables in the account area and provide feedback there. Rights to custom deliverables follow the terms agreed for that project.</p>

    <h2>Community submissions</h2>
    <p>Only submit material you have the right to share. Sending a review, guest book entry, or optional photo gives LearnWithRich permission to display that submission if approved. The studio may decline or remove spam, abusive content, personal information shared without permission, and misleading or unlawful material. Service briefs and files are handled privately as described in the privacy notice.</p>

    <h2>Educational material</h2>
    <p>Projects, examples, and guides are for learning. Check instructions, components, and conditions for your own build and follow suitable safety practices. External websites are responsible for their own content and services. These terms do not limit rights you have under applicable law.</p>

    <h2>Questions and support</h2>
    <p>Use the <Link href="/about#contact">contact links on the About page</Link> for questions about these terms, a purchase, or a service.</p>
  </article>;
}
