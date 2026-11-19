import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {createDatabase} from '../lib/server/database-client';
import {resourceRepository} from '../lib/server/resources/repository';

const [command, argument, inputFile] = process.argv.slice(2);
if (!['create', 'publish', 'archive', 'section', 'items', 'list', 'get'].includes(command)) {
  throw new Error('Usage: npm run resources -- create draft.json | publish ID | archive ID | section ID section.json | items ID items.json | list | get SLUG');
}
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before managing resources.');
const db = createDatabase(process.env.DATABASE_URL);
const store = resourceRepository(db);
const json = async (file: string) => JSON.parse(await readFile(file, 'utf8'));
try {
  let result: unknown;
  switch (command) {
    case 'create': result = await store.createDraft(await json(argument)); break;
    case 'publish': result = await store.publish(argument); break;
    case 'archive': result = await store.archive(argument); break;
    case 'section': {
      const data = await json(inputFile);
      result = await store.createSection(argument, data.title, data.position);
      break;
    }
    case 'items': result = await store.replaceItems(argument, await json(inputFile)); break;
    case 'list': result = await store.listPublic(new URLSearchParams()); break;
    case 'get': result = await store.getPublic(argument); break;
  }
  console.log(JSON.stringify(result, null, 2));
} finally { await db.$disconnect(); }
