import Link from 'next/link';
export function Mark({ className = '' }: { className?: string }) {
 return <svg className={className} viewBox="0 0 100 82" fill="currentColor" aria-hidden="true"><path d="M3 0h17a4 4 0 0 1 4 4v47L44 35V4a4 4 0 0 1 4-4h22c19 0 29 11 29 27 0 12-6 21-17 25l17 24q3 6-4 6H77L64 63v19H40l39-49V23H57v6l8 4L4 81Q0 83 0 77V4Q0 0 3 0Z"/></svg>;
}
export function Brand({ light = false }: { light?: boolean }) {
 return <Link href="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="LearnWithRich home"><span>LearnWithRich<span className="wordmark-asterisk" aria-hidden="true">*</span></span></Link>;
}
