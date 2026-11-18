import type {Metadata} from 'next';
import {SavedLibrary} from '@/components/saved-library';
export const metadata:Metadata={title:'My library'};
export default function Library(){return <div className="studio-page studio-library-page"><SavedLibrary/></div>}
