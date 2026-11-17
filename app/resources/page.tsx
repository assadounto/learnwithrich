import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogBrowser } from '@/components/catalog-browser';
export const metadata:Metadata={title:'Resource library'};
export default function ResourcesPage(){return <div className="container"><div className="page-top"><span className="eyebrow">THE LEARNWITHRICH COLLECTION</span><h1>Useful things for<br/><i>curious minds.</i></h1><p>Projects to try. Ideas to explore. Resources to come back to.<br/>Find a little something for your next big thing.</p></div><Suspense fallback={<p className="results-count">Opening the collection…</p>}><CatalogBrowser/></Suspense></div>}
