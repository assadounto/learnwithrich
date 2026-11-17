import type {Metadata} from 'next';
import {Suspense} from 'react';
import {CatalogBrowser} from '@/components/catalog-browser';
import {DrawnUnderline} from '@/components/decorative-marks';
export const metadata:Metadata={title:'Resource library'};
export default function ResourcesPage(){return <div className="studio-page studio-catalog-page"><header className="studio-page-heading"><h1>Useful things for curious <span className="marked-word">minds.<DrawnUnderline className="orange-scribble"/></span></h1><p>Projects, guides, books and practical resources for makers, students and builders in Africa and beyond.</p></header><Suspense fallback={<p>Opening the collection…</p>}><CatalogBrowser/></Suspense></div>}
