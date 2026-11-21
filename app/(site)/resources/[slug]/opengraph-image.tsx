import {ImageResponse} from 'next/og';
import {notFound} from 'next/navigation';
import {database} from '@/lib/server/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'LearnWithRich resource preview';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default async function ResourceOpenGraphImage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const resource = await database().resource.findFirst({
    where: {slug, status: 'PUBLISHED', publishedAt: {lte: new Date()}},
    select: {slug: true, title: true, summary: true, type: true},
  });
  if (!resource) notFound();
  const kind = resource.type.replace(/_/g, ' ');
  return new ImageResponse(
    <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', padding: '68px 76px', background: '#f5f0e6', color: '#1d2823', fontFamily: 'Arial, sans-serif'}}>
      <div style={{position: 'absolute', right: '-105px', top: '-145px', width: '570px', height: '570px', borderRadius: '50%', background: '#e8a15b', display: 'flex', opacity: 0.72}} />
      <div style={{position: 'absolute', right: '90px', bottom: '-300px', width: '530px', height: '530px', borderRadius: '50%', background: '#52694d', display: 'flex'}} />
      <div style={{display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', fontSize: 26, fontWeight: 700}}>
        <div style={{width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: '#dd6c3b', color: 'white'}}>R</div>
        LearnWithRich <span style={{fontSize: 17, letterSpacing: 3, color: '#52694d', marginLeft: 10}}>{kind.toUpperCase()}</span>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', position: 'relative', maxWidth: 930}}>
        <div style={{fontSize: resource.title.length > 52 ? 54 : 64, lineHeight: 1.1, letterSpacing: -2, fontWeight: 700}}>{resource.title}</div>
        <div style={{fontSize: 27, lineHeight: 1.35, color: '#47534d', marginTop: 25, maxWidth: 850}}>{(resource.summary || 'Explore practical ideas and learning resources by Richmond Adu-Kyere.').slice(0, 180)}</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative', fontSize: 19, color: '#526052'}}>
        <span>Richmond Adu-Kyere</span><span>learnwithrich.com</span>
      </div>
    </div>,
    {...size},
  );
}
