'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {CheckCircle2,FileText,LoaderCircle,Paperclip,Upload} from 'lucide-react';

type FileItem={id:string;originalName:string;mimeType:string;sizeBytes:number};
const accepted='image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,text/plain,text/markdown,text/csv,application/json,application/yaml,application/xml,text/x-python,text/javascript,text/typescript,text/html,text/css,text/x-c,text/x-c-header,text/x-c++,text/x-c++-header,text/x-shellscript,application/toml,.svg,.zip,.txt,.md,.csv,.json,.yaml,.yml,.xml,.py,.js,.ts,.html,.css,.c,.h,.cpp,.hpp,.ino,.sh,.toml';

export function ServiceRequestFiles({requestId,initialFiles,closed=false}:{requestId:string;initialFiles:FileItem[];closed?:boolean}) {
  const [files,setFiles]=useState(initialFiles),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const input=useRef<HTMLInputElement>(null),router=useRouter();
  async function upload(selected:FileList|null){
    if(!selected?.length)return;
    setBusy(true);setError('');setNotice('');
    try{
      for(const file of Array.from(selected)){
        const form=new FormData();form.append('file',file);
        const response=await fetch(`/api/account/service-requests/${requestId}/files`,{method:'POST',body:form});
        const body=await response.json();if(!response.ok)throw new Error(body.error||`Could not attach ${file.name}.`);
        setFiles(current=>current.some(item=>item.id===body.file.id)?current:[...current,body.file]);
      }
      setNotice('Files added to your request.');router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:'Could not upload your files.');}
    finally{setBusy(false);if(input.current)input.current.value='';}
  }
  return <section className="service-request-attachments"><header><div><span className="maker-kicker">PROJECT FILES</span><h3>Files for this request</h3></div>{!closed&&<><input ref={input} type="file" multiple accept={accepted} hidden onChange={event=>void upload(event.currentTarget.files)}/><button className="button button-outline" type="button" disabled={busy} onClick={()=>input.current?.click()}>{busy?<LoaderCircle className="service-spin" size={15}/>:<Upload size={15}/>} {busy?'Uploading…':'Add files'}</button></>}</header><p>Share documents, images, audio, video, ZIP archives or source files with Rich. Uploads stay private to you and the service workspace.</p>{files.length>0?<div className="service-request-file-list">{files.map(file=><div className="request-file-entry" key={file.id}>{file.mimeType.startsWith('audio/') && <audio controls preload="none" aria-label={`Play ${file.originalName}`} src={`/api/service-request-files/${requestId}/${file.id}?play=1`}/>}<a href={`/api/service-request-files/${requestId}/${file.id}`} download={file.originalName}><Paperclip size={15}/><span>{file.originalName}<small>{(file.sizeBytes/1024/1024).toFixed(1)} MB · {file.mimeType.split('/')[1]?.toUpperCase()}</small></span><FileText size={14}/></a></div>)}</div>:<div className="service-request-file-empty">No files attached yet.</div>}{notice&&<p className="service-file-notice" role="status"><CheckCircle2 size={14}/>{notice}</p>}{error&&<p className="service-file-error" role="alert">{error}</p>}<small className="service-file-limit">Up to 20 files per request · 50 MB each · image, document, ZIP, text/source, audio and video formats</small></section>;
}
