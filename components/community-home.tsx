"use client";
import {SubmissionSuccessDialog} from './submission-success-dialog';
import {SelectMenu} from '@/components/selection-dialog';
import {publicImageAttributes} from '@/lib/image-sizes';
import Link from "@/components/navigation-link";
import { useState } from "react";
import {useSiteAccount} from "./site-account";
import { ArrowRight, ArrowUpRight, Heart, PenLine, Star } from "lucide-react";
import { COMMUNITY_COUNTRIES } from "@/lib/community-countries";

type Review = {
  id: string;
  displayName: string;
  title: string | null;
  country: string | null;
  imageAssetId: string | null;
  message: string;
  rating: number;
};

function CommunityProfileFields({ titleLabel }: { titleLabel: string }) {
  return (
    <>
      <label>
        {titleLabel} <span>optional</span>
        <input name="title" maxLength={120} placeholder="A short headline" />
      </label>
      <label>
        Country <span>optional</span>
        <SelectMenu name="country" defaultValue="">
          <option value="">Prefer not to say</option>
          {COMMUNITY_COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </SelectMenu>
      </label>
      <label className="community-image-field">
        Photo <span>optional · JPG, PNG or WebP · max 2 MB</span>
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
        />
        <small>
          Your photo appears only after your note or review is approved.
        </small>
      </label>
    </>
  );
}

export function GuestbookForm() {
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [confirmationOpen, setConfirmationOpen] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    const form = event.currentTarget,
      values = new FormData(form);
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        body: values,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save your note.");
      setNotice("Your guest book entry is awaiting review.");
      setConfirmationOpen(true);
      form.reset();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not save your note.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      id="sign"
      className="community-form guestbook-form"
      onSubmit={submit}
      encType="multipart/form-data"
    >
      <div className="community-form-pair">
        <label>
          Your name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="How should we call you?"
          />
        </label>
        <label>
          Email <span>optional, stays private</span>
          <input
            name="email"
            type="email"
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
      </div>
      <CommunityProfileFields titleLabel="Note title" />
      <label>
        Your note
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={800}
          rows={4}
          placeholder="Share a thought, a hello, or what you’re making…"
        />
      </label>
      <label className="community-honeypot" aria-hidden="true">
        Leave this empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="community-form-foot">
        <small>Your note is reviewed before it appears publicly.</small>
        <button className="button button-dark" type="submit" disabled={busy}>
          <PenLine size={15} />
          {busy ? "Sending…" : "Sign the guest book"}
        </button>
      </div>
      {confirmationOpen && <SubmissionSuccessDialog title="Thanks for signing the guest book" description="Your note was received and will appear in the guest book after it’s approved." onDismiss={() => setConfirmationOpen(false)}/>}
      {notice && !confirmationOpen && (
        <p role="status" className="community-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </form>
  );
}

export function ReviewForm() {
  const account = useSiteAccount();
  const [name, setName] = useState<string>(),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [confirmationOpen, setConfirmationOpen] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    const formElement = event.currentTarget,
      form = new FormData(formElement);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save your review.");
      setNotice("Your review is awaiting approval.");
      setConfirmationOpen(true);
      formElement.reset();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save your review.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (account === undefined)
    return <p className="community-muted">Checking sign-in…</p>;
  if (!account)
    return (
      <p className="community-signin-note">
        Want to leave a review?{" "}
        <Link href={`/signin?next=${encodeURIComponent("/reviews#share")}`}>
          Sign in to your account <ArrowUpRight size={14} />
        </Link>
      </p>
    );
  return (
    <form
      id="share"
      className="community-form review-form"
      onSubmit={submit}
      encType="multipart/form-data"
    >
      <label>
        Your name
        <input
          name="displayName"
          value={name ?? account.name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={100}
        />
      </label>
      <CommunityProfileFields titleLabel="Review title" />
      <label>
        Your review
        <textarea
          name="message"
          required
          minLength={15}
          maxLength={1000}
          rows={5}
          placeholder="What would you like others to know about your experience with LearnWithRich?"
        />
      </label>
      <label>
        Rating
        <SelectMenu name="rating" defaultValue="5">
          <option value="5">★★★★★ — Excellent</option>
          <option value="4">★★★★ — Very good</option>
          <option value="3">★★★ — Good</option>
          <option value="2">★★ — Fair</option>
          <option value="1">★ — Needs work</option>
        </SelectMenu>
      </label>
      <div className="community-form-foot">
        <small>
          Reviews appear after approval. You can update yours by submitting
          again.
        </small>
        <button type="submit" className="button button-dark" disabled={busy}>
          <Heart size={15} />
          {busy ? "Sending…" : "Share a review"}
        </button>
      </div>
      {confirmationOpen && <SubmissionSuccessDialog title="Review submitted" description="Thanks for sharing your experience. Your review will appear on the site after it’s approved." onDismiss={() => setConfirmationOpen(false)}/>}
      {notice && !confirmationOpen && (
        <p role="status" className="community-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="community-error">
          {error}
        </p>
      )}
    </form>
  );
}

export function CommunityReviewCards({ reviews }: { reviews: Review[] }) {
  return (
    <div
      className="community-testimonial-grid"
      role="list"
      aria-label="Reviews from the LearnWithRich community"
    >
      {reviews.map(review => (
        <article className="community-testimonial-card" role="listitem" key={review.id}>
          <div
            className="review-stars"
            aria-label={`${review.rating} out of 5 stars`}
          >
            {Array.from({ length: 5 }, (_, star) => (
              <Star
                key={star}
                size={14}
                fill={star < review.rating ? "currentColor" : "none"}
              />
            ))}
          </div>
          {review.title && (
            <p className="community-testimonial-title">{review.title}</p>
          )}
          <blockquote>“{review.message}”</blockquote>
          <footer>
            {review.imageAssetId ? (
              <img className="community-testimonial-avatar" {...publicImageAttributes(`/api/public-media/${review.imageAssetId}`, [96], "40px")} decoding="async" alt="" width="40" height="40" loading="lazy"/>
            ) : (
              <span className="community-testimonial-avatar" aria-hidden="true">{review.displayName.slice(0, 1).toUpperCase()}</span>
            )}
            <span>
              <strong>{review.displayName}</strong>
              {review.country && <small>{review.country}</small>}
            </span>
          </footer>
        </article>
      ))}
    </div>
  );
}

export function CommunityHome({ reviews }: { reviews: Review[] }) {
  return (
    <section className="community-home" aria-labelledby="community-title">
      <div className="ref-container">
        <div className="community-testimonial-panel">
          <header className="community-testimonial-heading">
            <h2 id="community-title">What are people saying?</h2>
          </header>
          {reviews.length ? (
            <CommunityReviewCards reviews={reviews.slice(0, 4)} />
          ) : (
            <div className="community-testimonial-empty">
              <p>Be the first to share what you think about LearnWithRich.</p>
            </div>
          )}
          <div className="community-testimonial-actions">
            <div>
              <Link href="/reviews" className="text-link">
                Read all reviews <ArrowRight size={15} />
              </Link>
              <Link href="/reviews#share" className="button button-dark">
                Add a review <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
        <div className="community-service-nudge">
          <div>
            <span className="maker-kicker">HAVE A PROJECT IN MIND?</span>
            <h3>Let’s make the next step clearer.</h3>
            <p>
              Share the idea, your timeline and an optional budget. I’ll review
              it and prepare a quote.
            </p>
          </div>
          <Link href="/services/request" className="button button-orange">
            Request a service <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
