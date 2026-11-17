'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Link from 'next/link';
import { PaperEdges } from './paper-edges';
import { ArrowUpRight, Pause, Play, RotateCcw, MoveUpRight, Code2, CircuitBoard, Database, Layers, Box, GitBranch } from 'lucide-react';

const skills = [
 { name: 'Rails', category: 'Backend', detail: 'APIs and the application logic behind useful platforms.', icon: Code2, tone: 'orange' },
 { name: 'Next.js', category: 'Web', detail: 'Interfaces that connect people with projects and products.', icon: Layers, tone: 'cream' },
 { name: 'React Native', category: 'Mobile', detail: 'Mobile experiences built around everyday tasks.', icon: Layers, tone: 'olive' },
 { name: 'TypeScript', category: 'Code', detail: 'Clearer data shapes and dependable application code.', icon: Code2, tone: 'glass' },
 { name: 'ESP32', category: 'Hardware', detail: 'A starting point for connected-device experiments.', icon: CircuitBoard, tone: 'orange' },
 { name: 'PostgreSQL', category: 'Data', detail: 'Related records, catalog data and application storage.', icon: Database, tone: 'cream' },
 { name: 'Ruby', category: 'Code', detail: 'Readable application logic and practical backend work.', icon: Code2, tone: 'glass' },
 { name: 'JavaScript', category: 'Code', detail: 'The interactions that make an interface feel alive.', icon: Code2, tone: 'olive' },
 { name: 'Docker', category: 'Delivery', detail: 'Packaging the pieces of an application together.', icon: Box, tone: 'cream' },
 { name: 'IoT', category: 'Hardware', detail: 'Connecting inputs, devices and useful information.', icon: CircuitBoard, tone: 'olive' },
 { name: 'Redis', category: 'Backend', detail: 'Supporting responsive application workflows.', icon: Database, tone: 'glass' },
 { name: 'Sidekiq', category: 'Backend', detail: 'Background jobs for work that can happen behind the scenes.', icon: Layers, tone: 'orange' },
 { name: 'Git', category: 'Process', detail: 'Keeping changes traceable as a project grows.', icon: GitBranch, tone: 'olive' },
 { name: 'APIs', category: 'Systems', detail: 'Helping interfaces and services work together.', icon: Code2, tone: 'cream' },
 { name: 'Electronics', category: 'Hardware', detail: 'Exploring how physical components bring an idea to life.', icon: CircuitBoard, tone: 'glass' },
 { name: 'UI design', category: 'Design', detail: 'Making a useful next step clear and easy to find.', icon: MoveUpRight, tone: 'orange' },
 { name: 'Sensors', category: 'Hardware', detail: 'Turning a physical input into something a system can understand.', icon: CircuitBoard, tone: 'cream' },
 { name: 'Documentation', category: 'Process', detail: 'Sharing the decisions, limits and lessons behind a build.', icon: Layers, tone: 'olive' },
];
type Body = { x:number; y:number; vx:number; vy:number; r:number; delay:number };
type Drag = { index:number; ox:number; oy:number; lastX:number; lastY:number; time:number; moved:boolean };
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export function SkillsPlayground() {
 const stage=useRef<HTMLDivElement>(null);
 const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 const bodies=useRef<Body[]>([]);
 const drag=useRef<Drag|null>(null);
 const suppressClick=useRef(false);
 const bounds=useRef({width:0,height:0});
 const pausedRef=useRef(false);
 const [paused,setPaused]=useState(false);
 const [replay,setReplay]=useState(0);
 const [motion,setMotion]=useState(false);
 const [reduced,setReduced]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update)},[]);
 useEffect(()=>{pausedRef.current=paused},[paused]);
 useEffect(()=>{
  const element=stage.current;
  if(!element||reduced){setMotion(false);return;}
  let frame=0,previous=0,elapsed=0,visible=false;
  bodies.current=[];
  const updateVisibility=()=>{const rect=element.getBoundingClientRect();visible=rect.bottom>0&&rect.top<window.innerHeight;previous=0;};
  const resize=()=>{
   const oldBounds=bounds.current,oldBodies=bodies.current;
   bounds.current={width:element.clientWidth,height:element.clientHeight};
   const {width}=bounds.current;
   bodies.current=skills.map((_,i)=>{const r=Math.max(width<600?36+(i%4)*3:43+(i%5)*5,skills[i].name.length>=10?(width<600?45:55):0);if(oldBodies[i]&&oldBounds.width){const old=oldBodies[i];return{...old,r,x:clamp(old.x/oldBounds.width*width,r,width-r),y:Math.min(old.y/oldBounds.height*bounds.current.height,bounds.current.height-r)}}return{x:r+((i*137+41)%Math.max(1,width-2*r)),y:-r-15-(i%3)*35,vx:((i%5)-2)*1.15,vy:0,r,delay:i*.12}});
   if(!oldBodies.length)elapsed=0;previous=0;updateVisibility();
   bodies.current.forEach((body,i)=>{const button=buttons.current[i];if(button){button.style.width=`${body.r*2}px`;button.style.height=`${body.r*2}px`;button.style.transform=`translate3d(${body.x-body.r}px,${body.y-body.r}px,0)`;}});
  };
  window.addEventListener('scroll',updateVisibility,{passive:true});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(element);resize();setMotion(true);
  const tick=(time:number)=>{
   const dt=previous?Math.min((time-previous)/16.667,2):1;previous=time;
   if(visible&&!pausedRef.current&&!document.hidden){
    elapsed+=dt/60;
    const values=bodies.current;const {width,height}=bounds.current;
    values.forEach((body,i)=>{if(elapsed<body.delay||drag.current?.index===i)return;body.vy+=.22*dt;body.x+=body.vx*dt;body.y+=body.vy*dt;body.vx*=Math.pow(.997,dt);
     if(body.x<body.r){body.x=body.r;body.vx=Math.abs(body.vx)*.75}if(body.x>width-body.r){body.x=width-body.r;body.vx=-Math.abs(body.vx)*.75}
     if(body.y>height-body.r){body.y=height-body.r;body.vy=-Math.abs(body.vy)*.63;if(Math.abs(body.vy)<.7)body.vy=0;body.vx*=.97}
     if(body.y< -body.r*2&&body.vy<0){body.y=-body.r*2;body.vy=0}
    });
    for(let a=0;a<values.length;a++)for(let b=a+1;b<values.length;b++){
     const one=values[a],two=values[b];if(elapsed<one.delay||elapsed<two.delay)continue;
     const dx=two.x-one.x,dy=two.y-one.y,distance=Math.hypot(dx,dy)||.01,min=one.r+two.r+2;
     if(distance>=min)continue;const nx=dx/distance,ny=dy/distance,overlap=min-distance;const heldA=drag.current?.index===a,heldB=drag.current?.index===b;
     if(!heldA){one.x-=nx*overlap*(heldB?1:.5);one.y-=ny*overlap*(heldB?1:.5)}if(!heldB){two.x+=nx*overlap*(heldA?1:.5);two.y+=ny*overlap*(heldA?1:.5)}
     const speed=(two.vx-one.vx)*nx+(two.vy-one.vy)*ny;if(speed<0){const impulse=-speed*.78;if(!heldA){one.vx-=impulse*nx;one.vy-=impulse*ny}if(!heldB){two.vx+=impulse*nx;two.vy+=impulse*ny}}
    }
    values.forEach((body,i)=>{if(elapsed<body.delay)return;body.x=clamp(body.x,body.r,width-body.r);body.y=Math.min(body.y,height-body.r);const button=buttons.current[i];if(button)button.style.transform=`translate3d(${body.x-body.r}px,${body.y-body.r}px,0)`});
   }
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',updateVisibility);resizeObserver.disconnect();drag.current=null;buttons.current.forEach(button=>{if(button){button.style.removeProperty('width');button.style.removeProperty('height');button.style.removeProperty('transform')}})};
 },[replay,reduced]);
 const pointerDown=(event:PointerEvent<HTMLButtonElement>,index:number)=>{
  if(!motion||paused||event.button!==0)return;const body=bodies.current[index];if(!body)return;
  event.currentTarget.setPointerCapture(event.pointerId);const rect=stage.current!.getBoundingClientRect();drag.current={index,ox:event.clientX-rect.left-body.x,oy:event.clientY-rect.top-body.y,lastX:event.clientX,lastY:event.clientY,time:performance.now(),moved:false};body.vx=0;body.vy=0;suppressClick.current=false;
 };
 const pointerMove=(event:PointerEvent<HTMLButtonElement>)=>{
  const held=drag.current;if(!held)return;const body=bodies.current[held.index],rect=stage.current!.getBoundingClientRect(),now=performance.now(),dt=Math.max(now-held.time,8);
  if(Math.hypot(event.clientX-held.lastX,event.clientY-held.lastY)>2)held.moved=true;
  body.x=clamp(event.clientX-rect.left-held.ox,body.r,bounds.current.width-body.r);body.y=clamp(event.clientY-rect.top-held.oy,body.r,bounds.current.height-body.r);
  body.vx=clamp((event.clientX-held.lastX)/dt*16,-14,14);body.vy=clamp((event.clientY-held.lastY)/dt*16,-14,14);held.lastX=event.clientX;held.lastY=event.clientY;held.time=now;
 };
 const pointerUp=(event:PointerEvent<HTMLButtonElement>)=>{if(!drag.current)return;suppressClick.current=drag.current.moved;drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)};
 const chosen=selected===null?null:skills[selected];
 return <section id="skills-playground" className="skills-cinema" aria-labelledby="skills-cinema-title"><PaperEdges/><div className="ref-container">
  <div className="skills-cinema-heading"><div><span className="maker-kicker">THE TOOLS BEHIND THE MAKING</span><h2 id="skills-cinema-title">A little skill.<br/><i>A lot of possibility.</i></h2></div><div className="skills-cinema-intro"><p>Different tools. Endless ways to bring an idea to life.</p><span id="skills-instructions">{reduced?'Choose a skill to explore it.':'Grab a bubble. Give it a little momentum. Or tap to explore.'}</span></div></div>
  <div className="skills-stage-shell"><div className="skills-stage-top"><span><i aria-hidden="true"/>THE SKILLS PLAYGROUND</span><div className="skills-stage-controls"><button type="button" disabled={reduced} onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume skill animation':'Pause skill animation'}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?'Play':'Pause'}</span></button><button type="button" disabled={reduced} onClick={()=>{setPaused(false);setReplay(value=>value+1)}} aria-label="Replay falling skills"><RotateCcw size={15}/><span>Replay</span></button></div></div>
  <div ref={stage} className={`skills-stage ${motion&&!reduced?'skills-physics':''}`} aria-describedby="skills-instructions"><span className="skills-backdrop-word" aria-hidden="true">MAKE<br/><i>it happen.</i></span>{skills.map((skill,i)=><button type="button" key={skill.name} ref={element=>{buttons.current[i]=element}} className={`skill-bubble skill-${skill.tone}`} aria-pressed={selected===i} aria-label={`Explore ${skill.name}`} onPointerDown={event=>pointerDown(event,i)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return}setSelected(i)}} onFocus={()=>{if(motion&&!drag.current){setPaused(true);setSelected(i);const body=bodies.current[i];if(body){body.y=clamp(body.y,body.r,bounds.current.height-body.r);const button=buttons.current[i];if(button)button.style.transform=`translate3d(${body.x-body.r}px,${body.y-body.r}px,0)`}}}}><skill.icon size={22} strokeWidth={1.5} aria-hidden="true"/><strong>{skill.name}</strong><span>{skill.category}</span></button>)}</div>
  <div className="skills-stage-bottom"><div className="skills-selection" aria-live="polite"><span>{chosen?chosen.name:'Curiosity connects the dots.'}</span><p>{chosen?chosen.detail:'Select a skill to see where it fits in the work.'}</p></div><Link href="/projects">See the tools in action<ArrowUpRight size={17}/></Link></div></div>
 </div></section>;
}
