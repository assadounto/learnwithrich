import {database} from '@/lib/server/database';
import {access, mkdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await database().resource.count();
    await database().user.count();
    await database().ownerMfa.count();
    await database().resourceContent.findFirst({select: {details: true}});
    await database().homepageSettings.findUnique({where: {id: 1}, select: {id: true}});
    const mediaDirectory = path.resolve(process.env.MEDIA_STORAGE_DIR || '.media');
    await mkdir(mediaDirectory, {recursive: true});
    await access(mediaDirectory, constants.R_OK | constants.W_OK);
    return Response.json({status: 'ready'}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return Response.json({status: 'unavailable'}, {status: 503, headers: {'Cache-Control': 'no-store'}});
  }
}
