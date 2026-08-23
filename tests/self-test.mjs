import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {assert} from '../lib/util.mjs';import {runCases} from '../lib/runner.mjs';import {cases as fixture} from './fixture-suite.mjs';
const profiles=JSON.parse(fs.readFileSync(new URL('../config/profiles.json',import.meta.url)));for(const p of ['smoke','standard','release','final'])assert(Array.isArray(profiles[p]));
const r=await runCases([{id:'SELF-1',domain:'SELF',name:'pass case',async run(){return {ok:true}}}],{});assert(r[0].status==='PASS');
const f=await runCases([{id:'SELF-2',domain:'SELF',name:'fail case',async run(){throw new Error('expected')}}],{});assert(f[0].status==='FAIL');
const corePath=fileURLToPath(new URL('./fixture-core.mjs',import.meta.url)),suiteUrl=new URL('./fixture-suite.mjs',import.meta.url).href;
const iso=await runCases(fixture.map(x=>({...x,suiteUrl})),{corePath});assert(iso[0].status==='PASS');assert(iso[1].status==='FAIL'&&iso[1].forcedTermination===true,'isolation timeout must force terminate');
console.log('CVRS SELF TEST PASS 5/5');
