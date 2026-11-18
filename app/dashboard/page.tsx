import Link from '@/components/navigation-link';
import {requireUser,requireToken,library} from '@/lib/xonbay/server';
import {SignOut} from '@/components/account-controls';
import {CustomerLibrary} from '@/components/customer-library';
export const dynamic='force-dynamic';
export const metadata={title:'My dashboard'};
export default async function Dashboard(){const user=await requireUser();const items=await library(await requireToken());return <section className="customer-dashboard ref-container"><header><div><span className="maker-kicker">YOUR LEARNING SPACE</span><h1>Keep making, <i>{String(user.name||'maker').split(' ')[0]}.</i></h1><p>Your LearnWithRich purchases, downloads and courses in one place.</p></div><SignOut/></header><nav className="customer-shortcuts"><Link href="/resources">Explore resources</Link><Link href="/courses">Find a course</Link><Link href="/library">Bookmarks in this browser</Link><Link href="/checkout/return">Check a recent payment</Link></nav><h2>My library <small>({items.length})</small></h2>{items.length?<CustomerLibrary items={items}/>:<div className="customer-empty"><h3>Your next idea starts here.</h3><p>Resources you buy or claim for free will appear here. There are no sample purchases in this dashboard.</p><Link className="button button-orange" href="/resources">Find something to make</Link></div>}</section>}
