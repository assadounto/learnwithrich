export type ResourceType = 'Project' | 'Document' | 'Book' | 'Illustration' | 'Course';
export type Resource = { slug: string; title: string; type: ResourceType; topic: string; description: string; art: string; access: 'Free' | 'Premium'; duration?: string; download?: string; };
export const resources: Resource[] = [
  { slug: 'solar-hybrid-power-system', title: 'Build a solar hybrid power system', type: 'Project', topic: 'Electronics & IoT', description: 'Explore the architecture, source selection and battery protection behind a solar, grid and battery controller.', art: 'solar', access: 'Free', download: '/downloads/solar-project-outline.md' },
  { slug: 'smart-energy-monitor', title: 'A smarter way to understand energy', type: 'Project', topic: 'Electronics & IoT', description: 'Plan an energy monitoring project, from sensing and data collection to a useful dashboard.', art: 'energy', access: 'Free', download: '/downloads/energy-project-outline.md' },
  { slug: 'maker-marketplace', title: 'Build a marketplace for makers', type: 'Project', topic: 'Software', description: 'A project blueprint for a marketplace with products, collections and thoughtful discovery.', art: 'web', access: 'Free' },
  { slug: 'practical-maker', title: 'The Practical Maker', type: 'Book', topic: 'Books & guides', description: 'A proposed hands-on guide to turning a useful idea into a documented working prototype.', art: 'book', access: 'Premium' },
  { slug: 'smart-energy-project-guide', title: 'Smart Energy Project Guide', type: 'Document', topic: 'Books & guides', description: 'A project documentation concept covering scope, components, methodology and evaluation.', art: 'guide', access: 'Free', download: '/downloads/energy-project-outline.md' },
  { slug: 'creative-circuit-illustrations', title: 'Creative Circuit Illustrations', type: 'Illustration', topic: 'Illustration', description: 'An illustrated resource concept for explaining electronics with clear and expressive visuals.', art: 'illustration', access: 'Premium' },
  { slug: 'african-makers', title: 'African Makers: Ideas and Projects', type: 'Illustration', topic: 'Illustration', description: 'A preview collection celebrating African makers, their ideas and creative processes.', art: 'illustration', access: 'Premium' },
  { slug: 'esp32-first-connected-device', title: 'ESP32: Your first connected device', type: 'Course', topic: 'Electronics & IoT', description: 'Start with the board, explore sensors and work towards a connected low-voltage device.', art: 'esp', access: 'Premium', duration: '4 modules' },
  { slug: 'build-a-web-app', title: 'Build a web app from scratch', type: 'Course', topic: 'Software', description: 'A planned practical course connecting a Rails API with a thoughtful Next.js experience.', art: 'web', access: 'Premium', duration: '4 modules' },
];
export const topics = ['All', 'Electronics & IoT', 'Software', 'Books & guides', 'Illustration'];
export function filterResources(items: Resource[], query: string, type: string, topic: string, access: string = 'All') {
 const q = query.trim().toLowerCase();
 return items.filter(r => (!q || `${r.title} ${r.description} ${r.topic} ${r.type}`.toLowerCase().includes(q)) && (type === 'All' || r.type === type) && (topic === 'All' || r.topic === topic) && (access === 'All' || r.access === access));
}
