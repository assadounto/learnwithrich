import {redirect} from 'next/navigation';
import {learnerDestination} from '@/lib/identity/learner-destination';
import {currentUser} from '@/lib/server/identity/current-user';

export const dynamic = 'force-dynamic';

export default async function LearnerSignInComplete({searchParams}: {searchParams: Promise<{next?: string}>}) {
  const user = await currentUser();
  if (!user) redirect('/signin?error=signin');
  redirect(learnerDestination((await searchParams).next));
}
