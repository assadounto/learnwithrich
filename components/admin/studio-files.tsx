'use client';

import {useRouter} from 'next/navigation';
import {MediaLibraryModal} from './media-library-modal';

export function StudioFiles() {
  const router = useRouter();
  return <MediaLibraryModal embedded open filter="any" onClose={() => {}} onSelect={(_, asset) => router.push(`/admin/files/${asset.id}`)}/>;
}
