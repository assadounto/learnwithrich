import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {ArrowLeft, ArrowUpRight, MessageCircle, Star} from 'lucide-react';
import {ReviewForm} from '@/components/community-home';
import {database} from '@/lib/server/database';

export const metadata: Metadata = {title: 'Community reviews', description: 'Read what people say about LearnWithRich and share your experience.', alternates: {canonical: '/reviews'}};
export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const reviews = await database().review.findMany({where: {status: 'APPROVED'}, orderBy: {createdAt: 'desc'}, select: {id: true, displayName: true, title: true, country: true, imageAssetId: true, message: true, rating: true, createdAt: true}});
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;

  return <div className="community-page reviews-page ref-container">
    <Link href="/" className="community-back-link"><ArrowLeft size={15}/>Back to LearnWithRich</Link>
    <header className="community-page-heading">
      <span className="maker-kicker">COMMUNITY REVIEWS</span>
      <h1>What people are saying.</h1>
      <p>Honest reflections from people who have connected, built, worked, or shared an idea with LearnWithRich.</p>
      <div className="community-page-count">
        <span className="review-stars" aria-label={reviews.length ? `Average rating ${averageRating.toFixed(1)} out of 5` : 'No ratings yet'}>{Array.from({length: 5}, (_, index) => <Star key={index} size={15} fill={index < Math.round(averageRating) ? 'currentColor' : 'none'}/>)}</span>
        <strong>{reviews.length ? averageRating.toFixed(1) : '—'}</strong>
        <span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
      </div>
    </header>

    <div className="community-page-layout reviews-page-layout">
      <section className="community-page-form-card review-page-form" aria-labelledby="share-heading">
        <span className="maker-kicker">YOUR EXPERIENCE</span>
        <h2 id="share-heading">Add a review</h2>
        <p>Share what you think about the work, site, or an experience with LearnWithRich. Your review will appear after approval.</p>
        <ReviewForm/>
      </section>

      <section className="community-page-results" aria-labelledby="reviews-list-title">
        <header>
          <div><span className="maker-kicker">FROM THE COMMUNITY</span><h2 id="reviews-list-title">What people say</h2></div>
          <span>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
        </header>
        {reviews.length ? <div className="community-review-list">
          {reviews.map(review => <article className="community-review-card" key={review.id}>
            <div>
              <div className="community-review-person">
                {review.imageAssetId ? <img src={`/api/public-media/${review.imageAssetId}?width=96`} loading="lazy" decoding="async" alt="" width="38" height="38"/> : <span className="community-review-avatar" aria-hidden="true">{review.displayName.slice(0, 1).toUpperCase()}</span>}
                <div><strong>{review.displayName}</strong>{review.country && <small>{review.country}</small>}<time dateTime={review.createdAt.toISOString()}>{review.createdAt.toLocaleDateString('en-GH', {year: 'numeric', month: 'short', day: 'numeric'})}</time></div>
              </div>
              <div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{Array.from({length: 5}, (_, star) => <Star key={star} size={14} fill={star < review.rating ? 'currentColor' : 'none'}/>)}</div>
              {review.title && <h3 className="community-card-title">{review.title}</h3>}
              <blockquote>“{review.message}”</blockquote>
            </div>
          </article>)}
        </div> : <div className="community-page-empty"><MessageCircle size={24}/><h3>Be the first to share.</h3><p>There are no public reviews yet. Your experience could help someone take their next step.</p><Link href="#share" className="text-link">Write the first review <ArrowUpRight size={14}/></Link></div>}
      </section>
    </div>
  </div>;
}
