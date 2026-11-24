'use client';

import {useEffect, useRef, useState} from 'react';
import {Mic, Square, Trash2, Upload} from 'lucide-react';
import {voiceFile} from '@/lib/browser-voice';
import {voiceMaxBytes, voiceMaxSeconds} from '@/lib/service-offerings';

const formats = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'];

export function ServiceVoiceRecorder({file, onChange, onRecording, disabled}: {
  file: File | null; onChange: (file: File | null) => void; onRecording: (active: boolean) => void; disabled: boolean;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'permission' | 'recording' | 'finishing'>('idle');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const active = recorder.current;
      if (active && active.state !== 'inactive') active.stop();
      stream.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!file) {setPreview(''); return;}
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (state !== 'recording') return;
    const started = performance.now();
    const timer = window.setInterval(() => setSeconds(Math.min(voiceMaxSeconds, Math.floor((performance.now() - started) / 1000))), 250);
    const stop = window.setTimeout(() => {
      if (recorder.current?.state === 'recording') {setState('finishing'); recorder.current.stop();}
    }, voiceMaxSeconds * 1000);
    return () => {window.clearInterval(timer); window.clearTimeout(stop);};
  }, [state]);

  function accept(blob: Blob) {
    try {onChange(voiceFile(blob)); setError('');}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Could not prepare that audio file.');}
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is unavailable in this browser. You can upload an audio file.');
      return;
    }
    setState('permission'); onRecording(true); setError('');
    try {
      const input = await navigator.mediaDevices.getUserMedia({audio: true});
      if (!mounted.current) {input.getTracks().forEach(track => track.stop()); return;}
      stream.current = input;
      const mimeType = formats.find(format => MediaRecorder.isTypeSupported(format));
      const active = new MediaRecorder(input, {audioBitsPerSecond: 64_000, ...(mimeType ? {mimeType} : {})});
      recorder.current = active;
      const chunks: Blob[] = [];
      let bytes = 0;
      let failed = false;
      active.ondataavailable = event => {
        bytes += event.data.size;
        if (bytes > voiceMaxBytes) {
          failed = true;
          if (active.state !== 'inactive') active.stop();
          if (mounted.current) setError('The recording reached the 8 MB limit. Try a shorter take.');
          return;
        }
        if (event.data.size) chunks.push(event.data);
      };
      active.onerror = () => {failed = true; if (mounted.current) setError('Recording stopped unexpectedly. Try again or upload audio.');};
      active.onstop = () => {
        input.getTracks().forEach(track => track.stop());
        recorder.current = null;
        stream.current = null;
        if (!mounted.current) return;
        if (!failed) accept(new Blob(chunks, {type: chunks[0]?.type || active.mimeType}));
        setState('idle'); onRecording(false);
      };
      setSeconds(0);
      active.start(250);
      setState('recording');
    } catch {
      stream.current?.getTracks().forEach(track => track.stop());
      stream.current = null;
      if (!mounted.current) return;
      setState('idle'); onRecording(false);
      setError('Could not start the microphone. Check your permissions or upload audio.');
    }
  }

  return <div className="voice-brief-recorder">
    <p>Record up to 3 minutes or upload an audio file up to 8 MB. You can listen before sending.</p>
    {preview && <audio controls preload="metadata" src={preview} aria-label="Preview your voice note"/>}
    <div className="voice-brief-actions">
      {state === 'recording' ? <button className="button button-dark" type="button" onClick={() => {setState('finishing'); recorder.current?.stop();}}>
        <Square size={16}/>Stop recording · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </button> : <button className="button button-outline" type="button" disabled={disabled || state !== 'idle'} onClick={() => void start()}>
        <Mic size={17}/>{state === 'permission' ? 'Waiting for microphone…' : state === 'finishing' ? 'Preparing recording…' : file ? 'Record again' : 'Record voice note'}
      </button>}
      <input type="file" ref={fileInput} accept="audio/*,.weba,.m4a,.ogg,.wav,.mp3" hidden onChange={event => {
        const selected = event.currentTarget.files?.[0];
        if (selected) accept(selected);
        event.currentTarget.value = '';
      }}/>
      <button className="button button-outline" type="button" disabled={disabled || state !== 'idle'} onClick={() => fileInput.current?.click()}><Upload size={16}/>Upload audio</button>
      {file && <button className="button button-outline" type="button" disabled={disabled || state !== 'idle'} onClick={() => onChange(null)}><Trash2 size={15}/>Remove audio</button>}
    </div>
    {error && <p className="community-error" role="alert">{error}</p>}
  </div>;
}
