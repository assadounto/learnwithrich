'use server';
import {revalidatePath} from 'next/cache';
import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {adminRepository, EditConflictError} from '@/lib/server/admin/repository';
import {ResourceInputError} from '@/lib/server/resources/validation';
function failure(error: unknown) {
  if (error instanceof ResourceInputError || error instanceof EditConflictError) return {ok: false as const, error: error.message};
  console.error('Admin resource mutation failed', error instanceof Error ? error.name : 'UnknownError');
  return {ok: false as const, error: 'Could not save. Check that the slug is unique, courses contain only lessons, and paths have no circular links.'};
}
export async function saveResource(input: unknown) {
  const owner = await requireOwner();
  try {
    const row = await adminRepository(database(), owner.id, owner.sessionId).save(input);
    revalidatePath('/admin/resources'); revalidatePath(`/admin/resources/${row.id}`);
    return {ok: true as const, id: row.id};
  } catch (error) { return failure(error); }
}
export async function changeResourceStatus(id: string, version: number, updatedAt: string, action: string) {
  const owner = await requireOwner();
  try {
    await adminRepository(database(), owner.id, owner.sessionId).transition(id, version, updatedAt, action);
    revalidatePath('/admin/resources'); revalidatePath(`/admin/resources/${id}`);
    return {ok: true as const, id};
  } catch (error) { return failure(error); }
}

export async function refreshResourceChoices() {
  const owner = await requireOwner();
  try {
    return {ok: true as const, choices: await adminRepository(database(), owner.id, owner.sessionId).choices()};
  } catch { return {ok: false as const, error: 'Could not refresh your resource library. Please try again.'}; }
}

export async function saveHomepage(input: unknown) {
  const owner = await requireOwner();
  try {
    const sections = await adminRepository(database(), owner.id, owner.sessionId).saveHomepage(input);
    revalidatePath('/');
    revalidatePath('/admin/homepage');
    return {ok: true as const, sections};
  } catch (error) { return failure(error); }
}

export async function saveHomepageHero(input: unknown) {
  const owner = await requireOwner();
  try {
    await adminRepository(database(), owner.id, owner.sessionId).saveHomepageHero(input);
    revalidatePath('/');
    revalidatePath('/admin/homepage');
    return {ok: true as const};
  } catch (error) { return failure(error); }
}

export async function bulkResourceStatus(input: unknown, status: unknown) {
  const owner = await requireOwner();
  try {
    const changed = await adminRepository(database(), owner.id, owner.sessionId).bulkTransition(input, status);
    revalidatePath('/admin/resources');
    return {ok: true as const, changed};
  } catch (error) { return failure(error); }
}
