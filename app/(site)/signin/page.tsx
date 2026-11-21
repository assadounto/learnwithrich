import type {Metadata} from 'next';
import {Suspense} from 'react';
import {LearnerSignIn} from '@/components/learner-signin';
export const metadata: Metadata = {title: 'Sign in', robots: {index: false, follow: false}};
export default function SignInPage() {return <Suspense fallback={<div className="container" role="status">Opening sign-in…</div>}><LearnerSignIn/></Suspense>;}
