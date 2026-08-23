import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const target=process.argv[2]; if(!target){console.error('Usage: node tools/plan.mjs <target-dir>');process.exit(2)}
const d=new URL('../discovery/discover.mjs',import.meta.url).pathname;
const r=spawnSync(process.execPath,[d,target],{encoding:'utf8'});
if(r.status!==0){process.stderr.write(r.stderr);process.exit(r.status??1)}
const x=JSON.parse(r.stdout);
const map={
 'reactive':'reactive.v1','storage':'storage.v1','http':'http.v1','database':'database.v1',
 'runtime.browser':'runtime.browser.v1'
};
const packs=['performance.v1'];
if(x.capabilities.some(v=>v.startsWith('runtime.'))) packs.push('runtime.process.v1');
for(const c of x.capabilities) if(map[c]) packs.push(map[c]);
if(x.capabilities.some(c=>['reactive','routing','storage'].includes(c))) packs.push('core.kernel.v1');
console.log(JSON.stringify({
 schema:'cvrs-verification-plan.v1',
 discovery:x,
 candidateContractPacks:[...new Set(packs)],
 authority:'CANDIDATE_ONLY_REQUIRES_REVIEW',
 rules:[
  'Do not execute unsupported domain gates.',
  'Do not classify missing inferred capability as CORE_BUG.',
  'Built-in tests and CVRS independent tests remain separate.',
  'Adapter must not emulate missing target behavior.'
 ]
},null,2));
