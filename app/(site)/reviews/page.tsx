import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {ArrowLeft, ArrowUpRight, Quote, Star} from 'lucide-react';
import {CommunityReviewCards, ReviewForm} from '@/components/community-home';
import {database} from '@/lib/server/database';

export const metadata: Metadata = {title: 'Community reviews', description: 'Read what people say about LearnWithRich and share your experience.', alternates: {canonical: '/reviews'}};
export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const reviews = await database().review.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, select: {id: true, displayName: true, title: true, country: true, imageAssetId: true, message: true, rating: true, createdAt: true}});
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;
  return <div className="community-page ref-container">
    <Link href="/" className="community-back-link"><ArrowLeft size={15}/>Back to LearnWithRich</Link>
    <section className="community-testimonial-panel community-review-page-panel" aria-labelledby="reviews-list-title"><header className="community-testimonial-heading"><h1 id="reviews-list-title">WHAT ARE<br/>PEOPLE SAYING?</h1><p>Honest reflections from people who have connected, built, worked, or shared an idea with LearnWithRich.</p><div className="community-page-count"><span className="review-stars" aria-label={reviews.length ? `Average rating ${averageRating.toFixed(1)} out of 5` : 'No ratings yet'}>{Array.from({length:5},(_,index)=><Star key={index} size={15} fill={index<Math.round(averageRating)?'currentColor':'none'}/>)}</span><strong>{reviews.length ? averageRating.toFixed(1) : '—'}</strong><span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></div></header>
      {reviews.length ? <CommunityReviewCards reviews={reviews}/> : <div className="community-testimonial-empty"><Quote size={24}/><p>Be the first to share your experience. Reviews appear after approval.</p></div>}
      <div className="community-testimonial-actions"><span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} · {reviews.length ? `Average rating ${averageRating.toFixed(1)} out of 5` : 'Be the first to share your experience'}</span><div><Link href="#share" className="button button-dark">Add a review <ArrowUpRight size={15}/></Link></div></div>
    </section>
    <aside className="community-page-form-card review-page-form"><span className="maker-kicker">YOUR EXPERIENCE</span><h2 id="share-heading">Add a review</h2><p>Share what you think about the work, site, or an experience with LearnWithRich. Your review will appear after approval.</p><ReviewForm/></aside>
  </div>;
}
