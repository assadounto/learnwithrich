import type {Metadata} from 'next';
import {Suspense} from 'react';
import {redirect} from 'next/navigation';
import {LearnerSignIn} from '@/components/learner-signin';
import {currentUser} from '@/lib/server/identity/current-user';
import {learnerDestination} from '@/lib/identity/learner-destination';
export const metadata: Metadata = {title: 'Learner sign in', robots: {index: false, follow: false}};
// Identity settings are available at runtime, including in standalone deployments.
export const dynamic = 'force-dynamic';

export default async function SignInPage({searchParams}: {searchParams: Promise<{next?: string}>}) {
  if (await currentUser()) {
    const {next} = await searchParams;
    const rawNext = typeof next === 'string' ? next : '/account';
    redirect(learnerDestination(rawNext));
  }
  return <Suspense fallback={<div className="container" role="status">Opening sign-in…</div>}><LearnerSignIn/></Suspense>;
}
