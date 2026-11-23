import {StudioFiles} from '@/components/admin/studio-files';

export default async function FilesPage({searchParams}: {searchParams: Promise<{folderId?: string}>}) {
  const {folderId} = await searchParams;
  const selectedFolder = typeof folderId === 'string' && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(folderId) ? folderId : 'all';
  return <StudioFiles key={selectedFolder} initialFolderId={selectedFolder}/>;
}
