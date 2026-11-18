import type {Entitlement} from './xonbay/contracts';
export type LibraryView='all'|'courses'|'resources';
export function libraryView(value:unknown):LibraryView{return value==='courses'||value==='resources'?value:'all'}
export function courseProgress(item:Entitlement){
 const total=Math.max(0,Math.floor(item.course_progress?.total_lessons||0));
 const completed=Math.min(total,Math.max(0,Math.floor(item.course_progress?.completed_lessons||0)));
 return {total,completed,percent:total?Math.round(completed/total*100):0};
}
export function dashboardStats(items:Entitlement[]){
 const courses=items.filter(item=>item.content_type==='course');
 return {courses:courses.length,resources:items.length-courses.length,completedLessons:courses.reduce((count,item)=>count+courseProgress(item).completed,0)};
}
