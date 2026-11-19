import 'server-only';
import {database} from '../database';
import {resourceRepository} from './repository';
export function resources() { return resourceRepository(database()); }
