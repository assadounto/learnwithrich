import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/xonbay/server';
export async function GET(){try{const user=await currentUser();return NextResponse.json({user:user?{id:user.id,name:user.name}:null},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Account service unavailable.'},{status:503})}}
