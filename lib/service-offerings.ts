export const serviceOfferings = [
  {id: 'ELECTRICAL_ENGINEERING', label: 'Electrical engineering', detail: 'Power and energy projects, circuit and control design, technical review, and troubleshooting.'},
  {id: 'ONE_ON_ONE_TUTORING', label: 'One-on-one teaching', detail: 'Bring a topic you want to understand. We can work through it together at your pace.'},
  {id: 'ONE_ON_ONE_CONVERSATION', label: 'One-on-one conversation', detail: 'Talk through an idea, a technical decision, or where to start with a project.'},
  {id: 'ELECTRONICS_PROJECT', label: 'Electronics & IoT', detail: 'Embedded systems, connected devices, prototypes, and practical testing.'},
  {id: 'SOFTWARE_PROJECT', label: 'Software projects', detail: 'Web apps, APIs, prototypes, and practical tools.'},
  {id: 'THESIS_SUPPORT', label: 'Research & thesis guidance', detail: 'Technical guidance, research planning, and feedback on your own work.'},
  {id: 'CAPSTONE', label: 'Final-year or capstone project', detail: 'Scope your idea, plan a prototype, and work out how to evaluate it.'},
  {id: 'CONSULTING', label: 'Technical consulting', detail: 'Get a second opinion on a plan, a system, or an implementation.'},
  {id: 'OTHER', label: 'Something else', detail: 'Tell me what you have in mind.'},
] as const;

export function serviceLabel(id: string) {
  return serviceOfferings.find(item => item.id === id)?.label ?? id.replaceAll('_', ' ').toLowerCase();
}

export const voiceMaxBytes = 8 * 1024 * 1024;
export const voiceMaxSeconds = 180;
