import type {Metadata} from 'next';
import Link from '@/components/navigation-link';
import {ArrowLeft, ArrowUpRight, BookOpen, CircuitBoard, Code2, GraduationCap, MessageCircle} from 'lucide-react';
import {ServiceRequestForm} from '@/components/service-request-form';
import {currentUser} from '@/lib/server/identity/current-user';

export const metadata: Metadata = {title: 'Request a service', description: 'Share your thesis, software, electronics or project brief and request a quote from LearnWithRich.'};
export const dynamic = 'force-dynamic';
export default async function ServiceRequestPage() {
  const user = await currentUser();
  return <div className="service-request-page ref-container"><Link className="service-back-link" href="/"><ArrowLeft size={14}/>Back to LearnWithRich</Link><header className="service-page-hero"><span className="maker-kicker">WORK WITH RICH</span><h1>Bring a real idea.<br/><i>Let’s shape the next step.</i></h1><p>From thesis support and software builds to electronics prototypes, share what you have in mind. I’ll review the brief, ask any follow-up questions and send a clear quote you can accept and pay securely.</p><div className="service-trust-points"><span><MessageCircle size={15}/>Thoughtful first conversation</span><span><BookOpen size={15}/>Clear scope and revision terms</span></div><span className="service-hero-mark"><ArrowUpRight size={46}/></span></header><div className="service-request-layout"><aside className="service-offerings"><span className="maker-kicker">AREAS I CAN HELP WITH</span>{[{Icon:GraduationCap,title:'Research & thesis',text:'Structure, technical guidance, review and project support.'},{Icon:Code2,title:'Software projects',text:'Web apps, APIs, prototypes and practical tools.'},{Icon:CircuitBoard,title:'Electronics & IoT',text:'Connected devices, embedded projects and system plans.'}].map(({Icon,title,text})=><article key={title}><Icon size={20}/><div><strong>{title}</strong><p>{text}</p></div></article>)}<p className="service-ethics-note">Academic support is guidance and technical collaboration. You remain the author of your submitted work.</p></aside><ServiceRequestForm profile={user?{name:user.name,email:user.email}:null}/></div></div>;
}
