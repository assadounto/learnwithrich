import { Quote, MessageCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { DrawnUnderline } from './decorative-marks';

// Layout examples only. Replace with permissioned, verbatim recommendations
// and real attribution before presenting these as endorsements.
const examples = [
 { quote: 'The explanation made a difficult idea feel like something I could actually build.', name: 'Learner name', role: 'Electronics learner · placeholder', initial: 'L', label: 'A LITTLE CONFIDENCE TO BEGIN' },
 { quote: 'Clear thinking, thoughtful work and a willingness to share the process.', name: 'Collaborator name', role: 'Project collaborator · placeholder', initial: 'C', label: 'BETTER THINGS, TOGETHER' },
 { quote: 'I came for a project idea. I left with a clearer plan for making it happen.', name: 'Maker name', role: 'Fellow maker · placeholder', initial: 'M', label: 'FROM CURIOUS TO CREATING' },
];

export function HomeTestimonials() {
 return <section className="maker-testimonials" aria-labelledby="testimonials-title">
  <div className="ref-container">
   <div className="testimonials-heading home-reveal">
    <div><span className="maker-kicker">WORDS FROM PEOPLE</span><h2 id="testimonials-title">A few words.<br/><i>A little encouragement.</i><DrawnUnderline className="orange-scribble"/></h2></div>
    <div className="testimonials-intro"><MessageCircle size={28} strokeWidth={1.4} aria-hidden="true"/><p>A place for honest feedback from learners, collaborators and fellow makers.</p><span className="testimonials-preview">Design preview · sample quotes</span></div>
   </div>
   <div className="testimonials-grid">{examples.map((example, index) => <figure key={example.initial} className={`testimonial-card home-reveal ${index === 0 ? 'testimonial-featured' : ''}`}>
    <div className="testimonial-top"><Quote size={32} strokeWidth={1.2} aria-hidden="true"/><span>Sample quote</span></div>
    <span className="testimonial-label">{example.label}</span>
    <blockquote><p>“{example.quote}”</p></blockquote>
    <figcaption><span className="testimonial-avatar" aria-hidden="true">{example.initial}</span><span><strong>{example.name}</strong><small>{example.role}</small></span></figcaption>
   </figure>)}</div>
   <div className="testimonials-footnote"><p>These are layout examples. Real recommendations will appear here with the author’s permission.</p><Link href="/about" className="text-link">Meet Richmond<ArrowUpRight size={15} aria-hidden="true"/></Link></div>
  </div>
 </section>;
}
