export const authoringScopes = [
  {id: 'upload', field: 'canUpload', label: 'Preview and import resource ZIPs'},
  {id: 'edit', field: 'canEdit', label: 'Read and edit resource drafts'},
  {id: 'ideas', field: 'canCreateIdeas', label: 'Create project idea drafts'},
  {id: 'publish-resources', field: 'canPublishResources', label: 'Publish resource drafts'},
  {id: 'publish-ideas', field: 'canPublishIdeas', label: 'Publish project idea drafts'},
] as const;

export type AuthoringScope = (typeof authoringScopes)[number]['id'];
