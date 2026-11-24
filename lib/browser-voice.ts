import {voiceMaxBytes} from './service-offerings';

export function voiceFile(blob: Blob) {
  if (!blob.size || blob.size > voiceMaxBytes) throw new Error('Choose an audio file smaller than 8 MB.');
  const mime = blob.type.toLowerCase().split(';')[0];
  const ext = ({
    'audio/webm': 'weba', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
    'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav',
  } as Record<string, string>)[mime];
  if (ext) return new File([blob], `voice-brief.${ext}`, {type: mime});
  if (blob instanceof File && /\.(weba|webm|m4a|mp3|ogg|wav)$/i.test(blob.name)) return blob;
  throw new Error('Use an MP3, M4A, WAV, OGG, or WebM audio file.');
}
