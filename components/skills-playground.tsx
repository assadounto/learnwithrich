'use client';

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/navigation-link';
import { PaperEdges } from './paper-edges';
import { ArrowUpRight, Pause, Play } from 'lucide-react';

const skills = [
 { name: 'Rails', tone: 'orange' },
 { name: 'Next.js', tone: 'cream' },
 { name: 'React Native', tone: 'olive' },
 { name: 'TypeScript', tone: 'glass' },
 { name: 'ESP32', tone: 'orange' },
 { name: 'PostgreSQL', tone: 'cream' },
 { name: 'Ruby', tone: 'glass' },
 { name: 'JavaScript', tone: 'olive' },
 { name: 'Docker', tone: 'cream' },
 { name: 'IoT', tone: 'olive' },
 { name: 'Redis', tone: 'glass' },
 { name: 'Sidekiq', tone: 'orange' },
 { name: 'Git', tone: 'olive' },
 { name: 'APIs', tone: 'cream' },
 { name: 'Electronics', tone: 'glass' },
 { name: 'UI design', tone: 'orange' },
 { name: 'Sensors', tone: 'cream' },
 { name: 'Documentation', tone: 'olive' },
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
  <div className="skills-marquee-canvas">{rows.map((row,index)=><div className={`skills-lane skills-lane-${index+1}`} key={index}><div className="skills-strip">{[false,true].map(copy=><ul key={String(copy)} className={`skills-strip-group ${copy?'skills-clone':''}`} aria-hidden={copy||undefined} aria-label={copy?undefined:index===0?'Software and connected-device skills':'Systems and creative skills'}>{row.map(skill=><li className={`skill-pill skill-${skill.tone}`} key={skill.name}><strong>{skill.name}</strong></li>)}</ul>)}</div></div>)}</div>
  <div className="skills-marquee-bottom"><p>Different tools. One curious builder.</p><Link href="/projects">See the skills in action<ArrowUpRight size={17}/></Link></div></div>
 </div></section>;
}
