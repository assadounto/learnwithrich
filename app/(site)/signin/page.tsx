import type {Metadata} from 'next';
import {Suspense} from 'react';
import {redirect} from 'next/navigation';
import {LearnerSignIn} from '@/components/learner-signin';
import {currentUser} from '@/lib/server/identity/current-user';
export const metadata: Metadata = {title: 'Learner sign in', robots: {index: false, follow: false}};
export default async function SignInPage({searchParams}: {searchParams: Promise<{next?: string}>}) {
  if (await currentUser()) {
    const rawNext = (await searchParams).next || '/account';
    const destination = rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.toLowerCase().startsWith('/admin') ? rawNext : '/account';
    redirect(destination);
  }
  return <Suspense fallback={<div className="container" role="status">Opening sign-in…</div>}><LearnerSignIn/></Suspense>;
}
