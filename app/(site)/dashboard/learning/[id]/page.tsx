import Link from '@/components/navigation-link';
import {requireUser,requireToken,ownedCourse,upstream} from '@/lib/xonbay/server';
import {CoursePlayer} from '@/components/course-player';
export const dynamic='force-dynamic';
export default async function Learning({params}:{params:Promise<{id:string}>}){await requireUser();const accessToken=await requireToken();const {id}=await params;await ownedCourse(id,accessToken);const course=await upstream('/v1/digital_courses/'+encodeURIComponent(id),accessToken);return <section className="learning-page ref-container"><Link href="/dashboard" className="text-link">My dashboard</Link><CoursePlayer course={course}/></section>}
