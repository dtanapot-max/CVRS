import { performance } from 'node:perf_hooks';
import fs from 'node:fs';import crypto from 'node:crypto';import os from 'node:os';
export const now=()=>performance.now();
export function assert(cond,msg='assertion failed'){if(!cond) throw new Error(msg)}
export async function expectThrow(fn){try{await fn();return false}catch{return true}}
export function percentile(values,p){const a=[...values].sort((x,y)=>x-y);if(!a.length)return 0;const rank=(a.length-1)*p,lo=Math.floor(rank),hi=Math.ceil(rank);return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(rank-lo)}
export function median(values){return percentile(values,.5)}
export function sha256(path){return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}
export function sha256Text(s){return crypto.createHash('sha256').update(s).digest('hex')}
export function envFingerprint(corePath,extra={}){return {platform:process.platform,release:os.release(),arch:process.arch,node:process.version,v8:process.versions.v8,cpu:os.cpus()[0]?.model||'unknown',logicalCores:os.cpus().length,ramBytes:os.totalmem(),gcExposed:typeof global.gc==='function',corePath,coreSha256:sha256(corePath),cvrsVersion:'1.0.0',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,timestamp:new Date().toISOString(),...extra}}
export function result(id,domain,name,status,durationMs=0,detail={},classification=null,critical=true,execution={}){return {id,domain,name,status,durationMs,detail,classification,critical,...execution}}
