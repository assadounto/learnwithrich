'use server';

import {revalidatePath, revalidateTag} from 'next/cache';
import {requireOwner} from '@/lib/server/identity/access';
import {database} from '@/lib/server/database';
import {ContactInputError, parseContacts} from '@/lib/server/site-contact';
import {contactCacheTag} from '@/lib/site-contact';

export async function saveSiteContacts(_previous: {message: string; ok: boolean}, form: FormData) {
  await requireOwner();
  try {
    const links = parseContacts(Object.fromEntries(form), true);
    await database().siteContactSettings.upsert({where: {id: 1}, create: {id: 1, links}, update: {links}});
    revalidateTag(contactCacheTag);
    revalidatePath('/', 'layout');
    revalidatePath('/admin/site-contact');
    return {message: 'Public contact details saved.', ok: true};
  } catch (error) {
    return {message: error instanceof ContactInputError ? error.message : 'Could not save your contact details. Try again.', ok: false};
  }
}
