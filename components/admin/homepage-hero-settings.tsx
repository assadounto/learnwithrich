'use client';

import {useState, useTransition} from 'react';
import {Clock3, Image, Save, Sparkles, Trash2, Video} from 'lucide-react';
import {MediaLibraryModal} from './media-library-modal';
import {saveHomepageHero} from '@/app/admin/actions';
import {useAdminDirty} from './workspace-shell';

type Preset = 'CLASSIC' | 'CENTERED' | 'CINEMATIC';
type Hero = {preset: Preset; imageAssetId: string | null; imageName: string | null; videoAssetId: string | null; videoName: string | null; delaySeconds: number};

const presets: {id: Preset; title: string; text: string; icon: typeof Image}[] = [
  {id: 'CLASSIC', title: 'Maker collage', text: 'Keep the current left-copy and collage layout.', icon: Image},
  {id: 'CENTERED', title: 'Centered focus', text: 'Fill the hero with your image and center the message.', icon: Sparkles},
  {id: 'CINEMATIC', title: 'Cinematic reveal', text: 'Center the message, then reveal your full-bleed video.', icon: Video},
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
  function save() {startTransition(async () => {const result = await saveHomepageHero({preset: hero.preset, imageAssetId: hero.imageAssetId, videoAssetId: hero.videoAssetId, delaySeconds: hero.delaySeconds}); setMessage(result.ok ? 'Hero experience saved.' : result.error); if (result.ok) setBaseline(JSON.stringify(hero));});}

  return <section className="homepage-hero-settings" aria-labelledby="homepage-hero-title">
    <header><div><span className="admin-kicker">FIRST IMPRESSION</span><h2 id="homepage-hero-title">Homepage hero</h2><p>Choose the layout and background media visitors see when they arrive.</p></div><button className="button button-dark" type="button" onClick={save} disabled={pending || !dirty || hero.preset === 'CINEMATIC' && !hero.videoAssetId || hero.preset === 'CENTERED' && !hero.imageAssetId}><Save size={16}/>{pending ? 'Saving…' : 'Save hero'}</button></header>
    <div className="homepage-hero-presets" role="radiogroup" aria-label="Hero presentation preset">{presets.map(({id, title, text, icon: Icon})=><button key={id} type="button" role="radio" aria-checked={hero.preset === id} className={`homepage-hero-preset${hero.preset === id ? ' is-selected' : ''}`} onClick={()=>update({preset: id})}><span className="homepage-hero-preset-icon"><Icon size={19}/></span><strong>{title}</strong><span>{text}</span></button>)}</div>
    {hero.preset === 'CENTERED' && <div className="homepage-hero-video-settings"><div className="homepage-hero-video-choice"><div className="homepage-hero-video-icon"><Image size={19}/></div><div><strong>{hero.imageName || 'No hero background image selected'}</strong><span>{hero.imageName ? 'Shown full-width as the background for the centered hero.' : 'Choose a background image from the media library.'}</span></div><div className="homepage-hero-video-actions"><button type="button" className="button button-outline" onClick={()=>setPickerOpen(true)}><Image size={15}/>{hero.imageAssetId ? 'Replace image' : 'Choose image'}</button>{hero.imageAssetId && <button type="button" className="homepage-hero-remove" onClick={()=>update({imageAssetId: null, imageName: null})} aria-label="Remove background image"><Trash2 size={16}/></button>}</div></div>{!hero.imageAssetId && <p className="homepage-hero-error" role="status">Select a background image before saving the centered preset.</p>}</div>}
    {hero.preset === 'CINEMATIC' && <div className="homepage-hero-video-settings"><div className="homepage-hero-video-choice"><div className="homepage-hero-video-icon"><Video size={19}/></div><div><strong>{hero.videoName || 'No background video selected'}</strong><span>{hero.videoName ? 'Muted, looping, and shown full-width on the public homepage.' : 'Choose an MP4 or WebM video from the media library.'}</span></div><div className="homepage-hero-video-actions"><button type="button" className="button button-outline" onClick={()=>setPickerOpen(true)}><Video size={15}/>{hero.videoAssetId ? 'Replace video' : 'Choose video'}</button>{hero.videoAssetId && <button type="button" className="homepage-hero-remove" onClick={()=>update({videoAssetId: null, videoName: null})} aria-label="Remove background video"><Trash2 size={16}/></button>}</div></div>
      <label className="homepage-hero-delay"><span><Clock3 size={16}/>Wait before the reveal</span><select value={hero.delaySeconds} onChange={event=>update({delaySeconds: Number(event.target.value)})}>{[3,4,5,6,8,10,12].map(value=><option key={value} value={value}>{value} seconds</option>)}</select></label>
      <p className="homepage-hero-note">The current collage stays visible while the video buffers. Once it can play through, the message glides to center and the video fades in as the collage fades away. An optimized 1080p MP4 or WebM helps playback stay smooth.</p>
      {!hero.videoAssetId && <p className="homepage-hero-error" role="status">Select a video before saving the cinematic preset.</p>}
    </div>}
    {message && <p className={`homepage-save-message${message === 'Hero experience saved.' ? ' success' : ''}`} role="status">{message}</p>}
    <MediaLibraryModal open={pickerOpen} filter={hero.preset === 'CENTERED' ? 'image' : 'video'} onClose={()=>setPickerOpen(false)} onSelect={(_url, asset)=>{if (hero.preset === 'CENTERED') update({imageAssetId: asset.id, imageName: asset.originalName}); else update({videoAssetId: asset.id, videoName: asset.originalName});setPickerOpen(false);}}/>
  </section>;
}
