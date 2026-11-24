'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {assertOwner} from '@/lib/server/identity/owner';
import {assertSessionMfa} from '@/lib/server/identity/mfa';
import {database} from '@/lib/server/database';
import {requireOwner} from '@/lib/server/identity/access';
import {ideaFields, ideaSlug, IdeaInputError} from '@/lib/server/project-ideas';

export async function saveIdea(_previous: string, form: FormData): Promise<string> {
  await requireOwner();
  const current = form.get('current');
  const status = form.get('status');
  if (status !== 'DRAFT' && status !== 'PUBLISHED' && status !== 'ARCHIVED') return 'Choose an idea status.';
  try {
    const data = ideaFields({
      title: form.get('title'), discipline: form.get('discipline'), abstract: form.get('abstract'),
      tags: String(form.get('tags') ?? '').split(',').map(tag => tag.trim()).filter(Boolean),
    });
    const slug = ideaSlug(data.title, current || form.get('slug') || undefined);
    const db = database();
    if (current) {
      const updatedAt = new Date(String(form.get('updatedAt') ?? ''));
      if (!Number.isFinite(updatedAt.getTime())) return 'Reopen the idea before saving.';
      const result = await db.projectIdea.updateMany({where: {slug, updatedAt}, data: {...data, status}});
      if (!result.count) return 'This idea changed. Reopen it before saving.';
    } else {
      await db.projectIdea.create({data: {...data, slug, status}});
    }
  } catch (error) {
    if (error instanceof IdeaInputError) return error.message;
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') return 'That URL slug is already taken.';
    throw error;
  }
  revalidatePath('/project-ideas');
  revalidatePath('/admin/project-ideas');
  redirect('/admin/project-ideas?saved=1');
}

function selectedIdeas(input: unknown) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) throw new IdeaInputError('Select 1 to 100 ideas.');
  const selected = input.map((value: unknown) => {
    if (!value || typeof value !== 'object' || !('id' in value) || !('updatedAt' in value) || typeof value.updatedAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T/.test(value.updatedAt) || !Number.isFinite(Date.parse(value.updatedAt))) throw new IdeaInputError('Reload your idea selection.');
    return {slug: ideaSlug('', value.id), updatedAt: new Date(value.updatedAt)};
  });
  if (new Set(selected.map(row => row.slug)).size !== selected.length) throw new IdeaInputError('Select each idea only once.');
  return selected;
}

export async function bulkIdeaStatus(input: unknown, status: unknown) {
  const owner = await requireOwner();
  try {
    if (status !== 'DRAFT' && status !== 'PUBLISHED' && status !== 'ARCHIVED') throw new IdeaInputError('Choose an idea status.');
    const selected = selectedIdeas(input);
    const changed = await database().$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
      await assertOwner(tx, owner.id);
      await assertSessionMfa(tx, {userId: owner.id, sessionId: owner.sessionId});
      let changed = 0;
      for (const row of selected) {
        const current = await tx.projectIdea.findUnique({where: row});
        if (!current) throw new IdeaInputError('A selected idea changed. Reload the list and try again.');
        if (current.status === status) continue;
        if (status === 'PUBLISHED') ideaFields(current);
        const result = await tx.projectIdea.updateMany({where: row, data: {status}});
        if (!result.count) throw new IdeaInputError('A selected idea changed. Reload the list and try again.');
        changed++;
      }
      return changed;
    });
    revalidatePath('/project-ideas');
    revalidatePath('/admin/project-ideas');
    return {ok: true as const, changed};
  } catch (error) {
    return {ok: false as const, error: error instanceof IdeaInputError ? error.message : 'Could not update the selected ideas.'};
  }
}

export async function deleteIdeas(input: unknown) {
  const owner = await requireOwner();
  try {
    const selected = selectedIdeas(input);
    const changed = await database().$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${owner.id}, 18427653))`;
      await assertOwner(tx, owner.id);
      await assertSessionMfa(tx, {userId: owner.id, sessionId: owner.sessionId});
      const removed = await tx.projectIdea.deleteMany({where: {OR: selected}});
      if (removed.count !== selected.length) throw new IdeaInputError('A selected idea changed. Reload the list before deleting.');
      return removed.count;
    });
    revalidatePath('/project-ideas');
    revalidatePath('/admin/project-ideas');
    revalidatePath('/admin/project-ideas/[slug]/edit', 'page');
    return {ok: true as const, changed};
  } catch (error) {
    return {ok: false as const, error: error instanceof IdeaInputError ? error.message : 'Could not delete the selected ideas.'};
  }
}
