import Link from 'next/link';

export const metadata = {title: 'Privacy notice', description: 'How LearnWithRich handles account, payment, community, and newsletter information.', alternates: {canonical: '/privacy'}};

export default function Privacy() {
  return <article className="ref-container site-policy">
    <header><h1>Privacy notice</h1><p>How LearnWithRich, operated by Richmond Adu-Kyere, handles personal information. See also the <Link href="/terms">terms of use</Link>.</p></header>

    <h2>Browsing, cookies, and accounts</h2>
    <p>You can browse public resources without an account. Your browser can remember saved resources locally. When you sign in with Google, LearnWithRich receives your name, email address, and available profile image and uses them to manage your session, saved items, purchases, and service requests. A session cookie keeps you signed in. Creator accounts also use authenticator verification. Hosting infrastructure may record request metadata such as IP address, time, and requested URL to operate and protect the site.</p>

    <h2>Site analytics</h2>
    <p>LearnWithRich counts views of public pages to understand which learning materials people use. Reports contain daily totals by page, broad screen size, referring website, and country when the hosting network supplies a country code. Analytics stores no account identifiers, IP addresses, URL query strings, or full referrer URLs. A flag in browser session storage counts the start of a visit. If your browser sends Do Not Track or Global Privacy Control, the site skips analytics.</p>

    <h2>Payments, quotes, and project files</h2>
    <p>Paystack processes resource and service payments. LearnWithRich stores purchase or project references, amounts, currency, and payment status, and does not receive your full card number. When you request a service, your contact details, written brief or voice note, files, quote, and revision history are used to review and deliver the work. If you choose to record a voice note, recording starts after you grant microphone access. Audio is sent only when you submit the request. We use your last request’s phone number to prefill the form for you. Service request information and files are available to the requester and authorized studio operators. Private files are stored with an S3-compatible provider and served through time-limited links after an access check.</p>

    <h2>Reviews and guest book</h2>
    <p>If approved for publication, your displayed name, message, rating where applicable, and any optional title, country, or photo can be shown publicly. A contact email submitted with a guest book entry stays private. Keep passwords, personal documents, and confidential project information out of public submissions. Submission checks may use a hashed IP address to limit abuse.</p>

    <h2 id="newsletter">Newsletter</h2>
    <p>If you subscribe, LearnWithRich saves your email address and signup time to manage the newsletter. The studio may record when the address was reviewed or verified. The signup form may also store a hashed IP address for abuse prevention. Submitting the form records a pending signup. It does not send a confirmation email or verify your mailbox. You can ask to be removed using the contact details below.</p>

    <h2>Service providers and external links</h2>
    <p>Google supports sign-in, Paystack handles payments, and hosting and storage providers run the site and store files. These providers process information needed to deliver those services. External links and embedded video can take you to third-party services, whose own privacy terms apply.</p>

    <h2>Retention and your choices</h2>
    <p>Information is kept as needed to provide your account, resources, payments, and services, respond to disputes, protect the site, or meet legal and accounting obligations. You can ask for access to your personal information, a correction, or deletion, and request removal from the newsletter or of a community post. Some transaction records may need to be retained after a request. The studio may need to confirm your identity before acting on a request.</p>

    <h2>Contact</h2>
    <p>Use the <Link href="/about#contact">contact links on the About page</Link> for privacy requests. Include enough information to identify the account or signup and avoid sending passwords or payment card details.</p>
  </article>;
}
