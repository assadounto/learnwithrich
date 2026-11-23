import type {ReactNode} from 'react';

const uuid = '[a-f\\d]{8}-(?:[a-f\\d]{4}-){3}[a-f\\d]{12}';
const mediaUri = new RegExp(`^media:\\/\\/(${uuid})$`, 'i');

function safeHttps(value: string) {
  try {const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;} catch {return null;}
}
export function youtubeId(value: string) {
  try {
    const url = new URL(value);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be', 'www.youtu.be'].includes(url.hostname)) return null;
    const id = url.hostname.endsWith('youtu.be') ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {return null;}
}

type RichMarkdownProps = {text: string; resourceSlug?: string; adminPreview?: boolean; packageFiles?: Record<string, string>; className?: string};
function mediaUrl(value: string, resourceSlug?: string, adminPreview = false, packageFiles?: Record<string, string>) {
  const match = mediaUri.exec(value);
  if (!match) {
    if (value.startsWith('package-file:')) return packageFiles?.[value.slice('package-file:'.length)] ?? null;
    return safeHttps(value);
  }
  if (adminPreview) return `/api/media/${match[1]}`;
  return resourceSlug ? `/api/resource-assets/${match[1]}?slug=${encodeURIComponent(resourceSlug)}` : null;
}
function YoutubePreview({id}: {id: string}) {
  return <div className="rich-markdown-video"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title="YouTube video preview" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div>;
}
function inline(text: string, resourceSlug?: string, adminPreview = false, packageFiles?: Record<string, string>): ReactNode[] {
  const pattern = /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const out: ReactNode[] = []; let last = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const value = match[0], key = `inline-${match.index}`;
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(value);
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
    if (image) {
      const src = mediaUrl(image[2], resourceSlug, adminPreview, packageFiles);
      const kind = /^(audio|video):\s*/i.exec(image[1]);
      const label = image[1].replace(/^(audio|video):\s*/i, '') || 'Attached media';
      if (src?.startsWith('#')) out.push(<a key={key} href={src}>{label}</a>);
      else if (src && kind?.[1].toLowerCase() === 'audio') out.push(<figure className="rich-markdown-attachment" key={key}><figcaption>{label}</figcaption><audio controls preload="none" src={src}>Audio playback is not supported by this browser.</audio></figure>);
      else if (src && kind?.[1].toLowerCase() === 'video') out.push(<figure className="rich-markdown-attachment" key={key}><figcaption>{label}</figcaption><video controls preload="metadata" playsInline src={src}>Video playback is not supported by this browser.</video></figure>);
      else if (src) out.push(<img className="rich-markdown-image" key={key} src={src} alt={image[1] || 'Resource image'} loading="lazy"/>);
      else out.push(image[1]);
    } else if (link) {
      const href = safeHttps(link[2]) ?? mediaUrl(link[2], resourceSlug, adminPreview, packageFiles);
      if (href) out.push(<a key={key} href={href} target={href.startsWith('#') ? undefined : '_blank'} rel={href.startsWith('#') ? undefined : 'noreferrer'}>{link[1]}</a>);
      else out.push(link[1]);
    } else if (value.startsWith('**')) out.push(<strong key={key}>{value.slice(2, -2)}</strong>);
    else if (value.startsWith('`')) out.push(<code key={key}>{value.slice(1, -1)}</code>);
    else out.push(<em key={key}>{value.slice(1, -1)}</em>);
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichMarkdown({text, resourceSlug, adminPreview = false, packageFiles, className = ''}: RichMarkdownProps) {
  const lines = text.split(/\r?\n/), blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    if (!line.trim()) {index++; continue;}
    if (/^```/.test(line)) {const code: string[] = []; index++; while (index < lines.length && !/^```/.test(lines[index])) code.push(lines[index++]); index++; blocks.push(<pre key={`code-${index}`}><code>{code.join('\n')}</code></pre>); continue;}
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {const Tag = `h${Math.min(heading[1].length + 1, 5)}` as 'h2'|'h3'|'h4'|'h5'; blocks.push(<Tag key={`heading-${index}`}>{inline(heading[2], resourceSlug, adminPreview, packageFiles)}</Tag>); index++; continue;}
    const linkVideo = /^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/.exec(line.trim());
    if (linkVideo) {const href = safeHttps(linkVideo[2]), id = href && youtubeId(href); if (href) blocks.push(<p key={`youtube-link-${index}`}><a href={href} target="_blank" rel="noreferrer">{linkVideo[1]}</a></p>); if (id) blocks.push(<YoutubePreview key={`youtube-${index}`} id={id}/>); index++; continue;}
    const youtube = youtubeId(line.trim());
    if (youtube) {blocks.push(<YoutubePreview key={`youtube-${index}`} id={youtube}/>); index++; continue;}
    if (/^\s*[-*+]\s+/.test(line)) {const entries: string[] = []; while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) entries.push(lines[index++].replace(/^\s*[-*+]\s+/, '')); blocks.push(<ul key={`list-${index}`}>{entries.map((entry, item) => <li key={item}>{inline(entry, resourceSlug, adminPreview, packageFiles)}</li>)}</ul>); continue;}
    if (/^\s*\d+[.)]\s+/.test(line)) {const entries: string[] = []; while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) entries.push(lines[index++].replace(/^\s*\d+[.)]\s+/, '')); blocks.push(<ol key={`ordered-${index}`}>{entries.map((entry, item) => <li key={item}>{inline(entry, resourceSlug, adminPreview, packageFiles)}</li>)}</ol>); continue;}
    if (/^>\s?/.test(line)) {const quote: string[] = []; while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, '')); blocks.push(<blockquote key={`quote-${index}`}>{inline(quote.join(' '), resourceSlug, adminPreview, packageFiles)}</blockquote>); continue;}
    const paragraph: string[] = []; while (index < lines.length && lines[index].trim() && !/^(#{1,4})\s+|^```|^\s*[-*+]\s+|^\s*\d+[.)]\s+|^>\s?/.test(lines[index])) paragraph.push(lines[index++]); blocks.push(<p key={`paragraph-${index}`}>{inline(paragraph.join('\n'), resourceSlug, adminPreview, packageFiles)}</p>);
  }
  return <div className={`rich-markdown ${className}`.trim()}>{blocks}</div>;
}
