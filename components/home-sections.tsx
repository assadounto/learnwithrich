import Link from '@/components/navigation-link';
import { PaperEdges } from './paper-edges';
import { ArrowRight, ArrowUpRight, CircuitBoard, Code2, PencilRuler, FileText, Download, Plus } from 'lucide-react';
import { DrawnUnderline, AccentRays } from './decorative-marks';

const paths = [
 { icon: CircuitBoard, number: '01', title: 'Make something light up.', text: 'Start with a board, a few wires and a little curiosity. Explore electronics you can build on.', label: 'Explore electronics', href: '/resources?topic=Electronics%20%26%20IoT', className: 'path-hardware' },
 { icon: Code2, number: '02', title: 'Turn an idea into an app.', text: 'Connect the dots between an interface, an API and something useful on the other side.', label: 'Build with code', href: '/resources?topic=Software', className: 'path-software' },
 { icon: PencilRuler, number: '03', title: 'Explain it beautifully.', text: 'Find visual ideas, project outlines and resources that make a complicated idea clearer.', label: 'Find creative resources', href: '/resources?topic=Illustration', className: 'path-creative' },
];

export function MakerPaths() {
 return <section className="maker-paths ref-container" aria-labelledby="maker-paths-title">
  <div className="maker-section-intro home-reveal"><span className="maker-kicker">A GOOD PLACE TO BEGIN</span><h2 id="maker-paths-title">Pick a spark. <i>Follow it.</i><DrawnUnderline className="orange-scribble"/></h2><p>You don’t need to know everything. Just choose something you’d like to make.</p></div>
  <div className="maker-path-grid">{paths.map(path => <Link className={`maker-path home-reveal ${path.className}`} href={path.href} key={path.number}>
   <div className="maker-path-top"><path.icon size={31} strokeWidth={1.5} aria-hidden="true"/><span>{path.number}</span></div>
   <h3>{path.title}</h3><p>{path.text}</p><span className="maker-path-link">{path.label}<ArrowUpRight size={18} aria-hidden="true"/></span>
  </Link>)}</div>
 </section>;
}

export function ProjectSpotlight() {
 return <section className="maker-spotlight" aria-labelledby="spotlight-title"><PaperEdges/><div className="ref-container maker-spotlight-inner">
  <div className="spotlight-visual home-reveal"><div className="spotlight-tape" aria-hidden="true"/><div className="spotlight-project-art" role="img" aria-label="Illustrative solar controller prototype with a solar panel on a maker’s workbench"/><span className="spotlight-caption">THE CONCEPT → THE PROJECT PLAN</span><span className="spotlight-paper-label">Built to solve<br/><i>a real problem.</i></span></div>
  <div className="spotlight-copy home-reveal"><span className="maker-kicker">UNDER THE HOOD / PROJECT SPOTLIGHT</span><h2 id="spotlight-title">Sunshine, circuits<br/>and a <i>better plan.</i></h2><p>How could solar, grid and battery power work together? Explore the thinking behind a hybrid power system, from the first question to a project outline.</p>
   <ol className="spotlight-steps"><li><span>01</span><div><h3>Understand the idea</h3><p>What the system does and why each part matters.</p></div></li><li><span>02</span><div><h3>Look inside the project</h3><p>Explore the architecture and key components.</p></div></li><li><span>03</span><div><h3>Make a plan of your own</h3><p>Use the free outline to organise your next steps.</p></div></li></ol>
   <div className="spotlight-actions"><Link href="/resources/solar-hybrid-power-system" className="button button-orange">Explore the project<ArrowRight size={17} aria-hidden="true"/></Link><a className="text-link" href="/downloads/solar-project-outline.md" download><Download size={16} aria-hidden="true"/>Get the outline</a></div><p className="spotlight-download-note">Free Markdown planning sample</p>
  </div>
 </div></section>;
}

const notes = [
 { number: '01', category: 'THE FIRST STEP', title: 'Start smaller than you think.', intro: 'A useful first version beats a perfect idea that never leaves the notebook.', body: 'Choose one thing your project should do. For a connected device, that might be reading a sensor and displaying its value. Build that small loop first, then add the next feature when you can explain and repeat the result.', href: '/resources/esp32-first-connected-device', link: 'Explore the ESP32 course plan' },
 { number: '02', category: 'THE BUILD PROCESS', title: 'Your notes are part of the build.', intro: 'The wire you moved. The error you fixed. Write down the little things.', body: 'Keep a short log of your goal, what you changed and what happened. Include component names, connections and screenshots where useful. A clear record makes it easier to debug tomorrow and share the process with someone else.', href: '/downloads/energy-project-outline.md', link: 'Download a planning outline', download: true },
 { number: '03', category: 'THE FINISHING TOUCH', title: 'Make it easy to understand.', intro: 'A project becomes more useful when someone else can follow your thinking.', body: 'Show the problem, the approach and the result. Add an annotated image or a simple overview of the parts, then explain the limits of your current version. Clear documentation gives the next person a better place to begin.', href: '/resources?type=Document', link: 'Browse project documents' },
];

export function WorkbenchNotes() {
 return <section className="workbench-notes ref-container" aria-labelledby="workbench-notes-title">
  <div className="notes-heading home-reveal"><div><span className="maker-kicker">A FEW NOTES FROM THE WORKBENCH</span><h2 id="workbench-notes-title">The little things <i>that help.</i><DrawnUnderline className="olive-scribble"/></h2></div><span className="notes-margin-note">Keep making.<br/>Keep learning.<AccentRays/></span></div>
  <div className="workbench-notes-grid">{notes.map(note => <article className="workbench-note home-reveal" key={note.number}><div className="note-meta"><FileText size={16} aria-hidden="true"/><span>{note.category}</span><span>{note.number}</span></div><h3>{note.title}</h3><p>{note.intro}</p><details><summary>Open the note<Plus size={17} aria-hidden="true"/></summary><div className="note-expanded"><p>{note.body}</p><a href={note.href} download={note.download || undefined}>{note.link}<ArrowUpRight size={15} aria-hidden="true"/></a></div></details></article>)}</div>
 </section>;
}
