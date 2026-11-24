export const disciplines = [
  {id: 'electrical', label: 'Electrical & electronics'},
  {id: 'mechanical', label: 'Mechanical engineering'},
  {id: 'software', label: 'Software & computing'},
  {id: 'civil', label: 'Civil & built environment'},
  {id: 'environmental', label: 'Environmental science'},
  {id: 'interdisciplinary', label: 'Interdisciplinary research'},
] as const;

export function disciplineLabel(id: string) {
  return disciplines.find(item => item.id === id)?.label ?? id;
}
