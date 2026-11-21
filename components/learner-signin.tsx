'use client';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ArrowLeft, ArrowRight, Bookmark, CircleCheck, CreditCard, Sparkles} from 'lucide-react';
import Link from '@/components/navigation-link';
import styles from '@/app/(site)/signin/signin.module.css';

export function LearnerSignIn() {
  const search = useSearchParams();
  const rawNext = search.get('next') || '/account';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account';
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  async function signIn() {
    setPending(true); setError('');
    try {
      const response = await fetch('/api/identity/sign-in/social', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({provider: 'google', callbackURL: new URL(next, window.location.origin).toString()})});
      const result = await response.json();
      const url = result.url || result.redirectTo;
      if (!response.ok || typeof url !== 'string') throw new Error(result.message || 'Google sign-in is not available right now.');
      window.location.assign(url);
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not start sign-in.'); setPending(false);}
  }
  return <div className={styles.page}>
    <Link href="/" className={styles.back}><ArrowLeft size={15}/>Back to LearnWithRich</Link>
    <div className={styles.layout}>
      <section className={styles.story}><span className={styles.eyebrow}><span className={styles.dot}/>YOUR LEARNING, ALL IN ONE PLACE</span><h1>Keep building.<br/>Keep every good<br/><i>idea close.</i></h1><p>Sign in to save useful resources, keep your purchases together, and pick up where your curiosity takes you next.</p><div className={styles.workbench}><div className={styles.photo}/><span className={styles.caption}>LEARNWITHRICH · MADE FOR CURIOUS MINDS</span></div><span className={styles.signature}><span className={styles.signatureLine}/>Practical learning by Richmond Adu-Kyere</span></section>
      <section className={styles.panel}><div className={styles.panelIntro}><span className={styles.welcomeIcon}><Sparkles size={19}/></span><span className={styles.eyebrow}>WELCOME TO YOUR LEARNING SPACE</span><h2>Make room for<br/><i>what’s next.</i></h2><p>Use your Google account to join LearnWithRich. No password to remember.</p></div><div className={styles.auth}><button type="button" className="button button-dark" style={{width:'100%'}} disabled={pending} onClick={signIn}>{pending?'Opening Google…':'Continue with Google'}<ArrowRight size={16}/></button>{error&&<p role="alert" className="admin-alert">{error}</p>}<p className={styles.newAccount}>Continuing creates your free LearnWithRich learner account.</p></div><div className={styles.benefits}><span className={styles.benefitsLabel}>YOUR ACCOUNT HELPS YOU</span><ul><li><Bookmark size={16}/><span>Save resources across devices<small>Build a personal library of projects and learning materials.</small></span></li><li><CreditCard size={16}/><span>Keep purchases in one place<small>Find your bundles, individual downloads and payment history.</small></span></li><li><CircleCheck size={16}/><span>Return whenever you’re ready<small>Your saved and purchased resources stay connected to your account.</small></span></li></ul></div><p className={styles.privacy}>By continuing, you agree to the <Link href="/privacy">privacy notice <ArrowRight size={11}/></Link>. Your payment details are handled by Paystack.</p><div className={styles.below}><span>Learn it. Build it. Make it real.</span><Link href="/resources">Explore first <ArrowRight size={14}/></Link></div></section>
      <div className={styles.creatorLink}><span>Managing LearnWithRich?</span><Link href="/admin">Creator sign-in <ArrowRight size={12}/></Link></div>
    </div>
  </div>;
}
