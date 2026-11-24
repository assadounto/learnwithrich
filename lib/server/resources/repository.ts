import type {Prisma} from '../../generated/prisma/client';
import type {Database} from '../database-client';
import {catalogQuery, ResourceInputError, resourceId, resourceSlug, text, validateDraft} from './validation';
import {defaultHomepageSections, homepageHeroSelect, loadHomepageHero, validateHomepageSections} from '../admin/homepage';

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
    async publicTags(type?: ReturnType<typeof catalogQuery>['type']) {
      const rows = await db.tag.findMany({
        where: {resources: {some: {resource: {...published(), ...(type ? {type} : {})}}}},
        orderBy: {name: 'asc'}, select: {name: true},
      });
      return rows.map(row => row.name);
    },
    async publicBookmarks(slugs: string[]) {
      const rows = await db.resource.findMany({where: {...published(), slug: {in: slugs}}, select: cardSelect});
      return rows.map(card);
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
    async homepage() {
      const settings = await db.homepageSettings.findUnique({where: {id: 1}, select: {sections: true, ...homepageHeroSelect}});
      const sections = validateHomepageSections(settings?.sections ?? defaultHomepageSections);
      const hero = await loadHomepageHero(db, settings);
      const loadSections = () => Promise.all(sections.map(async section => {
        const rows = await db.resource.findMany({
          where: {
            ...published(),
            ...(section.type === 'ALL' ? {} : {type: section.type}),
            ...(section.source === 'SELECTED' ? {id: {in: section.resourceIds}} : {}),
          },
          select: cardSelect,
          orderBy: [{publishedAt: 'desc'}, {id: 'desc'}],
          take: section.limit,
        });
        const byId = new Map(rows.map(row => [row.id, row]));
        const ordered = section.source === 'SELECTED' ? section.resourceIds.map(id => byId.get(id)).filter((row): row is (typeof rows)[number] => Boolean(row)).slice(0, section.limit) : rows;
        return {...section, items: ordered.map(card)};
      }));
      return {sections: loadSections, hero};
    },
    async getPublic(slug: string, viewerId?: string) {
      const row = await db.resource.findFirst({where: {...published(), slug: resourceSlug(slug)}, select: {
        ...cardSelect,
        sections: {select: {id: true, title: true, position: true}, orderBy: {position: 'asc'}},
        items: {where: {resource: published()}, orderBy: {position: 'asc'}, select: {position: true, sectionId: true, resource: {select: cardSelect}}},
        includedIn: {where: {collection: published()}, select: {collection: {select: {
          ...cardSelect,
          sections: {select: {id: true, title: true, position: true}, orderBy: {position: 'asc'}},
          items: {where: {resource: published()}, orderBy: {position: 'asc'}, select: {position: true, sectionId: true, resource: {select: cardSelect}}},
        }}}},
        media: {include: {mediaAsset: {select: {id: true, originalName: true, mimeType: true, sizeBytes: true}}}, orderBy: {position: 'asc'}},
      }});
      if (!row) return null;
      const [bundlePurchase, filePurchases] = viewerId ? await Promise.all([
        db.purchase.findFirst({where: {userId: viewerId, resourceId: row.id, status: 'PAID'}, select: {id: true}}),
        db.purchase.findMany({where: {userId: viewerId, resourceMedia: {resourceId: row.id}, status: 'PAID'}, select: {resourceMediaId: true}}),
      ]) : [null, []];
      const hasBundle = Boolean(bundlePurchase);
      const canRead = row.access === 'PUBLIC' || (row.access === 'FREE_ACCOUNT' && Boolean(viewerId)) || (row.access === 'PAID' && hasBundle);
      // Private fields remain omitted from anonymous projections. Bundle ownership unlocks every file.
      const readable = canRead ? await db.resource.findFirst({where: {...published(), id: row.id}, select: {content: {select: {bodyMarkdown: true, details: true}}}}) : null;
      const purchasedMedia = new Set(filePurchases.map(purchase => purchase.resourceMediaId));
      return {
        ...card(row), items: row.items.map(item => ({position: item.position, sectionId: item.sectionId, resource: card(item.resource)})),
        collections: row.includedIn.map(item => ({...card(item.collection), sections: item.collection.sections, items: item.collection.items.map(child => ({position: child.position, sectionId: child.sectionId, resource: card(child.resource)}))})),
        media: row.media.map(item => ({id: item.id, title: item.title, priceMinor: item.priceMinor, originalName: item.mediaAsset.originalName, mimeType: item.mediaAsset.mimeType, sizeBytes: item.mediaAsset.sizeBytes, includedInBundle: row.access === 'PAID', owned: row.access === 'PAID' ? hasBundle : (row.access === 'PUBLIC' || Boolean(viewerId)) && (item.priceMinor === 0 || purchasedMedia.has(item.id))})),
        bodyMarkdown: readable?.content?.bodyMarkdown ?? null, details: readable?.content?.details ?? null, requiresAccess: !canRead, hasBundle, signedIn: Boolean(viewerId),
      };
    },
  };
}
