import type {Prisma} from '../../generated/prisma/client';
import type {Database} from '../database-client';
import {catalogQuery, ResourceInputError, resourceId, resourceSlug, text, validateDraft} from './validation';

const cardSelect = {
  id: true, slug: true, type: true, title: true, summary: true, coverUrl: true,
  access: true, priceMinor: true, currency: true, publishedAt: true,
  tags: {select: {tag: {select: {name: true}}}, orderBy: {tag: {name: 'asc'}}},
} satisfies Prisma.ResourceSelect;
function published(now = new Date()): Prisma.ResourceWhereInput {
  return {status: 'PUBLISHED', publishedAt: {lte: now}};
}
function card<T extends {tags: {tag: {name: string}}[]}>(record: T) {
  return {...record, tags: record.tags.map(value => value.tag.name)};
}
// All mutations here are trusted-server operations. No public mutation route exposes them.
export function resourceRepository(db: Database) {
  return {
    async createDraft(input: unknown) {
      const {bodyMarkdown, details, tags, ...data} = validateDraft(input);
      return db.resource.create({data: {
        ...data, status: 'DRAFT', content: {create: {bodyMarkdown, details}},
        tags: {create: tags.map(name => ({tag: {connectOrCreate: {where: {name}, create: {name}}}}))},
      }});
    },
    async publish(id: string) {
      return db.resource.update({where: {id: resourceId(id)}, data: {status: 'PUBLISHED', publishedAt: new Date(), version: {increment: 1}}});
    },
    async archive(id: string) {
      return db.resource.update({where: {id: resourceId(id)}, data: {status: 'ARCHIVED', version: {increment: 1}}});
    },
    async createSection(id: string, title: string, position: number) {
      if (!Number.isSafeInteger(position) || position < 0) throw new ResourceInputError('Invalid section position.');
      return db.$transaction(async tx => {
        const section = await tx.resourceSection.create({data: {resourceId: resourceId(id), title: text(title, 'section title', 180), position}});
        await tx.resource.update({where: {id}, data: {version: {increment: 1}}});
        return section;
      });
    },
    async replaceItems(collectionId: string, items: {resourceId: string; sectionId?: string | null}[]) {
      resourceId(collectionId);
      if (!Array.isArray(items) || items.length > 200) throw new ResourceInputError('Use at most 200 collection items.');
      const rows = items.map((item, position) => ({collectionId, resourceId: resourceId(item.resourceId), sectionId: item.sectionId ? resourceId(item.sectionId) : null, position}));
      if (new Set(rows.map(row => row.resourceId)).size !== rows.length) throw new ResourceInputError('A resource can appear only once in a collection.');
      return db.$transaction(async tx => {
        // Matches the DB triggers: serialize graph edits before reading/deleting edges.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(18427651)`;
        const parent = await tx.resource.findUnique({where: {id: collectionId}, select: {type: true}});
        if (!parent || !['COURSE', 'PATH'].includes(parent.type)) throw new ResourceInputError('Only courses and paths can contain resources.');
        await tx.resourceItem.deleteMany({where: {collectionId}});
        if (rows.length) await tx.resourceItem.createMany({data: rows});
        await tx.resource.update({where: {id: collectionId}, data: {version: {increment: 1}}});
        return tx.resourceItem.findMany({where: {collectionId}, orderBy: {position: 'asc'}});
      });
    },
    async listPublic(params: URLSearchParams) {
      const {type, query, tag, page, limit} = catalogQuery(params);
      const where: Prisma.ResourceWhereInput = {
        ...published(), ...(type ? {type} : {}),
        ...(tag ? {tags: {some: {tag: {name: tag}}}} : {}),
        ...(query ? {OR: [
          {title: {contains: query, mode: 'insensitive'}},
          {summary: {contains: query, mode: 'insensitive'}},
          {tags: {some: {tag: {name: {contains: query.toLowerCase()}}}}},
        ]} : {}),
      };
      const [rows, total] = await db.$transaction([
        db.resource.findMany({where, select: cardSelect, orderBy: [{publishedAt: 'desc'}, {id: 'desc'}], skip: (page - 1) * limit, take: limit}),
        db.resource.count({where}),
      ], {isolationLevel: 'RepeatableRead'});
      return {items: rows.map(card), total, page, limit};
    },
    async getPublic(slug: string) {
      const row = await db.resource.findFirst({where: {...published(), slug: resourceSlug(slug)}, select: {
        ...cardSelect,
        sections: {select: {id: true, title: true, position: true}, orderBy: {position: 'asc'}},
        items: {where: {resource: published()}, orderBy: {position: 'asc'}, select: {position: true, sectionId: true, resource: {select: cardSelect}}},
      }});
      if (!row) return null;
      // Access is checked again in the body query. A public parent never unlocks a paid child.
      const readable = await db.resource.findFirst({where: {...published(), id: row.id, access: 'PUBLIC'}, select: {content: {select: {bodyMarkdown: true, details: true}}}});
      return {
        ...card(row), items: row.items.map(item => ({position: item.position, sectionId: item.sectionId, resource: card(item.resource)})),
        bodyMarkdown: readable?.content?.bodyMarkdown ?? null, details: readable?.content?.details ?? null, requiresAccess: row.access !== 'PUBLIC',
      };
    },
  };
}
