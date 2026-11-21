import Link from '@/components/navigation-link';
import {ArrowLeft, LockKeyhole} from 'lucide-react';
import {OwnerSignin} from '@/components/admin/session-buttons';

export function OwnerEntry({configured, error}: {configured: boolean; error: boolean}) {
  return <section className="admin-signin"><Link href="/" className="admin-entry-brand">learnWithRich <span>STUDIO</span></Link><Link href="/" className="admin-back"><ArrowLeft size={15}/>Back to LearnWithRich</Link><div className="admin-signin-card"><span className="admin-icon"><LockKeyhole size={24}/></span><span className="admin-kicker">OWNER-ONLY CREATOR SPACE</span><h1>Sign in to<br/>your studio.</h1><p>Manage resources, publish learning materials and shape the public catalog.</p>{error && <p className="account-notice" role="alert">Sign-in did not complete. Please try again.</p>}{configured ? <OwnerSignin/> : <p className="account-notice" role="status">Owner sign-in needs to be configured before this studio can be opened.</p>}<small>Only the verified LearnWithRich owner can enter. The studio requires multi-factor authentication.</small><p className="admin-entry-learner">Here to learn? <Link href="/signin">Use learner sign-in</Link>.</p></div></section>;
}
