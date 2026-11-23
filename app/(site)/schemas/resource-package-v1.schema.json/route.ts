import schema from '@/docs/resource-package.schema.json';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(schema);
}
