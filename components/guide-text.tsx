import type {ReactNode} from 'react';
/** Render guide headings, lists and code as React text; never interpret embedded HTML. */
export function GuideText({text}:{text:string}){
 const chunks=text.split(/(```[\s\S]*?```)/g);
 return <div className="guide-rich-text">{chunks.flatMap((chunk,index)=>{
  if(chunk.startsWith('```')){const lines=chunk.slice(3,-3).split('\n');const language=lines.shift()?.trim();return [<pre key={index} aria-label={language?`${language} code`:'Code'}><code>{lines.join('\n').trimEnd()}</code></pre>]}
  const lines=chunk.split('\n');const blocks:ReactNode[]=[];let i=0;
  while(i<lines.length){
   if(!lines[i].trim()){i++;continue}
   const key=`${index}-${i}`;const h=lines[i].match(/^(#{1,4})\s+(.+)$/);
   if(h){const Tag=(h[1].length===1?'h2':h[1].length===2?'h3':'h4') as 'h2'|'h3'|'h4';blocks.push(<Tag key={key}>{h[2]}</Tag>);i++;continue}
   if(/^[-*]\s/.test(lines[i])){const entries:string[]=[];while(i<lines.length&&/^[-*]\s/.test(lines[i]))entries.push(lines[i++].replace(/^[-*]\s/,''));blocks.push(<ul key={key}>{entries.map((entry,j)=><li key={j}>{entry}</li>)}</ul>);continue}
   const paragraph:string[]=[];while(i<lines.length&&lines[i].trim()&&!/^(?:#{1,4}|[-*])\s/.test(lines[i]))paragraph.push(lines[i++]);blocks.push(<p key={key}>{paragraph.join('\n')}</p>);
  }
  return blocks;
 })}</div>;
}
