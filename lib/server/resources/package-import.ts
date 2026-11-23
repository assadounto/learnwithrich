import {inflateRawSync} from 'node:zlib';
import {detectMediaMime, MAX_MEDIA_BYTES} from '../media/library.ts';
import {publishingIssues, type ResourceDetails} from '../../resource-types.ts';
import {resourceTypes, ResourceInputError, validateDraft, type ResourceKind} from './validation.ts';

export const MAX_RESOURCE_PACKAGE_BYTES = 100 * 1024 * 1024;
export const MAX_RESOURCE_PACKAGE_ENTRIES = 500;
export const MAX_RESOURCE_PACKAGE_EXPANDED_BYTES = 250 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

export type PackagePreview = {
  valid: boolean;
  resources: {key: string; type: ResourceKind; title: string; slug: string; summary: string; itemCount: number; items: {key: string; title: string; section: string | null}[]; readiness: string[]; externalLinks: string[]}[];
  files: {path: string; sizeBytes: number; mimeType: string; referencedBy: string[]}[];
  errors: string[];
  warnings: string[];
};

export type ResourcePackageFile = {path: string; bytes: Buffer};
export type ResourcePackageEntry = {
  key: string; type: ResourceKind; title: string; slug: string; summary?: string; bodyMarkdown?: string;
  tags?: string[]; details?: Record<string, unknown>; access?: string; priceMinor?: number; currency?: string;
  cover?: string; attachments?: {path: string; title: string; priceMinor?: number}[];
  sections?: {key: string; title: string}[]; items?: {resource: string; section?: string | null}[];
};
export type ParsedResourcePackage = {preview: PackagePreview; resources: ResourcePackageEntry[]; files: Map<string, ResourcePackageFile>};

