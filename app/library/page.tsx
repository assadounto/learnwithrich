import type { Metadata } from 'next';
import {SavedLibrary} from '@/components/saved-library';
export const metadata:Metadata={title:'My saved library'};
export default function Library(){return <div className="container"><div className="page-top"><span className="eyebrow">YOUR OWN LITTLE CORNER</span><h1>Good ideas,<br/><i>kept close.</i></h1><p>Your saved projects, books and resources.<br/>Ready for the next time curiosity calls.</p></div><SavedLibrary/></div>}
