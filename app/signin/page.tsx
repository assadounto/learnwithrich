import Link from '@/components/navigation-link';
import {GoogleSignin} from '@/components/google-signin';
import {currentUser} from '@/lib/xonbay/server';
import {safeNext} from '@/lib/xonbay/contracts';
import {redirect} from 'next/navigation';
export const metadata={title:'Sign in'};
export const dynamic='force-dynamic';
export default async function SignIn({searchParams}:{searchParams:Promise<{next?:string}>}){const next=safeNext((await searchParams).next||'/dashboard');if(await currentUser())redirect(next);return <section className="account-signin ref-container"><div><span className="maker-kicker">YOUR NEXT CHAPTER</span><h1>Keep your curiosity.<br/><i>Bring it with you.</i></h1><p>Sign in to find your purchases, continue your courses and keep making.</p><Link href="/resources" className="text-link">Explore the collection</Link></div><div className="account-signin-card"><span className="maker-kicker">WELCOME TO LEARNWITHRICH</span><h2>A little learning.<br/>A lot of possibility.</h2><GoogleSignin next={next}/><p>Continue with Google using your Xonbay account. New learners get an account when they first sign in.</p><p><Link href="/privacy">How your information is used</Link></p></div></section>}
