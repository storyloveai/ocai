import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CC = require('../server/sanguo-core.cjs');
const which = process.argv[2] || 'monte';
const { monteCampaign } = await import('./src/monte/index.mjs');
const camp = which === 'monte' ? monteCampaign() : (await import('./src/mortal/index.mjs')).mortalCampaign();
const { errors, warnings } = CC.validate(camp);
console.log(which, 'nodes', Object.keys(camp.nodes).length, 'vars', Object.keys(camp.vars).length);
console.log('ERRORS', errors.length); errors.forEach(e => console.log('  E', e));
console.log('WARNINGS', warnings.length); warnings.forEach(w => console.log('  W', w));
if (process.argv.includes('--sim')) { const r = CC.simulate(camp, 2000); console.log(Object.keys(r).join(",")); console.log(JSON.stringify(r.findings||r.F||[], null, 0).slice(0, 6000)); }
