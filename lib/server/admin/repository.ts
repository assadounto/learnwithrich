import {randomUUID} from 'node:crypto';
import {publishingIssues, type ResourceDetails} from '../../resource-types';
import type {Database} from '../database-client';
import type {Prisma} from '../../generated/prisma/client';
import {assertOwner} from '../identity/owner';
import {assertSessionMfa} from '../identity/mfa';
import {adminDraft, editToken} from './input';
import {ResourceInputError, resourceId, text, enumValue, resourceTypes, validateDraft, type ResourceDraft, type ResourceKind} from '../resources/validation';
import {defaultHomepageSections, heroMediaMatches, homepageHeroSelect, loadHomepageHero, validateHomepageHero, validateHomepageSections} from './homepage';
import {homepageHeroMedia} from '../../home-hero';
export class EditConflictError extends Error {}
export type PackageMediaAssetInput = {id: string; originalName: string; storageKey: string; mimeType: string; sizeBytes: number};
export type PackageResourceInput = {
  key: string; draft: ResourceDraft; bodyMarkdown: string; details: ResourceDetails;
  sections: {key: string; title: string}[]; items: {resource: string; section: string | null}[];
  media: {mediaAssetId: string; title: string; priceMinor: number}[];
};
export function packageSlugConflicts(db: Pick<Database, 'resource'>, slugs: string[]) {
  return db.resource.findMany({where: {slug: {in: slugs}}, select: {slug: true}, orderBy: {slug: 'asc'}});
}

export function packageSlugConflictMessage(conflicts: {slug: string}[]) {
  const shown = conflicts.slice(0, 10).map(resource => resource.slug).join(', ');
  const remaining = conflicts.length > 10 ? ` and ${conflicts.length - 10} more` : '';
  return `Import blocked because these resource slugs already exist: ${shown}${remaining}. Use new slugs to import a separate copy.`;
}

const fullResource = {
  content: true, tags: {include: {tag: true}},
  sections: {orderBy: {position: 'asc' as const}}, items: {orderBy: {position: 'asc' as const}},
  media: {include: {mediaAsset: {select: {id: true, originalName: true, mimeType: true, sizeBytes: true}}}, orderBy: {position: 'asc' as const}},
};
async function snapshot(tx: Prisma.TransactionClient, id: string, actorId: string, action: string) {
  const row = await tx.resource.findUniqueOrThrow({where: {id}, include: fullResource});
  const version = action === 'DELETED' ? row.version + 1 : row.version;
  await tx.resourceAudit.create({data: {actorId, resourceId: id, action, version, snapshot: JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue}});
  return row;
}
function selectedResources(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) throw new ResourceInputError('Select 1 to 100 resources.');
  const selected = input.map(value => {
    if (!value || typeof value !== 'object') throw new ResourceInputError('Invalid resource selection.');
    return {id: resourceId(value.id), token: editToken(value.version, value.updatedAt)};
  });
  if (new Set(selected.map(row => row.id)).size !== selected.length) throw new ResourceInputError('Select each resource only once.');
  return selected;
}

