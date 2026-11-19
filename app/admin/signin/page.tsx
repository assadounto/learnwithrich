import Link from '@/components/navigation-link';
import {identityReady} from '@/lib/server/identity';
import {OwnerSignin} from '@/components/admin/session-buttons';
import {LockKeyhole, ArrowLeft} from 'lucide-react';
export default async function Signin({searchParams}: {searchParams: Promise<{error?: string}>}) {
  const configured = identityReady(); const error = (await searchParams).error;
  return <section className="admin-signin"><Link href="/" className="admin-back"><ArrowLeft size={15}/>Back to LearnWithRich</Link><div className="admin-signin-card"><span className="admin-icon"><LockKeyhole size={24}/></span><span className="admin-kicker">YOUR CREATOR SPACE</span><h1>Good ideas.<br/>Ready to share.</h1><p>Sign in to manage your resources, shape your courses, and bring learning paths together.</p>{error && <p className="account-notice" role="alert">Sign-in did not complete. Please try again.</p>}{configured ? <OwnerSignin/> : <p className="account-notice" role="status">Owner sign-in needs to be configured before this studio can be opened.</p>}<small>Only the verified LearnWithRich owner can enter the studio.</small></div></section>;
}
