import type {Metadata} from 'next';
import {ArrowRight, AudioLines, CircuitBoard, Code2, GraduationCap, MessagesSquare, Presentation} from 'lucide-react';
import Link from '@/components/navigation-link';
import {ServiceRequestForm} from '@/components/service-request-form';
import {serviceOfferings} from '@/lib/service-offerings';
import {database} from '@/lib/server/database';
import {currentUser} from '@/lib/server/identity/current-user';
import {publishedIdea} from '@/lib/server/project-ideas';

export const metadata: Metadata = {
  title: 'Work with Richmond',
  description: 'Request electrical engineering, software, project guidance, or a private one-on-one teaching or conversation session.',
  alternates: {canonical: '/services/request'},
};
export const dynamic = 'force-dynamic';
const featured = [
  {offer: serviceOfferings[0], Icon: CircuitBoard},
  {offer: serviceOfferings[1], Icon: Presentation},
  {offer: serviceOfferings[2], Icon: MessagesSquare},
  {offer: serviceOfferings[4], Icon: Code2},
  {offer: serviceOfferings[5], Icon: GraduationCap},
];

export default async function ServiceRequestPage({searchParams}: {searchParams: Promise<{idea?: string; service?: string}>}) {
  const params = await searchParams;
  const [user, idea] = await Promise.all([currentUser(), publishedIdea(params.idea)]);
  const latest = user ? await database().serviceRequest.findFirst({
    where: {userId: user.id, requesterPhone: {not: ''}},
    orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
    select: {requesterPhone: true},
  }) : null;
  const service = serviceOfferings.find(item => item.id === params.service)?.id ?? (idea ? 'CAPSTONE' : '');
  const query = new URLSearchParams();
  if (idea) query.set('idea', idea.slug);
  if (service) query.set('service', service);
  const next = query.size ? `/services/request?${query}` : '/services/request';
  return <div className="service-request-page service-studio-request ref-container">
    <header className="service-page-hero service-studio-hero">
      <div><span className="maker-kicker">WORK WITH RICHMOND</span>
        <h1>Build something. <i>Learn something.</i></h1>
        <p>Get help with an engineering or software project, or book time to talk through an idea or learn a topic one on one.</p>
        <a className="button button-dark" href="#request-brief">Start a request <ArrowRight size={17}/></a>
      </div>
      <div className="service-studio-steps"><h2>How it works</h2><ol><li>Send a written brief or voice note.</li><li>We agree on the scope and price.</li><li>Follow the request in your account.</li></ol></div>
    </header>
    <div className="service-request-layout">
      <aside className="service-offerings" aria-labelledby="offerings-heading">
        <h2 id="offerings-heading">What I can help with</h2>
        {featured.map(({offer, Icon}) => {
          const params = new URLSearchParams(query);
          params.set('service', offer.id);
          return <article key={offer.id}><Icon size={21} aria-hidden="true"/><div><Link href={`/services/request?${params}#request-brief`}><strong>{offer.label}</strong><ArrowRight size={13}/></Link><p>{offer.detail}</p></div></article>;
        })}
        <p className="service-ethics-note">Academic support means guidance and feedback. You remain the author of your work.</p>
      </aside>
      <section id="request-brief" aria-label="Request form"><ServiceRequestForm key={idea?.slug ?? 'general'}
        profile={user ? {name: user.name, email: user.email, phone: latest?.requesterPhone} : null}
        service={service} next={next} idea={idea ? {title: idea.title} : undefined}/></section>
    </div>
    <div className="service-studio-privacy"><AudioLines size={17} aria-hidden="true"/> Your brief is visible to you and the private service workspace.</div>
  </div>;
}
