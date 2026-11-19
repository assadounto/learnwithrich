import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateProductionEnvironment} from '../lib/server/deployment/environment.mjs';
const env = {DATABASE_URL:'postgresql://app:strong-password@db:5432/app',LWR_AUTH_URL:'https://learn.example',LWR_AUTH_SECRET:'x'.repeat(64),LWR_GOOGLE_CLIENT_ID:'client',LWR_GOOGLE_CLIENT_SECRET:'secret',LWR_ADMIN_ENABLED:'false'};
test('production configuration rejects placeholders, insecure origins and invalid admin flags',()=>{
 assert.deepEqual(validateProductionEnvironment(env),[]);
 assert.deepEqual(validateProductionEnvironment({...env,LWR_ADMIN_ENABLED:'true'}),[]);
 for(const changes of [{LWR_AUTH_URL:'http://learn.example'},{LWR_AUTH_SECRET:'REPLACE_WITH_SECRET'},{LWR_AUTH_URL:'https://other.example/path'},{DATABASE_URL:'postgresql://app:local-development-only@db/app'},{LWR_ADMIN_ENABLED:'invalid'}]) assert.ok(validateProductionEnvironment({...env,...changes}).length);
});
