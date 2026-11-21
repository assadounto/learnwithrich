import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {ArrowLeft, ArrowUpRight, MessageCircle} from 'lucide-react';
import {GuestbookForm} from '@/components/community-home';
import {database} from '@/lib/server/database';

export const metadata: Metadata = {title: 'Guest book', description: 'Leave a hello and read notes from the LearnWithRich community.', alternates: {canonical: '/guestbook'}};
export const dynamic = 'force-dynamic';

export default async function GuestbookPage() {
  const entries = await database().guestbookEntry.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, select: {id: true, name: true, message: true, createdAt: true}});
  return <div className="community-page ref-container">
    <Link href="/" className="community-back-link"><ArrowLeft size={15}/>Back to LearnWithRich</Link>
    <header className="community-page-heading"><span className="maker-kicker">OPEN TO EVERYONE</span><h1>Leave a little hello.</h1><p>The guest book is a place for a quick note, a kind word, or a thought about what you’re learning and making.</p><div className="community-page-count"><MessageCircle size={15}/>{entries.length} {entries.length === 1 ? 'note' : 'notes'} from the community</div></header>
    <div className="community-page-layout guestbook-page-layout"><section className="community-page-form-card"><span className="maker-kicker">ADD YOUR NOTE</span><h2>Sign the guest book</h2><p>Your message will appear here after a quick review.</p><GuestbookForm/></section>
      <section className="community-page-results" aria-labelledby="guestbook-entries-title"><header><div><span className="maker-kicker">COMMUNITY NOTES</span><h2 id="guestbook-entries-title">Words from visitors</h2></div><span>{entries.length} {entries.length === 1 ? 'note' : 'notes'}</span></header>
        {entries.length ? <div className="community-entry-list">{entries.map((entry,index)=><article className="community-entry-card" key={entry.id}><span className="community-entry-number">{String(entries.length-index).padStart(2,'0')}</span><div><blockquote>“{entry.message}”</blockquote><footer><strong>{entry.name}</strong><time dateTime={entry.createdAt.toISOString()}>{entry.createdAt.toLocaleDateString('en-GH',{year:'numeric',month:'short',day:'numeric'})}</time></footer></div></article>)}</div> : <div className="community-page-empty"><MessageCircle size={24}/><h3>Start the conversation.</h3><p>There are no public notes yet. Yours could be the first.</p><Link href="#sign" className="text-link">Write the first note <ArrowUpRight size={14}/></Link></div>}
      </section>
    </div>
  </div>;
}
