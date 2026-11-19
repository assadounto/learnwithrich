import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {resources} from '@/lib/catalog';
import {ResourceDetail,CourseDetail} from '@/components/resource-detail';
export function generateStaticParams(){return resources.map(r=>({slug:r.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const r=resources.find(r=>r.slug===slug);return{title:r?.title||'Resource not found',description:r?.description}}
export default async function ResourcePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const resource=resources.find(r=>r.slug===slug);if(!resource)notFound();return resource.type==='Course'?<CourseDetail resource={resource}/>:<ResourceDetail resource={resource}/>}
