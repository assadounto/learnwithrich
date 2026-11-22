'use client';

import {useState, useTransition} from 'react';
import {Clock3, Image, Save, Sparkles, Trash2, Video} from 'lucide-react';
import {MediaLibraryModal} from './media-library-modal';
import {saveHomepageHero} from '@/app/admin/actions';
import {useAdminDirty} from './workspace-shell';

type Preset = 'CLASSIC' | 'CENTERED' | 'CINEMATIC';
type Hero = {preset: Preset; videoAssetId: string | null; videoName: string | null; delaySeconds: number};

const presets: {id: Preset; title: string; text: string; icon: typeof Image}[] = [
  {id: 'CLASSIC', title: 'Maker collage', text: 'Keep the current left-copy and collage layout.', icon: Image},
  {id: 'CENTERED', title: 'Centered focus', text: 'Start with the message and buttons centered.', icon: Sparkles},
  {id: 'CINEMATIC', title: 'Cinematic reveal', text: 'After a short pause, center the message and reveal your video.', icon: Video},
];

export function HomepageHeroSettings({initialHero}: {initialHero: Hero}) {
  const [hero, setHero] = useState(initialHero);
  const [baseline, setBaseline] = useState(JSON.stringify(initialHero));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(hero) !== baseline;
  useAdminDirty(dirty);
  function update(patch: Partial<Hero>) {setHero(current => ({...current, ...patch})); setMessage('');}
  function save() {startTransition(async () => {const result = await saveHomepageHero({preset: hero.preset, videoAssetId: hero.videoAssetId, delaySeconds: hero.delaySeconds}); setMessage(result.ok ? 'Hero experience saved.' : result.error); if (result.ok) setBaseline(JSON.stringify(hero));});}

  return <section className="homepage-hero-settings" aria-labelledby="homepage-hero-title">
    <header><div><span className="admin-kicker">FIRST IMPRESSION</span><h2 id="homepage-hero-title">Homepage hero</h2><p>Choose how the opening message and maker collage appear to visitors.</p></div><button className="button button-dark" type="button" onClick={save} disabled={pending || !dirty || hero.preset === 'CINEMATIC' && !hero.videoAssetId}><Save size={16}/>{pending ? 'Saving…' : 'Save hero'}</button></header>
    <div className="homepage-hero-presets" role="radiogroup" aria-label="Hero presentation preset">{presets.map(({id, title, text, icon: Icon})=><button key={id} type="button" role="radio" aria-checked={hero.preset === id} className={`homepage-hero-preset${hero.preset === id ? ' is-selected' : ''}`} onClick={()=>update({preset: id})}><span className="homepage-hero-preset-icon"><Icon size={19}/></span><strong>{title}</strong><span>{text}</span></button>)}</div>
    {hero.preset === 'CINEMATIC' && <div className="homepage-hero-video-settings"><div className="homepage-hero-video-choice"><div className="homepage-hero-video-icon"><Video size={19}/></div><div><strong>{hero.videoName || 'No background video selected'}</strong><span>{hero.videoName ? 'Muted, looping, and only shown on the public homepage.' : 'Choose an MP4 or WebM video from the media library.'}</span></div><div className="homepage-hero-video-actions"><button type="button" className="button button-outline" onClick={()=>setPickerOpen(true)}><Video size={15}/>{hero.videoAssetId ? 'Replace video' : 'Choose video'}</button>{hero.videoAssetId && <button type="button" className="homepage-hero-remove" onClick={()=>update({videoAssetId: null, videoName: null})} aria-label="Remove background video"><Trash2 size={16}/></button>}</div></div>
      <label className="homepage-hero-delay"><span><Clock3 size={16}/>Wait before the reveal</span><select value={hero.delaySeconds} onChange={event=>update({delaySeconds: Number(event.target.value)})}>{[3,4,5,6,8,10,12].map(value=><option key={value} value={value}>{value} seconds</option>)}</select></label>
      <p className="homepage-hero-note">The current hero stays visible first. The message then moves to the center, the collage expands, and the video fades in and plays without sound.</p>
      {!hero.videoAssetId && <p className="homepage-hero-error" role="status">Select a video before saving the cinematic preset.</p>}
    </div>}
    {message && <p className={`homepage-save-message${message === 'Hero experience saved.' ? ' success' : ''}`} role="status">{message}</p>}
    <MediaLibraryModal open={pickerOpen} filter="video" onClose={()=>setPickerOpen(false)} onSelect={(_url, asset)=>{update({videoAssetId: asset.id, videoName: asset.originalName});setPickerOpen(false);}}/>
  </section>;
}
