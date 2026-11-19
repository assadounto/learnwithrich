import {ResourceInputError, resourceId, text, validateDraft} from '../resources/validation.ts';
export type CollectionSection = {key: string; title: string};
export type CollectionItem = {resourceId: string; sectionKey: string | null};
export function collectionInput(type: string, sections: unknown, items: unknown) {
  if (!Array.isArray(sections) || sections.length > 40 || !Array.isArray(items) || items.length > 200) throw new ResourceInputError('Use at most 40 sections and 200 items.');
  const sectionRows: CollectionSection[] = sections.map(value => {
    if (!value || typeof value !== 'object') throw new ResourceInputError('Invalid section.');
    return {key: resourceId(value.key), title: text(value.title, 'section title', 180)};
  });
  const keys = new Set(sectionRows.map(section => section.key));
  if (keys.size !== sectionRows.length) throw new ResourceInputError('Section keys must be unique.');
  const itemRows: CollectionItem[] = items.map(value => {
    if (!value || typeof value !== 'object') throw new ResourceInputError('Invalid collection item.');
    const sectionKey = value.sectionKey == null || value.sectionKey === '' ? null : resourceId(value.sectionKey);
    if (sectionKey && !keys.has(sectionKey)) throw new ResourceInputError('Choose a section in this resource.');
    return {resourceId: resourceId(value.resourceId), sectionKey};
  });
  if (new Set(itemRows.map(item => item.resourceId)).size !== itemRows.length) throw new ResourceInputError('A resource can appear only once in a collection.');
  if (!['COURSE', 'PATH'].includes(type) && (sections.length || items.length)) throw new ResourceInputError('Only courses and paths contain other resources.');
  return {sections: sectionRows, items: itemRows};
}
export function editToken(version: unknown, updatedAt: unknown) {
  if (!Number.isSafeInteger(version) || Number(version) < 0 || typeof updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(updatedAt) || Number.isNaN(Date.parse(updatedAt))) throw new ResourceInputError('Reload this resource before editing.');
  return {version: Number(version), updatedAt: new Date(updatedAt)};
}
export function adminDraft(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ResourceInputError('Invalid resource.');
  const value = input as Record<string, unknown>;
  const draft = validateDraft(value);
  return {...draft, ...collectionInput(draft.type, value.sections ?? [], value.items ?? []), id: value.id == null ? null : resourceId(value.id), token: value.id == null ? null : editToken(value.version, value.updatedAt)};
}
