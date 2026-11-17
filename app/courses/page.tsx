import type { Metadata } from 'next';
import {resources} from '@/lib/catalog';
import {CourseCard} from '@/components/resource-card';
export const metadata:Metadata={title:'Practical courses'};
export default function Courses(){return <div className="container"><div className="page-top"><span className="eyebrow">THE HANDS-ON SERIES</span><h1>Less watching.<br/><i>More making.</i></h1><p>Practical learning, built around something you can actually make.<br/>A first look at the courses taking shape.</p><span className="preview-label">Courses in preparation · Enrolment is not open</span></div><div className="courses-grid section">{resources.filter(r=>r.type==='Course').map(r=><CourseCard key={r.slug} resource={r}/>)}</div></div>}
