'use client';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ArrowLeft, ArrowRight, Bookmark, CreditCard, FolderOpen, LogIn} from 'lucide-react';
import Link from '@/components/navigation-link';
import {identityClient} from '@/lib/identity-client';
import {learnerDestination} from '@/lib/identity/learner-destination';
import styles from '@/app/(site)/signin/signin.module.css';

export function LearnerSignIn() {
  const search = useSearchParams();
  const next = learnerDestination(search.get('next'));
  const signInError = search.get('error') === 'signin';
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  async function signIn() {
    setPending(true); setError('');
    try {
      const callbackURL = `/signin/complete?next=${encodeURIComponent(next)}`;
      const result = await identityClient.signIn.social({provider: 'google', callbackURL, errorCallbackURL: `/signin?error=signin&next=${encodeURIComponent(next)}`});
      if (result.error) throw new Error(result.error.message || 'Google sign-in is not available right now.');
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not start sign-in.'); setPending(false);}
  }
  return <div className={`ref-container ${styles.page}`}>
    <Link href="/" className={styles.back}><ArrowLeft size={16}/> Back to LearnWithRich</Link>
    <div className={styles.layout}>
      <section className={styles.panel} aria-labelledby="learner-sign-in">
        <span className={styles.icon}><LogIn size={22}/></span>
        <h1 id="learner-sign-in">Sign in to <i>LearnWithRich.</i></h1>
        <p>Use your Google account to access your saved resources, downloads, and service requests.</p>
        {signInError && !error && <p role="alert" className={styles.error}>Google sign-in didn’t finish. Please try again.</p>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button type="button" className={`button button-dark ${styles.submit}`} disabled={pending} onClick={signIn}>
          {pending ? 'Opening Google…' : 'Continue with Google'}<ArrowRight size={17}/>
        </button>
        <p className={styles.legal}>First time here? Continuing creates a free learner account. See our <Link href="/terms">terms of use</Link> and <Link href="/privacy">privacy notice</Link>.</p>
        <Link href="/resources" className="text-link">Browse resources <ArrowRight size={15}/></Link>
      </section>
      <aside className={styles.story} aria-label="Your learner account">
        <div className={styles.photo}/>
        <ul>
          <li><Bookmark size={19}/> Keep useful resources handy</li>
          <li><CreditCard size={19}/> Find purchases and downloads</li>
          <li><FolderOpen size={19}/> Follow your project requests</li>
        </ul>
      </aside>
    </div>
  </div>;
}
