import 'server-only';
import {unstable_cache} from 'next/cache';
import {database} from '@/lib/server/database';
import {validEmail} from '@/lib/server/community/submissions';
import {contactCacheTag, contactFields, type SiteContacts} from '@/lib/site-contact';

export class ContactInputError extends Error {}

export function parseContacts(input: unknown, strict = false): SiteContacts {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const result: SiteContacts = {};
  for (const field of contactFields) {
    const raw = source[field.id];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const value = raw.trim();
    try {
      if (field.kind === 'email') {
        if (value.length > 254 || !validEmail(value) || !/^[a-z\d.!_+%-]+@[a-z\d.-]+$/i.test(value)) throw new Error();
        result[field.id] = value;
      } else if (field.kind === 'tel') {
        const number = value.replace(/[\s().-]/g, '');
        if (!/^\+[1-9]\d{6,14}$/.test(number)) throw new Error();
        result[field.id] = number;
      } else {
        if (value.length > 2048) throw new Error();
        const url = new URL(value);
        const hosts: readonly string[] = 'hosts' in field ? field.hosts : [];
        if (url.protocol !== 'https:' || url.username || url.password || url.port ||
          (hosts.length && !hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)))) throw new Error();
        result[field.id] = url.href;
      }
    } catch {
      if (strict) throw new ContactInputError(field.kind === 'tel' ? `${field.label} needs an international number beginning with +.` : `Enter a valid ${field.label} ${field.kind === 'url' ? 'HTTPS link' : 'address'}.`);
    }
  }
  return result;
}

export async function loadContacts() {
  const row = await database().siteContactSettings.findUnique({where: {id: 1}, select: {links: true}});
  return parseContacts(row?.links);
}

const cachedContacts = unstable_cache(loadContacts, ['public-site-contacts'], {tags: [contactCacheTag], revalidate: 300});

export async function publicContacts() {
  // Static builds can run before a database connection is configured.
  if (!process.env.DATABASE_URL) return {};
  return cachedContacts().catch(() => ({}));
}
