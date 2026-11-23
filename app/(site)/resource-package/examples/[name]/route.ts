import project from '@/docs/resource-package-examples/single-project.json';
import course from '@/docs/resource-package-examples/course-bundle.json';
import allTypes from '@/docs/resource-package-examples/all-resource-types.json';

const examples = new Map<string, unknown>([
  ['single-project.json', project],
  ['course-bundle.json', course],
  ['all-resource-types.json', allTypes],
]);

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from(examples.keys(), name => ({name}));
}

export async function GET(_request: Request, {params}: {params: Promise<{name: string}>}) {
  const example = examples.get((await params).name);
  return example ? Response.json(example) : new Response('Not found', {status: 404});
}
