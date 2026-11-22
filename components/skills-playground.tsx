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

const possibilities = [
 {title:'Answer everyday questions',text:'Build helpful assistants that use trusted local guides and service information.'},
 {title:'Give small teams time back',text:'Automate repetitive bookings, follow-ups, stock updates, and paperwork.'},
 {title:'Make useful data easier to see',text:'Turn spreadsheets and records into clear dashboards and timely decisions.'},
 {title:'Notice problems earlier',text:'Use sensors and AI to spot changes in water, power, air, or equipment.'},
 {title:'Make learning more accessible',text:'Translate, summarize, caption, and explain information in useful ways.'},
 {title:'Connect services to people',text:'Make it easier to find nearby support, opportunities, and public information.'},
 {title:'Build for low bandwidth',text:'Create tools that keep working on slower networks and modest devices.'},
 {title:'Support farmers and makers',text:'Combine local knowledge with weather, crop, and market information.'},
 {title:'Improve health workflows',text:'Help teams organize appointments, reminders, and reliable health guidance.'},
 {title:'Use energy more thoughtfully',text:'Monitor consumption and help households or teams reduce avoidable waste.'},
 {title:'Prototype new ideas quickly',text:'Use code and AI to test a service, product, or process before scaling it.'},
 {title:'Explain complex ideas clearly',text:'Create visual tools that make technical, scientific, or civic information easier to act on.'},
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
  <div className="skills-cinema-heading"><div><span className="maker-kicker">SKILLS FOR A CHANGING WORLD</span><h2 id="skills-cinema-title">A little skill.<br/><i>A lot of possibility.</i></h2></div><div className="skills-cinema-intro"><p>Modern AI makes it possible to do more with practical skills, curiosity, and good judgment. Here are some problems worth solving.</p><span>Ideas to adapt for real people and local needs.</span></div></div>
  <div className="skills-possibilities" aria-label="Problems and opportunities to explore">{possibilities.map(item=><article key={item.title}><span aria-hidden="true">↗</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
  <div className="skills-marquee-shell"><div className="skills-marquee-top"><span><i aria-hidden="true"/>A WHOLE MIX OF POSSIBILITIES</span><button type="button" disabled={!ready||reduced} onClick={()=>setPaused(value=>!value)} aria-label={paused?'Resume skills marquee':'Pause skills marquee'}>{paused?<Play size={15}/>:<Pause size={15}/>}<span>{paused?'Resume':'Pause'}</span></button></div>
  <div className="skills-marquee-canvas">{rows.map((row,index)=><div className={`skills-lane skills-lane-${index+1}`} key={index}><div className="skills-strip">{[false,true].map(copy=><ul key={String(copy)} className={`skills-strip-group ${copy?'skills-clone':''}`} aria-hidden={copy||undefined} aria-label={copy?undefined:index===0?'Software and connected-device skills':'Systems and creative skills'}>{row.map(skill=><li className={`skill-pill skill-${skill.tone}`} key={skill.name}><strong>{skill.name}</strong></li>)}</ul>)}</div></div>)}</div>
  <div className="skills-marquee-bottom"><p>Different tools. One curious builder.</p><Link href="/projects">See the skills in action<ArrowUpRight size={17}/></Link></div></div>
 </div></section>;
}
