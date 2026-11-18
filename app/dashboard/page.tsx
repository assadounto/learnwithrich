import {requireUser,requireToken,library} from '@/lib/xonbay/server';
import {accountSummary} from '@/lib/account';
import {libraryView} from '@/lib/dashboard';
import {DashboardView} from '@/components/dashboard-view';
export const dynamic='force-dynamic';
export const metadata={title:'My dashboard'};
export default async function Dashboard({searchParams}:{searchParams:Promise<{view?:string}>}){
 const user=accountSummary(await requireUser());
 const items=await library(await requireToken());
 return <DashboardView user={user} items={items} view={libraryView((await searchParams).view)}/>;
}
