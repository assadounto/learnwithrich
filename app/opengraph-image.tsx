import {ImageResponse} from 'next/og';

export const alt = 'LearnWithRich — learn it, build it, make it real';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: '#f5f0e6', color: '#1d2823', padding: '72px', fontFamily: 'Arial, sans-serif'}}>
      <div style={{position: 'absolute', right: '-70px', top: '-140px', width: '600px', height: '600px', borderRadius: '50%', background: '#e8a15b', display: 'flex', opacity: 0.72}} />
      <div style={{position: 'absolute', right: '70px', bottom: '-260px', width: '520px', height: '520px', borderRadius: '50%', background: '#52694d', display: 'flex', opacity: 0.95}} />
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', width: '100%'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', fontSize: 28, fontWeight: 700, letterSpacing: '-1px'}}>
          <div style={{display: 'flex', width: 46, height: 46, borderRadius: 14, background: '#dd6c3b', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 25}}>R</div>
          LearnWithRich
        </div>
        <div style={{display: 'flex', flexDirection: 'column', maxWidth: 810}}>
          <div style={{fontSize: 22, letterSpacing: 4, fontWeight: 700, color: '#52694d', marginBottom: 18}}>LEARN · BUILD · SHARE</div>
          <div style={{fontSize: 76, lineHeight: 1.05, letterSpacing: -3, fontWeight: 700}}>A little curiosity.<br/>A lot of possibility.</div>
          <div style={{fontSize: 28, color: '#47534d', marginTop: 26}}>Projects, ideas and practical learning by Richmond Adu-Kyere.</div>
        </div>
        <div style={{fontSize: 20, color: '#526052'}}>learnwithrich.com</div>
      </div>
    </div>,
    {...size},
  );
}
