import {randomUUID} from 'node:crypto';
import {publishingIssues, type ResourceDetails} from '../../resource-types';
import type {Database} from '../database-client';
import type {Prisma} from '../../generated/prisma/client';
import {assertOwner} from '../identity/owner';
import {assertSessionMfa} from '../identity/mfa';
import {adminDraft, editToken} from './input';
import {ResourceInputError, resourceId, text, enumValue, resourceTypes} from '../resources/validation';
import {defaultHomepageSections, validateHomepageSections} from './homepage';
export class EditConflictError extends Error {}
const fullResource = {
  content: true, tags: {include: {tag: true}},
  sections: {orderBy: {position: 'asc' as const}}, items: {orderBy: {position: 'asc' as const}},
};
async function snapshot(tx: Prisma.TransactionClient, id: string, actorId: string, action: string) {
  const row = await tx.resource.findUniqueOrThrow({where: {id}, include: fullResource});
  await tx.resourceAudit.create({data: {actorId, resourceId: id, action, version: row.version, snapshot: JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue}});
  return row;
}
// Server callers always pass the session ID; trusted operator/tests may use
// owner authorization directly without a browser session.
export function adminRepository(db: Database, actorId: string, sessionId?: string) {
  async function authorize(target: Database | Prisma.TransactionClient) {
    await assertOwner(target, actorId);
    if (sessionId) await assertSessionMfa(target, {userId: actorId, sessionId});
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
      return db.resource.findMany({where: {type, status, ...(q ? {OR: [{title: {contains: q, mode: 'insensitive' as const}}, {slug: {contains: q, mode: 'insensitive' as const}}]} : {})}, select: {id: true, title: true, type: true, slug: true, status: true, access: true, updatedAt: true, _count: {select: {items: true}}}, orderBy: {updatedAt: 'desc'}, take: 100});
    },
    async get(id: string) {
      await authorize(db);
      return db.resource.findUnique({where: {id: resourceId(id)}, include: {...fullResource, audits: {select: {action: true, version: true, createdAt: true, actor: {select: {name: true}}}, orderBy: {createdAt: 'desc'}, take: 10}}});
    },
    async choices() {
      await authorize(db);
      return db.resource.findMany({select: {id: true, title: true, type: true, status: true}, orderBy: {title: 'asc'}, take: 500});
    },
    async homepageSettings() {
      await authorize(db);
      const [settings, resources] = await Promise.all([
        db.homepageSettings.findUnique({where: {id: 1}, select: {sections: true}}),
        db.resource.findMany({where: {status: 'PUBLISHED', publishedAt: {lte: new Date()}}, select: {id: true, title: true, type: true, coverUrl: true, summary: true}, orderBy: [{publishedAt: 'desc'}, {title: 'asc'}], take: 500}),
      ]);
      return {sections: validateHomepageSections(settings?.sections ?? defaultHomepageSections), resources};
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
    async save(input: unknown) {
      // Authorization before parsing ensures non-owners cannot probe private mutations.
      await authorize(db);
      const {id, token, bodyMarkdown, details, tags, sections, items, ...data} = adminDraft(input);
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
        const sectionIds = new Map<string, string>();
        for (const [position, section] of sections.entries()) {
          const sectionId = randomUUID(); sectionIds.set(section.key, sectionId);
          await tx.resourceSection.create({data: {id: sectionId, resourceId: targetId, title: section.title, position}});
        }
        if (items.length) await tx.resourceItem.createMany({data: items.map((item, position) => ({collectionId: targetId, resourceId: item.resourceId, position, sectionId: item.sectionKey ? sectionIds.get(item.sectionKey)! : null}))});
        return snapshot(tx, targetId, actorId, id ? 'UPDATED' : 'CREATED');
      }, {timeout: 15000});
    },
    async transition(id: string, version: number, updatedAt: string, action: string) {
      await authorize(db);
      resourceId(id); const token = editToken(version, updatedAt);
      if (!['PUBLISH', 'UNPUBLISH', 'ARCHIVE'].includes(action)) throw new ResourceInputError('Invalid publishing action.');
      return db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        if (sessionId) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${actorId}, 18427653))`;
        await authorize(tx);
        const current = await tx.resource.findUniqueOrThrow({where: {id}, include: {content: true, _count: {select: {items: true}}}});
        if (current.version !== token.version || current.updatedAt.getTime() !== token.updatedAt.getTime()) throw new EditConflictError('This resource changed in another tab. Reload before publishing.');
        if (action === 'PUBLISH') {
          const issues = publishingIssues({type: current.type, summary: current.summary, bodyMarkdown: current.content?.bodyMarkdown ?? '', details: (current.content?.details ?? {}) as ResourceDetails, itemCount: current._count.items});
          if (issues.length) throw new ResourceInputError(issues.join(' '));
        }
        const changed = await tx.resource.updateMany({where: {id, ...token}, data: {status: action === 'PUBLISH' ? 'PUBLISHED' : action === 'UNPUBLISH' ? 'DRAFT' : 'ARCHIVED', ...(action === 'PUBLISH' ? {publishedAt: new Date()} : {}), version: {increment: 1}}});
        if (changed.count !== 1) throw new EditConflictError('This resource changed in another tab. Reload before publishing.');
        return snapshot(tx, id, actorId, action);
      });
    },
  };
}