// Server callers always pass the session ID; trusted operator/tests may use
// owner authorization directly without a browser session.
export function adminRepository(db: Database, actorId: string, sessionId?: string, automation?: (target: Database | Prisma.TransactionClient) => Promise<void>) {
  async function authorize(target: Database | Prisma.TransactionClient, allowAutomation = false) {
    await assertOwner(target, actorId);
    if (automation) {
      if (!allowAutomation) throw new ResourceInputError('Use a signed-in studio session.');
      await automation(target);
    }
    if (sessionId) await assertSessionMfa(target, {userId: actorId, sessionId});
  }
  async function transitionRow(tx: Prisma.TransactionClient, id: string, token: ReturnType<typeof editToken>, action: string, skipUnchanged = false) {
    const current = await tx.resource.findUniqueOrThrow({where: {id}, include: {content: true, _count: {select: {items: true}}}});
    if (automation && current.status !== 'DRAFT') throw new EditConflictError('Only resource drafts can be published with a token.');
    if (current.version !== token.version || current.updatedAt.getTime() !== token.updatedAt.getTime()) throw new EditConflictError('This resource changed in another tab. Reload before publishing.');
    const status = action === 'PUBLISH' ? 'PUBLISHED' : action === 'UNPUBLISH' ? 'DRAFT' : 'ARCHIVED';
    if (skipUnchanged && current.status === status) return null;
    if (action === 'PUBLISH') {
      const issues = publishingIssues({type: current.type, summary: current.summary, bodyMarkdown: current.content?.bodyMarkdown ?? '', details: (current.content?.details ?? {}) as ResourceDetails, itemCount: current._count.items});
      if (issues.length) throw new ResourceInputError(skipUnchanged ? `${current.title}: ${issues.join(' ')}` : issues.join(' '));
    }
    const changed = await tx.resource.updateMany({where: {id, ...token}, data: {status, ...(action === 'PUBLISH' ? {publishedAt: new Date()} : {}), version: {increment: 1}}});
    if (changed.count !== 1) throw new EditConflictError('This resource changed in another tab. Reload before publishing.');
    return snapshot(tx, id, actorId, action);
  }
  return {
    async summary() {
      await authorize(db);
      const groups = await db.resource.groupBy({by: ['status'], _count: true});
      return {total: groups.reduce((total, group) => total + group._count, 0), drafts: groups.find(group => group.status === 'DRAFT')?._count ?? 0, published: groups.find(group => group.status === 'PUBLISHED')?._count ?? 0};
    },
    async list(query = '', filters: {type?: string; status?: string} = {}) {
      await authorize(db);
      const q = text(query, 'search', 200, false);
      const type = filters.type ? enumValue(filters.type, resourceTypes, 'resource type') : undefined;
      const status = filters.status ? enumValue(filters.status, ['DRAFT', 'PUBLISHED', 'ARCHIVED'], 'status') : undefined;
      return db.resource.findMany({where: {type, status, ...(q ? {OR: [{title: {contains: q, mode: 'insensitive' as const}}, {slug: {contains: q, mode: 'insensitive' as const}}]} : {})}, select: {id: true, title: true, type: true, slug: true, status: true, access: true, updatedAt: true, version: true, _count: {select: {items: true}}}, orderBy: {updatedAt: 'desc'}, take: 100});
    },
    async get(id: string) {
      await authorize(db);
      return db.resource.findUnique({where: {id: resourceId(id)}, include: {...fullResource, audits: {select: {action: true, version: true, createdAt: true, actor: {select: {name: true}}}, orderBy: {createdAt: 'desc'}, take: 10}}});
    },
    async choices() {
      await authorize(db);
      return db.resource.findMany({select: {id: true, title: true, type: true, status: true}, orderBy: {title: 'asc'}, take: 500});
    },
    async importPackage(input: {assets: PackageMediaAssetInput[]; resources: PackageResourceInput[]; folderName: string}) {
      await authorize(db, true);
      if (!Array.isArray(input.assets) || !Array.isArray(input.resources) || !input.resources.length || input.resources.length > 500) throw new ResourceInputError('Invalid resource package.');
      const keys = new Set(input.resources.map(resource => resource.key));
      if (keys.size !== input.resources.length) throw new ResourceInputError('Resource package keys must be unique.');
      const ids = new Map(input.resources.map(resource => [resource.key, randomUUID()]));
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        if (sessionId || automation) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx, true);
        const slugs = input.resources.map(resource => resource.draft.slug);
        const existing = await packageSlugConflicts(tx, slugs);
        if (existing.length) throw new EditConflictError(packageSlugConflictMessage(existing));
        let mediaFolder: {id: string; name: string} | null = null;
        if (input.assets.length) {
          const id = randomUUID();
          const created = await tx.mediaFolder.createMany({data: {id, name: input.folderName}, skipDuplicates: true});
          const suffix = ` (${id})`;
          const name = created.count ? input.folderName : Array.from(input.folderName).slice(0, 80 - suffix.length).join('').trimEnd() + suffix;
          if (!created.count) await tx.mediaFolder.create({data: {id, name}});
          mediaFolder = {id, name};
          await tx.mediaAsset.createMany({data: input.assets.map(asset => ({...asset, folderId: id}))});
        }

        for (const resource of input.resources) {
          const id = ids.get(resource.key)!;
          const draft = resource.draft;
          await tx.resource.create({data: {
            id, slug: draft.slug, type: draft.type, title: draft.title, summary: draft.summary,
            coverUrl: draft.coverUrl, status: 'DRAFT', access: draft.access, priceMinor: draft.priceMinor,
            currency: draft.currency, version: 1, content: {create: {bodyMarkdown: resource.bodyMarkdown, details: resource.details}},
          }});
          for (const name of draft.tags) {
            const tag = await tx.tag.upsert({where: {name}, create: {name}, update: {}});
            await tx.resourceTag.create({data: {resourceId: id, tagId: tag.id}});
          }
        }

        const sectionIds = new Map<string, Map<string, string>>();
        for (const resource of input.resources) {
          const resourceId = ids.get(resource.key)!;
          const byKey = new Map<string, string>(); sectionIds.set(resource.key, byKey);
          for (const [position, section] of resource.sections.entries()) {
            const id = randomUUID(); byKey.set(section.key, id);
            await tx.resourceSection.create({data: {id, resourceId, title: section.title, position}});
          }
          if (resource.media.length) await tx.resourceMedia.createMany({data: resource.media.map((item, position) => ({resourceId, mediaAssetId: item.mediaAssetId, title: item.title, priceMinor: item.priceMinor, position}))});
        }

        for (const resource of input.resources) {
          const collectionId = ids.get(resource.key)!;
          if (resource.items.length) await tx.resourceItem.createMany({data: resource.items.map((item, position) => {
            const childId = ids.get(item.resource);
            if (!childId) throw new ResourceInputError(`Missing resource key: ${item.resource}.`);
            const sectionId = item.section ? sectionIds.get(resource.key)?.get(item.section) : null;
            if (item.section && !sectionId) throw new ResourceInputError(`Missing section key: ${item.section}.`);
            return {collectionId, resourceId: childId, position, sectionId};
          })});
        }
        const imported = [];
        for (const resource of input.resources) {
          const id = ids.get(resource.key)!;
          await snapshot(tx, id, actorId, 'IMPORTED');
          imported.push({id, key: resource.key, title: resource.draft.title, slug: resource.draft.slug, type: resource.draft.type as ResourceKind});
        }
        return {resources: imported, mediaFolder};
      }, {timeout: 60000});
    },
    async homepageSettings() {
      await authorize(db);
      const [settings, resources] = await Promise.all([
        db.homepageSettings.findUnique({where: {id: 1}, select: {sections: true, ...homepageHeroSelect}}),
        db.resource.findMany({where: {status: 'PUBLISHED', publishedAt: {lte: new Date()}}, select: {id: true, title: true, type: true, coverUrl: true, summary: true}, orderBy: [{publishedAt: 'desc'}, {title: 'asc'}], take: 500}),
      ]);
      const hero = await loadHomepageHero(db, settings);
      return {sections: validateHomepageSections(settings?.sections ?? defaultHomepageSections), hero, resources};
    },
    async saveHomepageHero(input: unknown) {
      await authorize(db);
      const hero = validateHomepageHero(input);
      return db.$transaction(async tx => {
        if (sessionId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx);
        const ids = homepageHeroMedia.map(slot => hero[slot.field]).filter((id): id is string => id !== null);
        const assets = ids.length ? await tx.mediaAsset.findMany({where: {id: {in: ids}}, select: {id: true, mimeType: true}}) : [];
        const mimeTypes = new Map(assets.map(asset => [asset.id, asset.mimeType]));
        for (const slot of homepageHeroMedia) {
          const id = hero[slot.field];
          if (id && !heroMediaMatches(slot.kind, mimeTypes.get(id))) {
            throw new ResourceInputError(`Choose a valid ${slot.label.toLowerCase()} from the media library.`);
          }
        }
        const data = {
          heroPreset: hero.preset, heroDelaySeconds: hero.delaySeconds, heroVideoEnabled: hero.videoEnabled,
          heroImageAssetId: hero.imageAssetId, heroMobileImageAssetId: hero.mobileImageAssetId,
          heroVideoAssetId: hero.videoAssetId, heroMobileVideoAssetId: hero.mobileVideoAssetId,
        };
        return tx.homepageSettings.upsert({
          where: {id: 1},
          create: {id: 1, sections: defaultHomepageSections as Prisma.InputJsonValue, ...data},
          update: data,
          select: homepageHeroSelect,
        });
      });
    },
    async saveHomepage(input: unknown) {
      await authorize(db);
      const sections = validateHomepageSections(input);
      return db.$transaction(async tx => {
        if (sessionId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx);
        const selectedIds = [...new Set(sections.filter(section => section.source === 'SELECTED').flatMap(section => section.resourceIds))];
        if (selectedIds.length) {
          const rows = await tx.resource.findMany({where: {id: {in: selectedIds}, status: 'PUBLISHED', publishedAt: {lte: new Date()}}, select: {id: true, type: true}});
          const valid = new Map(rows.map(row => [row.id, row.type]));
          for (const section of sections) if (section.source === 'SELECTED') for (const id of section.resourceIds) {
            const type = valid.get(id);
            if (!type || (section.type !== 'ALL' && section.type !== type)) throw new ResourceInputError('Selected resources must be published and match their section type.');
          }
        }
        await tx.homepageSettings.upsert({where: {id: 1}, create: {id: 1, sections: sections as Prisma.InputJsonValue}, update: {sections: sections as Prisma.InputJsonValue}});
        return sections;
      });
    },
    async getAutomationDraft(id: string) {
      if (!automation) throw new ResourceInputError('A resource API token is required.');
      await authorize(db, true);
      return db.resource.findUnique({
        where: {id: resourceId(id), status: 'DRAFT'},
        include: {content: true, tags: {include: {tag: true}}},
      });
    },
    async patchAutomationDraft(id: string, input: unknown) {
      if (!automation) throw new ResourceInputError('A resource API token is required.');
      await authorize(db, true);
      resourceId(id);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ResourceInputError('Send a JSON object.');
      const {version, updatedAt, ...changes} = input as Record<string, unknown>;
      const expected = editToken(version, updatedAt);
      if (!Object.keys(changes).length || Object.keys(changes).some(key => !['title', 'summary', 'bodyMarkdown', 'tags', 'details'].includes(key))) {
        throw new ResourceInputError('Supply one or more of title, summary, bodyMarkdown, tags or details.');
      }
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx, true);
        const row = await tx.resource.findUnique({where: {id}, include: {content: true, tags: {include: {tag: true}}}});
        if (!row || row.status !== 'DRAFT') return null;
        if (row.version !== expected.version || row.updatedAt.getTime() !== expected.updatedAt.getTime()) {
          throw new EditConflictError('This resource changed. Fetch the current draft before editing.');
        }
        const draft = validateDraft({...row,
          bodyMarkdown: row.content?.bodyMarkdown ?? '',
          details: row.content?.details ?? {},
          tags: row.tags.map(link => link.tag.name),
          ...changes,
        });
        const update = await tx.resource.updateMany({where: {id, status: 'DRAFT', ...expected}, data: {
          title: draft.title, summary: draft.summary, version: {increment: 1},
        }});
        if (!update.count) throw new EditConflictError('This resource changed. Fetch the current draft before editing.');
        if ('bodyMarkdown' in changes || 'details' in changes) {
          const content = {bodyMarkdown: draft.bodyMarkdown, details: draft.details};
          await tx.resourceContent.upsert({where: {resourceId: id}, create: {resourceId: id, ...content}, update: content});
        }
        if ('tags' in changes) {
          await tx.resourceTag.deleteMany({where: {resourceId: id}});
          for (const name of draft.tags) {
            const tag = await tx.tag.upsert({where: {name}, create: {name}, update: {}});
            await tx.resourceTag.create({data: {resourceId: id, tagId: tag.id}});
          }
        }
        return snapshot(tx, id, actorId, 'UPDATED');
      }, {timeout: 15000});
    },
    async save(input: unknown) {
      // Authorization before parsing ensures non-owners cannot probe private mutations.
      await authorize(db);
      const {id, token, bodyMarkdown, details, tags, sections, items, media, ...data} = adminDraft(input);
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        if (sessionId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx);
        let targetId: string;
        if (id && token) {
          const current = await tx.resource.findUniqueOrThrow({where: {id}, select: {status: true, version: true, updatedAt: true}});
          if (current.version !== token.version || current.updatedAt.getTime() !== token.updatedAt.getTime()) throw new EditConflictError('This resource changed in another tab. Reload before saving.');
          if (current.status === 'PUBLISHED') {
            const issues = publishingIssues({type: data.type, summary: data.summary, bodyMarkdown, details, itemCount: items.length});
            if (issues.length) throw new ResourceInputError(issues.join(' '));
          }
          const changed = await tx.resource.updateMany({where: {id, ...token}, data: {...data, version: {increment: 1}}});
          if (changed.count !== 1) throw new EditConflictError('This resource changed in another tab. Reload before saving.');
          targetId = id;
          await tx.resourceContent.upsert({where: {resourceId: id}, create: {resourceId: id, bodyMarkdown, details}, update: {bodyMarkdown, details}});
          await tx.resourceTag.deleteMany({where: {resourceId: id}});
        } else {
          const row = await tx.resource.create({data: {...data, version: 1, content: {create: {bodyMarkdown, details}}}});
          targetId = row.id;
        }
        for (const name of tags) {
          const tag = await tx.tag.upsert({where: {name}, create: {name}, update: {}});
          await tx.resourceTag.create({data: {resourceId: targetId, tagId: tag.id}});
        }
        // This complete replacement is atomic. Only this collection's rows change.
        await tx.resourceItem.deleteMany({where: {collectionId: targetId}});
        await tx.resourceSection.deleteMany({where: {resourceId: targetId}});
        await tx.resourceMedia.deleteMany({where: {resourceId: targetId}});
        const sectionIds = new Map<string, string>();
        for (const [position, section] of sections.entries()) {
          const sectionId = randomUUID(); sectionIds.set(section.key, sectionId);
          await tx.resourceSection.create({data: {id: sectionId, resourceId: targetId, title: section.title, position}});
        }
        if (media.length) await tx.resourceMedia.createMany({data: media.map((item, position) => ({resourceId: targetId, mediaAssetId: item.mediaAssetId, title: item.title, priceMinor: item.priceMinor, position}))});
        if (items.length) await tx.resourceItem.createMany({data: items.map((item, position) => ({collectionId: targetId, resourceId: item.resourceId, position, sectionId: item.sectionKey ? sectionIds.get(item.sectionKey)! : null}))});
        return snapshot(tx, targetId, actorId, id ? 'UPDATED' : 'CREATED');
      }, {timeout: 15000});
    },
    async bulkTransition(input: unknown, status: unknown) {
      await authorize(db);
      const target = enumValue(status, ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const, 'status');
      const action = target === 'DRAFT' ? 'UNPUBLISH' : target === 'PUBLISHED' ? 'PUBLISH' : 'ARCHIVE';
      const selected = selectedResources(input);
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        if (sessionId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx);
        let changed = 0;
        for (const row of selected) if (await transitionRow(tx, row.id, row.token, action, true)) changed++;
        return changed;
      }, {timeout: 30000});
    },
    async deleteResources(input: unknown) {
      await authorize(db);
      const selected = selectedResources(input);
      const ids = selected.map(row => row.id);
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        if (sessionId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx);

        const rows = await tx.resource.findMany({
          where: {OR: selected.map(({id, token}) => ({id, ...token}))},
          select: {id: true, title: true, _count: {select: {
            purchases: true,
            media: {where: {purchases: {some: {}}}},
            includedIn: {where: {collectionId: {notIn: ids}}},
          }}},
        });
        if (rows.length !== selected.length) throw new EditConflictError('A selected resource changed. Reload the list before deleting.');
        for (const row of rows) {
          if (row._count.purchases || row._count.media) {
            throw new ResourceInputError(`“${row.title}” is linked to purchase records. No resources were deleted.`);
          }
          if (row._count.includedIn) {
            throw new ResourceInputError(`“${row.title}” belongs to a collection outside this selection. Remove it from that collection or include the collection in the deletion.`);
          }
        }

        for (const row of rows) await snapshot(tx, row.id, actorId, 'DELETED');
        await tx.resourceItem.deleteMany({where: {collectionId: {in: ids}}});
        const removed = await tx.resource.deleteMany({where: {OR: selected.map(({id, token}) => ({id, ...token}))}});
        if (removed.count !== selected.length) throw new EditConflictError('A selected resource changed. Reload the list before deleting.');
        return removed.count;
      }, {timeout: 30000});
    },
    async transition(id: string, version: unknown, updatedAt: unknown, action: string) {
      await authorize(db, action === 'PUBLISH');
      resourceId(id); const token = editToken(version, updatedAt);
      if (!['PUBLISH', 'UNPUBLISH', 'ARCHIVE'].includes(action)) throw new ResourceInputError('Invalid publishing action.');
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        if (sessionId || automation) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx, action === 'PUBLISH');
        return (await transitionRow(tx, id, token, action))!
      });
    },
  };
}
