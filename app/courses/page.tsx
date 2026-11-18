export const dynamic='force-dynamic';
import { LiveProducts } from '@/components/live-products';
import type {Metadata} from 'next';
import {resources} from '@/lib/catalog';
import {CompactResource} from '@/components/compact-resource';
import {DrawnUnderline} from '@/components/decorative-marks';
export const metadata:Metadata={title:'Practical courses'};
export default function Courses(){return <div className="studio-page studio-courses-index"><header className="studio-page-heading"><h1>Less watching. <span className="marked-word">More making.<DrawnUnderline className="orange-scribble"/></span></h1><p>Practical courses built around useful projects. Explore the learning paths taking shape.</p></header><LiveProducts type="course"/><details className="project-planning-samples"><summary>Preview upcoming courses</summary><div className="studio-courses-list">{resources.filter(r=>r.type==='Course').map(r=><CompactResource resource={r} key={r.slug}/>)}</div><p className="studio-note">Course previews · Enrolment and video playback are not open yet for these previews.</p></details></div>}
