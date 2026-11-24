export const contactFields = [
  {id: 'email', label: 'Public email', kind: 'email'},
  {id: 'phone', label: 'Contact number', kind: 'tel'},
  {id: 'whatsapp', label: 'WhatsApp number', kind: 'tel'},
  {id: 'youtube', label: 'YouTube', kind: 'url', hosts: ['youtube.com', 'youtu.be']},
  {id: 'instagram', label: 'Instagram', kind: 'url', hosts: ['instagram.com']},
  {id: 'linkedin', label: 'LinkedIn', kind: 'url', hosts: ['linkedin.com']},
  {id: 'github', label: 'GitHub', kind: 'url', hosts: ['github.com']},
  {id: 'facebook', label: 'Facebook', kind: 'url', hosts: ['facebook.com', 'fb.com']},
  {id: 'tiktok', label: 'TikTok', kind: 'url', hosts: ['tiktok.com']},
  {id: 'x', label: 'X / Twitter', kind: 'url', hosts: ['x.com', 'twitter.com']},
  {id: 'website', label: 'Other website', kind: 'url', hosts: []},
] as const;

export type ContactId = (typeof contactFields)[number]['id'];
export type SiteContacts = Partial<Record<ContactId, string>>;
export const contactCacheTag = 'site-contacts';
