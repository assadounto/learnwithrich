export const dynamic='force-dynamic';
import { LiveProducts } from '@/components/live-products';
import {catalogFilters} from '@/lib/catalog-filters';
import type {Metadata} from 'next';
import {Suspense} from 'react';
import {CatalogBrowser} from '@/components/catalog-browser';
import {DrawnUnderline} from '@/components/decorative-marks';
export const metadata:Metadata={title:'Resource library'};
export default async function ResourcesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const filters=catalogFilters(await searchParams);return <div className="studio-page studio-catalog-page"><header className="studio-page-heading"><h1>Useful things for curious <span className="marked-word">minds.<DrawnUnderline className="orange-scribble"/></span></h1><p>Projects, guides, books and practical resources for makers, students and builders in Africa and beyond.</p></header><LiveProducts initialFilters={filters}/><details className="project-planning-samples"><summary>Preview upcoming resources & planning samples</summary><Suspense fallback={<p>Opening the collection…</p>}><CatalogBrowser/></Suspense></details></div>}
