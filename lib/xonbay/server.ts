import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {belongsToShop,isIdentifier,type Listing,type Entitlement} from './contracts';
export const SESSION='lwr_session';
export const shopId=()=>process.env.XONBAY_SHOP_ID?.trim()||'';
export const shopHandle=()=>process.env.XONBAY_SHOP_HANDLE?.trim()||'learnwithrich';
export class ServiceError extends Error{constructor(message:string,public status=502){super(message)}}
export async function upstream(path:string,token?:string,body?:unknown,method?:string){
 const base=process.env.XONBAY_API_URL||'https://api.xonbay.com';
 const url=new URL(path,base);
 if(url.origin!==new URL(base).origin||!path.startsWith('/v1/'))throw new ServiceError('Invalid service request',400);
 let res:Response;try{res=await fetch(url,{method:method||(body===undefined?'GET':'POST'),headers:{Accept:'application/json',...(token?{Authorization:`Bearer ${token}`} :{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)})}catch{throw new ServiceError('Xonbay is temporarily unavailable. Please try again.');}
 const data=await res.json().catch(()=>({}));if(!res.ok)throw new ServiceError(typeof data.error==='string'?data.error:'This request could not be completed.',res.status);return data;
}
export async function token(){return (await cookies()).get(SESSION)?.value}
export async function requireToken(){const value=await token();if(!value)throw new ServiceError('Please sign in to continue.',401);return value}
export async function currentUser(){const value=await token();if(!value)return null;try{return await upstream('/v1/me',value)}catch(e){if(e instanceof ServiceError&&[401,403].includes(e.status))return null;throw e}}
export async function requireUser(){const user=await currentUser();if(!user)redirect('/signin');return user}
export async function listings(type?:string){
 if(!/^[1-9]\d*$/.test(shopId()))return {items:[] as Listing[],configured:false,error:false};
 try{let page=1,total=Infinity;const items:Listing[]=[];while(items.length<total&&page<=50){const q=new URLSearchParams({shop_id:shopId(),page:String(page),...(type?{content_type:type}:{})});const data=await upstream('/v1/public_digital_listings?'+q);const rows=Array.isArray(data.items)?data.items:[];items.push(...rows.filter((r:Listing)=>belongsToShop(r,shopId(),shopHandle())));total=Number(data.total)||0;if(!rows.length)break;page++}return {items,configured:true,error:false}}catch{return {items:[] as Listing[],configured:true,error:true}}
}
export async function listing(id:string){if(!isIdentifier(id)||!shopId())throw new ServiceError('Product unavailable.',404);const item=await upstream('/v1/public_digital_listings/'+encodeURIComponent(id)) as Listing;if(!belongsToShop(item,shopId(),shopHandle())||![String(item.id),item.public_id].includes(id))throw new ServiceError('Product unavailable.',404);return item}
export async function library(accessToken:string){
 if(!shopId())return [] as Entitlement[];
 const items:Entitlement[]=[];let page=1;while(page<=100){const data=await upstream('/v1/digital_downloads?'+new URLSearchParams({shop_id:shopId(),page:String(page)}),accessToken);const rows=Array.isArray(data.items)?data.items:[];items.push(...rows.filter((row:Entitlement)=>belongsToShop(row,shopId(),shopHandle())&&row.accessible));if(!rows.length||page*Number(data.per_page||20)>=Number(data.total||0))break;page++}return items;
}
export async function ownedCourse(id:string,accessToken:string){if(!isIdentifier(id))throw new ServiceError('Course unavailable.',404);const owned=(await library(accessToken)).find(e=>e.digital_product_public_id===id&&e.content_type==='course');if(!owned)throw new ServiceError('Course access unavailable.',404);return owned}
export function assertOrigin(request:Request){const expected=new URL(process.env.APP_URL||request.url).origin;if(request.headers.get('origin')!==expected)throw new ServiceError('Please reload this page and try again.',403)}
export function cookieOptions(maxAge:number){return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge}}
