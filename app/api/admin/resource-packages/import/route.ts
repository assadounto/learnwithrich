import {randomUUID} from 'node:crypto';
import {resourceApiAccess, ResourceTokenError} from '@/lib/server/identity/resource-token';
import {database} from '@/lib/server/database';
import {adminRepository, EditConflictError, packageSlugConflictMessage, packageSlugConflicts, type PackageMediaAssetInput, type PackageResourceInput} from '@/lib/server/admin/repository';
import {cleanOriginalName, checkMediaStorage, deleteMediaObject, detectMediaMime, mediaExtension, putMediaObject} from '@/lib/server/media/library';
import {readPackageUpload, MAX_RESOURCE_PACKAGE_BYTES} from '@/lib/server/resources/package-import';
import {ResourceInputError, validateDraft} from '@/lib/server/resources/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_RESOURCE_PACKAGE_BYTES + 1024 * 1024) return Response.json({error: 'ZIP packages must be 100 MB or smaller.'}, {status: 413});
  const uploaded: string[] = [];
  try {
    const owner = await resourceApiAccess(request, 'upload', true);
    const form = await request.formData();
    const {file, parsed} = await readPackageUpload(form.get('file'), true);
    const db = database();
    const existing = await packageSlugConflicts(db, parsed.resources.map(resource => resource.slug));
    if (existing.length) throw new EditConflictError(packageSlugConflictMessage(existing));

    const folderLabel = parsed.resources.length === 1 ? parsed.resources[0].title : file.name.replace(/\.(zip|json)$/i, '');
    const folderName = Array.from(folderLabel.replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim() || 'Resource package').slice(0, 80).join('').trimEnd();
    const sourceById = new Map<string, Buffer>();
    const assetIds = new Map<string, string>(), assets: PackageMediaAssetInput[] = [];
    for (const row of parsed.preview.files) {
      if (!row.referencedBy.length) continue;
      const source = parsed.files.get(row.path)!;
      const mimeType = detectMediaMime(source.bytes, row.path), extension = mimeType && mediaExtension(mimeType);
      if (!mimeType || !extension) throw new ResourceInputError(`Unsupported package media: ${row.path}.`);
      const id = randomUUID(), storageKey = `assets/${id}${extension}`;
      assetIds.set(row.path, id);
      sourceById.set(id, source.bytes);
      assets.push({id, originalName: cleanOriginalName(row.path), storageKey, mimeType, sizeBytes: source.bytes.byteLength});
    }
    const byId = new Map(assets.map(asset => [asset.id, asset]));
    const resources: PackageResourceInput[] = parsed.resources.map(entry => {
      const details = {...(entry.details ?? {})};
      for (const [field, value] of Object.entries(details)) if (typeof value === 'string' && value.startsWith('package-file:')) {
        const id = assetIds.get(value.slice('package-file:'.length)); if (!id) throw new ResourceInputError(`Missing imported media for ${field}.`);
        details[field] = `media://${id}`;
      }
      let bodyMarkdown = entry.bodyMarkdown ?? '';
      bodyMarkdown = bodyMarkdown.replace(/\]\(package-file:([^\s)]+)\)/g, (_all, path: string) => {
        const id = assetIds.get(path); if (!id) throw new ResourceInputError(`Missing imported media: ${path}.`);
        return `](media://${id})`;
      });
      const coverPath = entry.cover && !/^https:\/\//i.test(entry.cover) ? entry.cover : undefined;
      const coverUrl = coverPath ? `/api/public-media/${assetIds.get(coverPath)}` : entry.cover;
      const draft = validateDraft({...entry, details, bodyMarkdown, coverUrl});
      const refs = new Map<string, {mediaAssetId: string; title: string; priceMinor: number}>();
      const add = (path: string, title?: string, priceMinor = 0) => {
        const mediaAssetId = assetIds.get(path); if (!mediaAssetId || path === coverPath) return;
        const asset = byId.get(mediaAssetId)!;
        refs.set(mediaAssetId, {mediaAssetId, title: title || asset.originalName, priceMinor});
      };
      for (const [field, value] of Object.entries(entry.details ?? {})) if (typeof value === 'string' && value.startsWith('package-file:')) add(value.slice('package-file:'.length));
      for (const match of (entry.bodyMarkdown ?? '').matchAll(/\]\(package-file:([^\s)]+)\)/g)) add(match[1]);
      for (const attachment of entry.attachments ?? []) add(attachment.path, attachment.title, attachment.priceMinor ?? 0);
      return {key: entry.key, draft, bodyMarkdown: draft.bodyMarkdown, details: draft.details, sections: entry.sections ?? [], items: (entry.items ?? []).map(item => ({resource: item.resource, section: item.section ?? null})), media: [...refs.values()]};
    });
    if (assets.length) await checkMediaStorage();
    for (const asset of assets) {
      await putMediaObject(asset.storageKey, sourceById.get(asset.id)!, asset.mimeType);
      uploaded.push(asset.storageKey);
    }
    const imported = await adminRepository(db, owner.id, owner.sessionId, owner.automation).importPackage({assets, resources, folderName});
    return Response.json(imported, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    if (uploaded.length) await Promise.all(uploaded.map(key => deleteMediaObject(key).catch(() => undefined)));
    if (error instanceof ResourceTokenError) return Response.json({error: error.message}, {status: error.status, headers: {'Cache-Control': 'no-store'}});
    if (error instanceof ResourceInputError) return Response.json({error: error.message}, {status: 400, headers: {'Cache-Control': 'no-store'}});
    if (error instanceof EditConflictError) return Response.json({error: error.message}, {status: 409, headers: {'Cache-Control': 'no-store'}});
    console.error('Resource package import failed', error instanceof Error ? error.name : 'UnknownError');
    return Response.json({error: 'Could not import this package. Please try again.'}, {status: 500, headers: {'Cache-Control': 'no-store'}});
  }
}
