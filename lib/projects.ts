import { resources } from './catalog';
const details: Record<string, { level: string; tools: string[]; focus: string; image: string }> = {
 'solar-hybrid-power-system': { level: 'Advanced', tools: ['ESP32', 'Power systems', 'Sensors'], focus: 'Source selection & battery protection', image: 'solar' },
 'smart-energy-monitor': { level: 'Intermediate', tools: ['ESP32', 'Sensors', 'Data'], focus: 'Sensing, readings & useful dashboards', image: 'energy' },
 'maker-marketplace': { level: 'Intermediate', tools: ['Rails', 'Next.js', 'PostgreSQL'], focus: 'Products, collections & discovery', image: 'web' },
};
export const projects = resources.filter(resource => resource.type === 'Project').map(resource => ({ ...resource, ...details[resource.slug] }));