function fail(message: string): never { throw new ResourceInputError(message); }
function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function findEocd(zip: Buffer) {
  const start = Math.max(0, zip.length - 65_557);
  for (let offset = zip.length - 22; offset >= start; offset--) {
    if (zip.readUInt32LE(offset) === 0x06054b50 && offset + 22 + zip.readUInt16LE(offset + 20) === zip.length) return offset;
  }
  return -1;
}
function safeArchivePath(value: string) {
  if (!value || value.length > 1024 || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value) || value.startsWith('/')) return false;
  const directory = value.endsWith('/');
  const candidate = directory ? value.slice(0, -1) : value;
  const parts = candidate.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) return false;
  return (!directory && candidate === 'manifest.json') || (directory && candidate === 'files') || candidate.startsWith('files/');
}
function extractZip(zip: Buffer): ResourcePackageFile[] {
  if (!zip.length || zip.length > MAX_RESOURCE_PACKAGE_BYTES) fail('The ZIP must be smaller than 100 MB.');
  const eocd = findEocd(zip);
  if (eocd < 0) fail('This is not a complete ZIP archive.');
  const disk = zip.readUInt16LE(eocd + 4), centralDisk = zip.readUInt16LE(eocd + 6);
  const diskEntries = zip.readUInt16LE(eocd + 8), entryCount = zip.readUInt16LE(eocd + 10);
  const centralSize = zip.readUInt32LE(eocd + 12), centralOffset = zip.readUInt32LE(eocd + 16);
  if (disk || centralDisk || diskEntries !== entryCount) fail('Multi-disk ZIP files are not supported.');
  if (entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) fail('ZIP64 archives are not supported yet.');
  if (entryCount > MAX_RESOURCE_PACKAGE_ENTRIES) fail(`A package can contain at most ${MAX_RESOURCE_PACKAGE_ENTRIES} ZIP entries.`);
  if (centralOffset + centralSize > eocd) fail('The ZIP directory is invalid.');

  const files: ResourcePackageFile[] = [];
  const seenPaths = new Set<string>(), seenOffsets = new Set<number>();
  let cursor = centralOffset, totalExpanded = 0, manifestCount = 0;
  for (let index = 0; index < entryCount; index++) {
    if (cursor + 46 > centralOffset + centralSize || zip.readUInt32LE(cursor) !== 0x02014b50) fail('The ZIP directory contains an invalid entry.');
    const madeBy = zip.readUInt16LE(cursor + 4) >>> 8;
    const flags = zip.readUInt16LE(cursor + 8), method = zip.readUInt16LE(cursor + 10);
    const expectedCrc = zip.readUInt32LE(cursor + 16), compressedSize = zip.readUInt32LE(cursor + 20);
    const expandedSize = zip.readUInt32LE(cursor + 24), nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30), commentLength = zip.readUInt16LE(cursor + 32);
    const startDisk = zip.readUInt16LE(cursor + 34), externalAttributes = zip.readUInt32LE(cursor + 38);
    const localOffset = zip.readUInt32LE(cursor + 42), end = cursor + 46 + nameLength + extraLength + commentLength;
    if (end > centralOffset + centralSize || startDisk !== 0) fail('The ZIP directory contains an unsupported entry.');
    if (flags & (0x0001 | 0x0020 | 0x0040 | 0x2000) || (method !== 0 && method !== 8)) fail('Encrypted, patched, split, and unsupported ZIP entries are not allowed.');
    const nameBytes = zip.subarray(cursor + 46, cursor + 46 + nameLength);
    let name: string;
    try { name = new TextDecoder('utf-8', {fatal: true}).decode(nameBytes); } catch { fail('ZIP file names must use UTF-8.'); }
    if (!safeArchivePath(name!)) fail(`Unsafe or unsupported ZIP path: ${name!}`);
    if (seenPaths.has(name!)) fail(`The ZIP contains a duplicate path: ${name!}`);
    seenPaths.add(name!);
    if (name === 'manifest.json') manifestCount++;
    const isDirectory = name!.endsWith('/');
    if (madeBy === 3) {
      const mode = externalAttributes >>> 16, fileType = mode & 0xf000;
      if (fileType && fileType !== (isDirectory ? 0x4000 : 0x8000)) fail('Links and special files are not allowed in a resource package.');
    }
    if (isDirectory) {
      if (compressedSize !== 0 || expandedSize !== 0) fail(`Invalid ZIP directory entry: ${name!}`);
      cursor = end; continue;
    }
    if (expandedSize > MAX_MEDIA_BYTES && name !== 'manifest.json') fail(`Package files must be 50 MB or smaller: ${name!}`);
    if (name === 'manifest.json' && expandedSize > MAX_MANIFEST_BYTES) fail('manifest.json must be 2 MB or smaller.');
    totalExpanded += expandedSize;
    if (totalExpanded > MAX_RESOURCE_PACKAGE_EXPANDED_BYTES) fail('The expanded package must be 250 MB or smaller.');
    if (seenOffsets.has(localOffset) || localOffset + 30 > centralOffset || zip.readUInt32LE(localOffset) !== 0x04034b50) fail(`Invalid ZIP file data for ${name!}.`);
    seenOffsets.add(localOffset);
    const localFlags = zip.readUInt16LE(localOffset + 6), localMethod = zip.readUInt16LE(localOffset + 8);
    const localNameLength = zip.readUInt16LE(localOffset + 26), localExtraLength = zip.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength, dataEnd = dataStart + compressedSize;
    if (localFlags !== flags || localMethod !== method || dataEnd > centralOffset || dataEnd > zip.length) fail(`Invalid ZIP file data for ${name!}.`);
    const localName = zip.subarray(localOffset + 30, localOffset + 30 + localNameLength);
    if (!localName.equals(nameBytes)) fail(`ZIP path mismatch for ${name!}.`);
    let contents: Buffer;
    try {
      const compressed = zip.subarray(dataStart, dataEnd);
      contents = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed, {maxOutputLength: MAX_MEDIA_BYTES});
    } catch { fail(`Could not safely read ${name!} from the ZIP.`); }
    if (contents!.length !== expandedSize || crc32(contents!) !== expectedCrc) fail(`ZIP integrity check failed for ${name!}.`);
    files.push({path: name!, bytes: contents!});
    cursor = end;
  }
  if (cursor !== centralOffset + centralSize) fail('The ZIP directory has unexpected data.');
  if (manifestCount !== 1) fail('The ZIP must have exactly one manifest.json at its root.');
  return files;
}

function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function onlyKeys(value: Record<string, unknown>, keys: string[], label: string) {
  const unknown = Object.keys(value).find(key => !keys.includes(key));
  if (unknown) fail(`${label} has an unsupported field: ${unknown}.`);
}
function packagePath(value: unknown, label: string, prefix = '') {
  if (typeof value !== 'string') fail(`${label} must be a package file path.`);
  const path = prefix ? value!.startsWith(prefix) ? value!.slice(prefix.length) : '' : value!;
  if (!path.startsWith('files/') || !safeArchivePath(path) || path.endsWith('/')) fail(`${label} must point to a file under files/ without path traversal.`);
  return path;
}
function safeHttps(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
function markdownLinks(body: string) {
  const links: string[] = [];
  for (const match of body.matchAll(/\]\(([^)\s]+)\)/g)) links.push(match[1]);
  return links;
}

