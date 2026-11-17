'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PaperEdges } from './paper-edges';
import { ArrowUpRight, Pause, Play, MoveUpRight, Code2, CircuitBoard, Database, Layers, Box, GitBranch } from 'lucide-react';

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

export function SkillsPlayground() {
 const root=useRef<HTMLElement>(null);
 const [ready,setReady]=useState(false);
 const [visible,setVisible]=useState(false);
 const [paused,setPaused]=useState(false);
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{
  setReady(true);
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(preference.matches);update();preference.addEventListener('change',update);
  const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting));
  if(root.current)observer.observe(root.current);
  return()=>{observer.disconnect();preference.removeEventListener('change',update)};
 },[]);
 const rows=[skills.slice(0,9),skills.slice(9)];
 return <section id="skills-playground" ref={root} className={`skills-cinema ${ready?'marquee-ready':''}`} data-running={ready&&visible&&!paused&&!reduced} aria-labelledby="skills-cinema-title"><PaperEdges/><div className="ref-container">
  <div className="skills-cinema-heading"><div><span className="maker-kicker">THE TOOLS BEHIND THE MAKING</span><h2 id="skills-cinema-title">A little skill.<br/><i>A lot of possibility.</i></h2></div><div className="skills-cinema-intro"><p>Code, circuits and creative thinking. Plenty of ways to bring your ideas to life.</p><span>{reduced?'Explore the collection at your own pace.':'Two rows. Always moving. Hover to take a closer look.'}</span></div></div>
  <div className="skills-marquee-shell"><div className="skills-marquee-top"><span><i aria-hidden="true"/>A WHOLE MIX OF POSSIBILITIES</span><button type="button" disabled={!ready||reduced} onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume skills marquee':'Pause skills marquee'}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?'Resume':'Pause'}</span></button></div>
  <div className="skills-marquee-canvas">{rows.map((row,index)=><div className={`skills-lane skills-lane-${index+1}`} key={index}><div className="skills-strip">{[false,true].map(copy=><ul key={String(copy)} className={`skills-strip-group ${copy?'skills-clone':''}`} aria-hidden={copy||undefined} aria-label={copy?undefined:index===0?'Software and connected-device skills':'Systems and creative skills'}>{row.map(skill=><li className={`skill-pill skill-${skill.tone}`} key={skill.name}><span className="skill-pill-icon"><skill.icon size={24} strokeWidth={1.5} aria-hidden="true"/></span><span><strong>{skill.name}</strong><small>{skill.category}</small></span></li>)}</ul>)}</div></div>)}</div>
  <div className="skills-marquee-bottom"><p>Different tools. One curious builder.</p><Link href="/projects">See the skills in action<ArrowUpRight size={17}/></Link></div></div>
 </div></section>;
}
