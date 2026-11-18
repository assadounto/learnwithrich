'use client';
import {Play} from 'lucide-react';
import {WorkspaceArt,artFor} from './workspace-art';
import {PreviewDialog} from './preview-dialog';
export function CoursePreview({slug}:{slug:string}){return <div className="studio-course-preview"><WorkspaceArt kind={artFor(slug)}/><div className="course-preview-trigger"><PreviewDialog label="Watch preview" title="A practical course is taking shape" className="course-preview-play"><p>This is a design preview. The course video is not available yet. You can explore the planned curriculum and save your interest.</p></PreviewDialog><Play className="preview-play-icon" size={27} fill="currentColor" aria-hidden="true"/></div><div className="preview-video-bar"><Play size={12}/><span>Course preview · Coming soon</span><span>◻</span></div></div>}
