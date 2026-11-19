import Link from '@/components/navigation-link';
import {ArrowLeft, ArrowUpRight, BookOpen, FolderOpen, GraduationCap, LockKeyhole, Sparkles} from 'lucide-react';
import {GoogleSignin} from '@/components/google-signin';
import {DrawnUnderline} from '@/components/decorative-marks';
import {currentUser} from '@/lib/xonbay/server';
import {safeNext} from '@/lib/xonbay/contracts';
import {redirect} from 'next/navigation';
import styles from './signin.module.css';

export const metadata = {title: 'Sign in', description: 'Your next idea starts here. Sign in to continue your courses and access your LearnWithRich purchases.'};
export const dynamic = 'force-dynamic';

export default async function SignIn({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const next = safeNext((await searchParams).next || '/dashboard');
  if (await currentUser()) redirect(next);

  return (
    <div className={`${styles.page} ref-container`}>
      <Link href="/" className={styles.back}><ArrowLeft size={15} aria-hidden="true"/> Back to discovering</Link>
      <div className={styles.layout}>
        <section className={styles.story} aria-labelledby="signin-story-title">
          <span className={styles.eyebrow}><span className={styles.dot}/> A HOME FOR CURIOUS MINDS</span>
          <h1 id="signin-story-title">A little curiosity.<br/>A world of<br/><i>possibility.<DrawnUnderline/></i></h1>
          <p>Big ideas start with small steps. Make this one yours.</p>
          <div className={styles.workbench}>
            <div className={styles.photo} role="img" aria-label="An electronics project and solar panel on a sunlit maker’s workbench"/>
            <div className={styles.note}><span>Learn it. Build it.<br/><strong>Make it real.</strong></span></div>
            <span className={styles.caption}>A LITTLE LEARNING. SOMETHING REAL.</span>
          </div>
          <div className={styles.signature}><span className={styles.signatureLine}/> Made for the learner. And the maker in you.</div>
        </section>

        <section className={styles.panel} aria-labelledby="signin-title">
          <div className={styles.panelIntro}>
            <span className={styles.welcomeIcon}><Sparkles size={23} strokeWidth={1.5} aria-hidden="true"/></span>
            <span className={styles.eyebrow}>YOUR NEXT CHAPTER</span>
            <h2 id="signin-title">Good to have<br/>you <i>here.</i></h2>
            <p>Sign in to your learning space.<br/>Your next good idea is waiting.</p>
          </div>
          <div className={styles.auth}>
            <GoogleSignin next={next}/>
            <p className={styles.newAccount}>New here? You’re in the right place.<br/>Your account is created when you first sign in.</p>
          </div>
          <div className={styles.benefits}>
            <span className={styles.benefitsLabel}>A SPACE TO MAKE PROGRESS</span>
            <ul>
              <li><GraduationCap size={19} aria-hidden="true"/><span>Pick up where you left off<small>Your courses and lesson progress, together.</small></span></li>
              <li><FolderOpen size={19} aria-hidden="true"/><span>Keep your good finds close<small>Access your purchased books and resources.</small></span></li>
              <li><BookOpen size={19} aria-hidden="true"/><span>Turn learning into doing<small>Bring new skills to your next project.</small></span></li>
            </ul>
          </div>
          <p className={styles.privacy}><LockKeyhole size={13} aria-hidden="true"/><span>Secure sign-in with Google, powered by Xonbay.<br/><Link href="/privacy">See how your information is used <ArrowUpRight size={12} aria-hidden="true"/></Link></span></p>
        </section>
      </div>
      <div className={styles.below}><span>A little curiosity goes a long way.</span><Link href="/resources">Just looking? Explore the collection <ArrowUpRight size={14} aria-hidden="true"/></Link></div>
    </div>
  );
}
