'use client';
import {useRef} from 'react';
import {X,ArrowRight} from 'lucide-react';
export function PreviewDialog({label,title,children,className='button button-orange'}:{label:string;title:string;children:React.ReactNode;className?:string}){const dialog=useRef<HTMLDialogElement>(null);return <><button className={className} onClick={()=>dialog.current?.showModal()}>{label}<ArrowRight size={16}/></button><dialog ref={dialog} className="studio-info-dialog" aria-label={title}><button className="icon-button info-close" aria-label="Close preview" onClick={()=>dialog.current?.close()}><X size={19}/></button><span className="studio-preview-tag">Preview</span><h2>{title}</h2>{children}<button className="button button-outline" onClick={()=>dialog.current?.close()}>Close</button></dialog></>}
