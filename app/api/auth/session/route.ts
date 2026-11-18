import {accountSummary} from '@/lib/account';
import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/xonbay/server';
export async function GET(){try{const user=await currentUser();return NextResponse.json({user:user?accountSummary(user):null},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Account service unavailable.'},{status:503})}}
