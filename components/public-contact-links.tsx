import {ArrowUpRight, Globe, Mail, MessageCircle, Phone, Youtube} from 'lucide-react';
import {contactFields, type SiteContacts} from '@/lib/site-contact';

export function PublicContactLinks({contacts}: {contacts: SiteContacts}) {
  const fields = contactFields.filter(field => contacts[field.id]);
  if (!fields.length) return null;

  return <ul className="public-contact-links" aria-label="Public contact and social links">
    {fields.map(field => {
      const value = contacts[field.id]!;
      const href = field.id === 'whatsapp' ? `https://wa.me/${value.slice(1)}`
        : field.kind === 'email' ? `mailto:${value}` : field.kind === 'tel' ? `tel:${value}` : value;
      const external = field.kind === 'url' || field.id === 'whatsapp';
      const label = field.id === 'whatsapp' ? 'WhatsApp' : field.kind === 'url' ? field.label : value;
      const Icon = field.id === 'whatsapp' ? MessageCircle : field.kind === 'tel' ? Phone
        : field.kind === 'email' ? Mail : field.id === 'youtube' ? Youtube : Globe;
      return <li key={field.id}><a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        <Icon size={16} aria-hidden="true"/><span>{label}</span>{external && <ArrowUpRight size={12} aria-hidden="true"/>}
      </a></li>;
    })}
  </ul>;
}
