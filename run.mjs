#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';
import {loadCore2x} from './adapters/core2x.mjs';import {runCases} from './lib/runner.mjs';import {envFingerprint,sha256Text} from './lib/util.mjs';import {writeEvidence} from './lib/evidence.mjs';import {compareBaseline} from './lib/regression.mjs';
import {cases as A} from './suites/a-correctness.mjs';import {cases as B} from './suites/b-adversarial.mjs';import {cases as C} from './suites/c-safety.mjs';import {cases as D} from './suites/d-performance.mjs';import {cases as REG} from './suites/regression.mjs';import {cases as STRESS} from './suites/stress.mjs';import {cases as MEMORY} from './suites/memory.mjs';import {cases as REPEATABILITY} from './suites/repeatability.mjs';import {requiredFinalProviders} from './suites/final.mjs';

function parseArgs(argv){const o={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))continue;const k=argv[i].slice(2),n=argv[i+1];o[k]=n&&!n.startsWith('--')?(i++,n):true;}return o;}
const args=parseArgs(process.argv.slice(2));
if(!args.core){console.error('Usage: cvrs --core <path> [--profile smoke|standard|release|final] [--baseline results.json] [--final-provider name,...]');process.exit(4)}
const corePath=path.resolve(String(args.core));if(!fs.existsSync(corePath)){console.error('INVALID_TARGET');process.exit(4)}
const profile=String(args.profile||'release').toLowerCase();const profilesText=fs.readFileSync(new URL('./config/profiles.json',import.meta.url),'utf8');const gatesText=fs.readFileSync(new URL('./config/gates.json',import.meta.url),'utf8');const profiles=JSON.parse(profilesText);if(!profiles[profile]){console.error('CONFIG_ERROR');process.exit(5)}
let a;try{a=await loadCore2x(corePath)}catch(e){console.error('INVALID_TARGET',e.message);process.exit(4)}
const maps={A,B,C,D,REG,STRESS,MEMORY,REPEATABILITY};const urls={A:new URL('./suites/a-correctness.mjs',import.meta.url).href,B:new URL('./suites/b-adversarial.mjs',import.meta.url).href,C:new URL('./suites/c-safety.mjs',import.meta.url).href,D:new URL('./suites/d-performance.mjs',import.meta.url).href,REG:new URL('./suites/regression.mjs',import.meta.url).href,STRESS:new URL('./suites/stress.mjs',import.meta.url).href,MEMORY:new URL('./suites/memory.mjs',import.meta.url).href,REPEATABILITY:new URL('./suites/repeatability.mjs',import.meta.url).href};
let cases=[];for(const d of profiles[profile])if(maps[d])for(const tc of maps[d])cases.push({...tc,suiteUrl:urls[d]});
const results=await runCases(cases,{a,corePath});
for (const r of results) {
  if (r.status !== 'PASS' && !r.classification) {
    r.classification = 'UNCLASSIFIED_REQUIRES_DIAGNOSIS';
  }
}
const criticalFails=results.filter(r=>r.critical&&r.status!=='PASS');const summary={total:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status!=='PASS').length};
let finalMissing=[];if(profile==='final'){const supplied=String(args['final-provider']||'').split(',').filter(Boolean);finalMissing=requiredFinalProviders.filter(x=>!supplied.includes(x));}
const regressionComparison=compareBaseline(results,args.baseline?path.resolve(String(args.baseline)):null);
let decision=criticalFails.length||regressionComparison?.criticalRegressions?.length?'RELEASE_BLOCKED':finalMissing.length?'INCOMPLETE_PROFILE':'PASS';
const stamp=new Date().toISOString().replace(/[:.]/g,'-');const env=envFingerprint(corePath,{profileConfigHash:sha256Text(profilesText),gateConfigHash:sha256Text(gatesText),adapter:a.id});const data={cvrsVersion:'1.0.0',profile,target:{adapter:a.id,capabilities:a.capabilities},environment:env,summary,decision,profileCompleteness:{requiredDomains:profiles[profile],finalMissing},regressionComparison,results};
const evidenceDir=writeEvidence(path.resolve('evidence',stamp),data);
console.log(`CVRS ${profile.toUpperCase()} — PASS ${summary.pass}/${summary.total} — ${decision}`);for(const r of results.filter(x=>x.status!=='PASS'))console.log(`FAIL ${r.id}: ${r.name} :: ${r.detail?.message||''}`);if(finalMissing.length)console.log(`FINAL missing: ${finalMissing.join(', ')}`);console.log(`Evidence: ${evidenceDir}`);
const exit=decision==='PASS'?0:decision==='RELEASE_BLOCKED'?1:decision==='INCOMPLETE_PROFILE'?3:6;process.exit(exit);
