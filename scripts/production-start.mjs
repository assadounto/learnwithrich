import {validateProductionEnvironment} from './production-environment.mjs';
const errors = validateProductionEnvironment(process.env);
if(errors.length) { console.error('Production configuration rejected:\n'+errors.join('\n')); process.exit(1); }
await import('../server.js');
