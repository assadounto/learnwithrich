import {database} from '@/lib/server/database';
import {checkMediaStorage} from '@/lib/server/media/library';
import {homepageHeroSelect} from '@/lib/server/admin/homepage';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await database().resource.count();
    await database().user.count();
    await database().ownerMfa.count();
    await database().resourceContent.findFirst({select: {details: true}});
    await database().homepageSettings.findUnique({where: {id: 1}, select: homepageHeroSelect});
    await database().siteContactSettings.findUnique({where: {id: 1}, select: {id: true}});
    await checkMediaStorage();
    return Response.json({status: 'ready'}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return Response.json({status: 'unavailable'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
