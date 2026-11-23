'use client';

import {useRouter} from 'next/navigation';
import {MediaLibraryModal} from './media-library-modal';

export function StudioFiles({initialFolderId}: {initialFolderId: string}) {
  const router = useRouter();
  return <MediaLibraryModal embedded initialFolderId={initialFolderId} open filter="any" onClose={() => {}} onSelect={(_, asset) => router.push(`/admin/files/${asset.id}`)}/>;
}
