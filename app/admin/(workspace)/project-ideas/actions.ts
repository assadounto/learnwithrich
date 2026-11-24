'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
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
