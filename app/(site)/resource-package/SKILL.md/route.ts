import {authoringSkill} from '@/lib/authoring-skill';

export const dynamic = 'force-static';

export function GET() {
  return new Response(authoringSkill, {headers: {'Content-Type': 'text/markdown; charset=utf-8', 'X-Content-Type-Options': 'nosniff'}});
}
