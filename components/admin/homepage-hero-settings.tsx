'use client';

import {useState, useTransition} from 'react';
import {Clock3, Image, Layers3, Save, Sparkles, Trash2, Video} from 'lucide-react';
import {homepageHeroMedia, type HomepageHeroEditor, type HomepageHeroPreset} from '@/lib/home-hero';
import {saveHomepageHero} from '@/app/admin/actions';
import {MediaLibraryModal} from './media-library-modal';
import {useAdminDirty} from './workspace-shell';

type MediaSlot = (typeof homepageHeroMedia)[number];
const presets = [
  {id: 'CLASSIC', title: 'Maker collage', text: 'Copy on the left with artwork alongside.', icon: Image},
  {id: 'CENTERED', title: 'Centered focus', text: 'Centered text over full-width media.', icon: Sparkles},
  {id: 'CINEMATIC', title: 'Cinematic reveal', text: 'Open with artwork, then center the message over video.', icon: Video},
  {id: 'SPOTLIGHT', title: 'Spotlight', text: 'Left-aligned copy over full-width media.', icon: Sparkles},
  {id: 'EDITORIAL', title: 'Editorial split', text: 'Framed media on the left, with copy on the right.', icon: Layers3},
] satisfies {id: HomepageHeroPreset; title: string; text: string; icon: typeof Image}[];

export function HomepageHeroSettings({initialHero}: {initialHero: HomepageHeroEditor}) {
  const [hero, setHero] = useState(initialHero);
  const [baseline, setBaseline] = useState(initialHero);
  const [picker, setPicker] = useState<MediaSlot | null>(null);
  const [message, setMessage] = useState<{text: string; success: boolean}>();
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(hero) !== JSON.stringify(baseline);
  const hasVideo = Boolean(hero.videoAssetId || hero.mobileVideoAssetId);
  const requiresVideo = hero.preset === 'CINEMATIC' && !hasVideo;
  useAdminDirty(dirty);

  function update(patch: Partial<HomepageHeroEditor>) {
    setHero(current => ({...current, ...patch}));
    setMessage(undefined);
  }

  function save() {
    startTransition(async () => {
      const result = await saveHomepageHero(
        Object.fromEntries([
          ['preset', hero.preset], ['delaySeconds', hero.delaySeconds], ['videoEnabled', hero.videoEnabled],
          ...homepageHeroMedia.map(slot => [slot.field, hero[slot.field]]),
        ]),
      );
      setMessage({success: result.ok, text: result.ok ? 'Hero saved.' : result.error});
      if (result.ok) setBaseline(hero);
    });
  }

  return <section className="homepage-hero-settings" aria-labelledby="homepage-hero-title">
    <header><div><h2 id="homepage-hero-title">Homepage hero</h2><p>Choose a layout, then set the hero media for desktop and mobile.</p></div>
      <button className="button button-dark" type="button" onClick={save} disabled={pending || !dirty || requiresVideo}>
        <Save size={16}/>{pending ? 'Saving…' : 'Save hero'}
      </button>
    </header>
    <div className="homepage-hero-presets" role="group" aria-label="Hero layout">
      {presets.map(({id, title, text, icon: Icon}) => <button key={id} type="button" aria-pressed={hero.preset === id} className={`homepage-hero-preset${hero.preset === id ? ' is-selected' : ''}`} onClick={() => update({preset: id})}>
        <span className="homepage-hero-preset-icon"><Icon size={19}/></span><strong>{title}</strong><span>{text}</span>
      </button>)}
    </div>
    <div className="homepage-hero-video-settings">
      <p className="homepage-hero-note">Mobile uses desktop media when its own slot is empty. With no image selected, the maker collage is used. Images stay visible while video loads and when reduced motion or data saver is enabled.</p>
      {homepageHeroMedia.map(slot => {
        const Icon = slot.kind === 'image' ? Image : Video;
        return <div key={slot.field} className="homepage-hero-video-choice">
          <div className="homepage-hero-video-icon"><Icon size={19}/></div>
          <div><strong>{slot.label}</strong><span>{hero[slot.name] ?? 'None selected'}</span></div>
          <div className="homepage-hero-video-actions">
            <button type="button" className="button button-outline" aria-label={`${hero[slot.field] ? 'Replace' : 'Choose'} ${slot.label.toLowerCase()}`} onClick={() => setPicker(slot)}>
              {hero[slot.field] ? 'Replace' : 'Choose'}
            </button>
            {hero[slot.field] && <button type="button" className="homepage-hero-remove" onClick={() => update({[slot.field]: null, [slot.name]: null})} aria-label={`Remove ${slot.label.toLowerCase()}`}><Trash2 size={16}/></button>}
          </div>
        </div>;
      })}
      {hero.preset !== 'CINEMATIC' && hasVideo && <label className="homepage-hero-delay">
        <span>Play video when available</span>
        <input type="checkbox" checked={hero.videoEnabled} onChange={event => update({videoEnabled: event.target.checked})}/>
      </label>}
      {hasVideo && (hero.videoEnabled || hero.preset === 'CINEMATIC') && <label className="homepage-hero-delay"><span><Clock3 size={16}/>Delay before video</span>
        <select value={hero.delaySeconds} onChange={event => update({delaySeconds: Number(event.target.value)})}>
          {Array.from({length: 10}, (_, index) => index + 3).map(seconds => <option key={seconds} value={seconds}>{seconds} seconds</option>)}
        </select>
      </label>}
      {requiresVideo && <p className="homepage-hero-error" role="status">Select a video to enable the cinematic reveal.</p>}
    </div>
    {message && <p className={`homepage-save-message${message.success ? ' success' : ''}`} role="status">{message.text}</p>}
    <MediaLibraryModal open={picker !== null} filter={picker?.kind ?? 'image'} onClose={() => setPicker(null)} onSelect={(_url, asset) => {
      if (picker) update({[picker.field]: asset.id, [picker.name]: asset.originalName, ...(picker.kind === 'video' ? {videoEnabled: true} : {})});
      setPicker(null);
    }}/>
  </section>;
}
