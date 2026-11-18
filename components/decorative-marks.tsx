/** Small, reusable vector marks. Decorative only: never part of a control label. */
export function DrawnUnderline({className=''}:{className?:string}) {
 return <svg className={`drawn-mark ${className}`} viewBox="0 0 240 16" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M2 10C48 5 121 1 184 3c20 0 38 1 54 3-50-1-96 1-142 4-35 2-67 3-94 2Z"/><path d="M17 14c60-5 129-6 190-3-50 0-119 3-190 4Z" opacity=".68"/></svg>;
}
export function AccentRays({className=''}:{className?:string}) {
 return <svg className={`drawn-rays ${className}`} viewBox="0 0 60 60" fill="none" aria-hidden="true" focusable="false"><path d="m10 3-2 18M34 14 24 29m29 10-19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
}
export function BrandAsterisk(){
 return <svg className="wordmark-asterisk" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="m14 1 5 1-1 11 10-6 3 5-11 5 10 6-3 5-10-8 1 12h-5l1-12-10 7-3-5 11-5L1 11l3-4 10 6Z" fill="currentColor"/></svg>;
}
