import 'dotenv/config';
import {createDatabase} from '../lib/server/database-client';
import {bootstrapOwner} from '../lib/server/identity/owner';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL.');
const userId = process.argv[2];
if (!userId) throw new Error('Usage: npm run owner:bootstrap -- VERIFIED_USER_ID');
const db = createDatabase(process.env.DATABASE_URL);
try { console.log(JSON.stringify(await bootstrapOwner(db, userId), null, 2)); }
finally { await db.$disconnect(); }