function parseResourcePackage(zip: Buffer): ParsedResourcePackage {
  const errors: string[] = [], warnings: string[] = [];
  const archiveFiles = extractZip(zip), byPath = new Map(archiveFiles.map(file => [file.path, file]));
  const manifestFile = byPath.get('manifest.json');
  if (!manifestFile) fail('The ZIP must have a manifest.json at its root.');
  let manifest: unknown;
  try { manifest = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(manifestFile!.bytes)); } catch { fail('manifest.json must contain valid UTF-8 JSON.'); }
  if (!record(manifest)) fail('manifest.json must contain a JSON object.');
  onlyKeys(manifest!, ['format', 'version', 'resources'], 'The manifest');
  if (manifest!.format !== 'learnwithrich-resource' || manifest!.version !== 1) fail('Use format "learnwithrich-resource" and version 1.');
  if (!Array.isArray(manifest!.resources) || manifest!.resources.length < 1 || manifest!.resources.length > MAX_RESOURCE_PACKAGE_ENTRIES) fail('The manifest needs between 1 and 500 resources.');

  const resources: ResourcePackageEntry[] = manifest!.resources as ResourcePackageEntry[];
  const keys = new Set<string>(), slugs = new Set<string>();
  const normalized = new Map<string, ReturnType<typeof validateDraft>>();
  const collectionGraph = new Map<string, string[]>();
  const fileUsers = new Map<string, Set<string>>();
  const markFile = (path: string, user: string) => { const users = fileUsers.get(path) ?? new Set<string>(); users.add(user); fileUsers.set(path, users); };
  const summaryRows: PackagePreview['resources'] = [];

  for (const [index, raw] of resources.entries()) {
    const label = `Resource ${index + 1}`;
    if (!record(raw)) { errors.push(`${label} must be an object.`); continue; }
    onlyKeys(raw, ['key', 'type', 'title', 'slug', 'summary', 'bodyMarkdown', 'tags', 'details', 'access', 'priceMinor', 'currency', 'cover', 'attachments', 'sections', 'items'], label);
    const key = typeof raw.key === 'string' ? raw.key : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || key.length > 120) errors.push(`${label} needs a lowercase, hyphenated key of at most 120 characters.`);
    else if (keys.has(key)) errors.push(`Duplicate resource key: ${key}.`);
    else keys.add(key);
    let type: ResourceKind;
    try { type = raw.type as ResourceKind; if (!resourceTypes.includes(type)) fail(`${label} has an unsupported resource type.`); }
    catch (error) { errors.push(error instanceof Error ? error.message : `${label} has an unsupported resource type.`); continue; }

    const slug = typeof raw.slug === 'string' ? raw.slug : '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) errors.push(`${label} needs a lowercase, hyphenated slug of at most 120 characters.`);
    else if (slugs.has(slug)) errors.push(`Duplicate slug in package: ${slug}.`);
    else slugs.add(slug);

    if (raw.details !== undefined && raw.details !== null && !record(raw.details)) errors.push(`${label} details must be an object.`);
    let details: Record<string, unknown> = record(raw.details) ? {...raw.details} : {};
    const fileReferences: string[] = [];
    const typedFileReferences: {path: string; type: 'image' | 'audio' | 'video'}[] = [];
    const externalLinks = new Set<string>();
    for (const [field, value] of Object.entries(details)) {
      if (typeof value === 'string' && value.startsWith('package-file:')) {
        if (!field.endsWith('Url')) {errors.push(`${label} details.${field} cannot contain a package file reference.`); continue;}
        const path = packagePath(value, `${label} details.${field}`, 'package-file:');
        details[field] = 'media://00000000-0000-4000-8000-000000000000';
        fileReferences.push(path);
        if (field === 'audioUrl') typedFileReferences.push({path, type: 'audio'});
        if (field === 'videoUrl') typedFileReferences.push({path, type: 'video'});
        markFile(path, key || label);
      } else if (typeof value === 'string' && value !== '' && /(?:Url)$/.test(field) && !safeHttps(value)) {
        errors.push(`${label} details.${field} must be an HTTPS URL or package-file reference.`);
      } else if (typeof value === 'string' && value !== '' && /(?:Url)$/.test(field) && safeHttps(value)) {
        externalLinks.add(value);
      }
    }

    let coverUrl: string | undefined;
    if (raw.cover !== undefined) {
      if (typeof raw.cover === 'string' && safeHttps(raw.cover)) {
        coverUrl = raw.cover;
      } else if (typeof raw.cover === 'string' && /^https?:/i.test(raw.cover)) {
        errors.push(`${label} cover must be an HTTPS URL without embedded credentials.`);
      } else {
        const path = packagePath(raw.cover, `${label} cover`);
        fileReferences.push(path); typedFileReferences.push({path, type: 'image'}); markFile(path, key || label);
        coverUrl = 'https://package.invalid/cover';
      }
      if (typeof raw.cover === 'string' && safeHttps(raw.cover)) externalLinks.add(raw.cover);
    }

    const itemCount = Array.isArray(raw.items) ? raw.items.length : 0;
    try {
      const draft = validateDraft({
        type, slug: slug || `invalid-resource-${index + 1}`, title: raw.title,
        summary: raw.summary ?? '', bodyMarkdown: raw.bodyMarkdown ?? '', tags: raw.tags ?? [],
        details, coverUrl, access: raw.access, priceMinor: raw.priceMinor, currency: raw.currency,
      });
      normalized.set(key, draft);
      if (draft.slug !== slug) errors.push(`${label} has an invalid slug.`);
    } catch (error) { errors.push(`${label}: ${error instanceof Error ? error.message : 'Invalid resource.'}`); }

    const attachments = raw.attachments === undefined ? [] : raw.attachments;
    if (!Array.isArray(attachments) || attachments.length > 100) errors.push(`${label} can have at most 100 attachments.`);
    else {
      const seenAttachments = new Set<string>();
      for (const [attachmentIndex, attachment] of attachments.entries()) {
        if (!record(attachment)) { errors.push(`${label} attachment ${attachmentIndex + 1} must be an object.`); continue; }
        onlyKeys(attachment, ['path', 'title', 'priceMinor'], `${label} attachment ${attachmentIndex + 1}`);
        const path = packagePath(attachment.path, `${label} attachment ${attachmentIndex + 1}`);
        if (seenAttachments.has(path)) errors.push(`${label} repeats attachment ${path}.`);
        seenAttachments.add(path); fileReferences.push(path); markFile(path, key || label);
        if (typeof attachment.title !== 'string' || !attachment.title.trim() || attachment.title.length > 180) errors.push(`${label} attachment ${attachmentIndex + 1} needs a title of at most 180 characters.`);
        if (attachment.priceMinor !== undefined && (!Number.isSafeInteger(attachment.priceMinor) || Number(attachment.priceMinor) < 0 || Number(attachment.priceMinor) > 2147483647)) errors.push(`${label} attachment ${attachmentIndex + 1} has an invalid price.`);
      }
    }

    const body = typeof raw.bodyMarkdown === 'string' ? raw.bodyMarkdown : '';
    for (const ref of markdownLinks(body)) {
      if (ref.startsWith('package-file:')) {
        const path = packagePath(ref, `${label} Markdown media`, 'package-file:');
        fileReferences.push(path); markFile(path, key || label);
      } else if (/^[a-z][a-z\d+.-]*:/i.test(ref)) {
        if (!safeHttps(ref)) errors.push(`${label} Markdown links must use HTTPS and cannot contain embedded credentials.`);
        else externalLinks.add(ref);
      }
    }
    for (const match of body.matchAll(/!\[([^\]]*)\]\(package-file:([^\s)]+)\)/g)) {
      const path = packagePath(match[2], `${label} Markdown media`);
      const altText = match[1].trim().toLowerCase();
      const type = altText.startsWith('audio:') ? 'audio' : altText.startsWith('video:') ? 'video' : 'image';
      typedFileReferences.push({path, type});
    }
    const uniqueRefs = new Set(fileReferences);
    const localCoverPath = typeof raw.cover === 'string' && !safeHttps(raw.cover) ? raw.cover : null;
    if ([...uniqueRefs].filter(path => path !== localCoverPath).length > 100) errors.push(`${label} can reference at most 100 media files.`);
    for (const path of uniqueRefs) {
      const asset = byPath.get(path);
      if (!asset) { errors.push(`${label} refers to missing file ${path}.`); continue; }
      const mime = detectMediaMime(asset.bytes, path);
      if (!mime) errors.push(`${path} is not a supported media type.`);
      if (path === localCoverPath && mime && !mime.startsWith('image/')) errors.push(`${path} is not a supported cover image.`);
    }
    for (const reference of typedFileReferences) {
      const asset = byPath.get(reference.path);
      if (!asset) continue;
      const mime = detectMediaMime(asset.bytes, reference.path) ?? '';
      if (mime && !mime.startsWith(`${reference.type}/`)) errors.push(`${reference.path} must be a ${reference.type} file for this reference.`);
    }
    const md = publishingIssues({type, summary: typeof raw.summary === 'string' ? raw.summary : '', bodyMarkdown: body, details: (normalized.get(key)?.details ?? {}) as ResourceDetails, itemCount});
    const collectionItems = Array.isArray(raw.items) ? raw.items.filter(record).filter(item => typeof item.resource === 'string').map(item => {
      const child = resources.find(value => value?.key === item.resource);
      const section = Array.isArray(raw.sections) ? raw.sections.find(value => record(value) && value.key === item.section) : undefined;
      return {key: String(item.resource), title: child && typeof child.title === 'string' ? child.title : String(item.resource), section: record(section) && typeof section.title === 'string' ? section.title : null};
    }) : [];
    if (key) summaryRows.push({key, type, title: typeof raw.title === 'string' ? raw.title : label, slug, summary: typeof raw.summary === 'string' ? raw.summary : '', itemCount, items: collectionItems, readiness: md, externalLinks: [...externalLinks]});

    const sections = raw.sections === undefined ? [] : raw.sections, items = raw.items === undefined ? [] : raw.items;
    if (!['COURSE', 'PATH'].includes(type) && ((Array.isArray(sections) && sections.length) || (Array.isArray(items) && items.length))) errors.push(`${label}: only courses and paths can have sections or items.`);
    if (!Array.isArray(sections) || sections.length > 40) errors.push(`${label} can have at most 40 sections.`);
    if (!Array.isArray(items) || items.length > 200) errors.push(`${label} can have at most 200 items.`);
    const sectionKeys = new Set<string>();
    if (Array.isArray(sections)) for (const [sectionIndex, section] of sections.entries()) {
      if (!record(section) || typeof section.key !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(section.key) || typeof section.title !== 'string' || !section.title.trim() || section.title.length > 180) {errors.push(`${label} section ${sectionIndex + 1} is invalid.`); continue;}
      onlyKeys(section, ['key', 'title'], `${label} section ${sectionIndex + 1}`);
      if (sectionKeys.has(section.key)) errors.push(`${label} repeats section key ${section.key}.`);
      sectionKeys.add(section.key);
    }
    const children: string[] = [], seenChildren = new Set<string>();
    if (Array.isArray(items)) for (const [itemIndex, item] of items.entries()) {
      if (!record(item) || typeof item.resource !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.resource)) {errors.push(`${label} item ${itemIndex + 1} has an invalid resource key.`); continue;}
      onlyKeys(item, ['resource', 'section'], `${label} item ${itemIndex + 1}`);
      if (seenChildren.has(item.resource)) errors.push(`${label} repeats item ${item.resource}.`);
      seenChildren.add(item.resource); children.push(item.resource);
      if (item.section != null && (typeof item.section !== 'string' || !sectionKeys.has(item.section))) errors.push(`${label} item ${itemIndex + 1} refers to an unknown section.`);
    }
    if (key) collectionGraph.set(key, children);
  }

  for (const [parentKey, children] of collectionGraph) for (const childKey of children) {
    const child = resources.find(resource => resource?.key === childKey);
    if (!child) errors.push(`${parentKey} refers to missing resource ${childKey}.`);
    else if (resources.find(resource => resource?.key === parentKey)?.type === 'COURSE' && child.type !== 'LESSON') errors.push(`Course ${parentKey} can contain lessons only; ${childKey} is ${child.type}.`);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(key: string) {
    if (visiting.has(key)) {errors.push(`Collection links contain a cycle at ${key}.`); return;}
    if (visited.has(key)) return;
    visiting.add(key);
    for (const child of collectionGraph.get(key) ?? []) if (collectionGraph.has(child)) visit(child);
    visiting.delete(key); visited.add(key);
  }
  for (const key of collectionGraph.keys()) visit(key);

  const fileRows: PackagePreview['files'] = [];
  for (const file of archiveFiles) {
    if (file.path === 'manifest.json') continue;
    const mimeType = detectMediaMime(file.bytes, file.path);
    const referencedBy = [...(fileUsers.get(file.path) ?? [])];
    if (!referencedBy.length) warnings.push(`Unreferenced file: ${file.path}. It will not be imported unless attached or referenced.`);
    fileRows.push({path: file.path, sizeBytes: file.bytes.length, mimeType: mimeType ?? 'unsupported', referencedBy});
  }
  const preview = {valid: errors.length === 0, resources: summaryRows, files: fileRows, errors: [...new Set(errors)], warnings: [...new Set(warnings)]};
  return {preview, resources, files: byPath};
}

export function previewResourcePackage(zip: Buffer): PackagePreview {
  return parseResourcePackage(zip).preview;
}

export function readResourcePackageForImport(zip: Buffer): ParsedResourcePackage {
  const parsed = parseResourcePackage(zip);
  if (!parsed.preview.valid) fail(parsed.preview.errors.join(' '));
  return parsed;
}
