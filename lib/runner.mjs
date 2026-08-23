import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { now, result } from './util.mjs';
const execFileP=promisify(execFile);
const worker=fileURLToPath(new URL('./case-worker.mjs',import.meta.url));

async function runIsolated(tc,ctx){
  const timeout=tc.timeout||5000;
  const t=now();
  try{
    const {stdout,stderr}=await execFileP(process.execPath,[...(global.gc?['--expose-gc']:[]),worker,tc.suiteUrl,tc.id,ctx.corePath],{timeout,maxBuffer:8*1024*1024,env:{...process.env,CVRS_CHILD:'1'}});
    const marker='__CVRS_RESULT__'; const idx=stdout.lastIndexOf(marker);
    if(idx<0) throw new Error(`TEST_INFRA_FAILURE: worker returned no result${stderr?`: ${stderr.slice(-500)}`:''}`);
    const p=JSON.parse(stdout.slice(idx+marker.length).trim());
    if(!p.ok) throw Object.assign(new Error(p.error?.message||'worker failure'),{stack:p.error?.stack});
    return result(tc.id,tc.domain,tc.name,'PASS',p.durationMs??now()-t,p.detail||{},null,tc.critical!==false,{isolated:true,timeoutMs:timeout});
  }catch(e){
    const timed=/timed out|ETIMEDOUT|SIGTERM/i.test(`${e.message} ${e.signal||''}`);
    return result(tc.id,tc.domain,tc.name,'FAIL',now()-t,{message:timed?'TIMEOUT_FORCED_TERMINATION':e.message,stack:e.stack||'',signal:e.signal||null},tc.classification||'CORE_BUG_OR_SPEC_GAP',tc.critical!==false,{isolated:true,timeoutMs:timeout,forcedTermination:timed});
  }
}

export async function runCases(cases,ctx){
  const out=[];
  for(const tc of cases){
    if(tc.isolate){out.push(await runIsolated(tc,ctx));continue;}
    const t=now(); let timer;
    try{
      const detail=await Promise.race([tc.run(ctx),new Promise((_,r)=>{timer=setTimeout(()=>r(new Error('TIMEOUT')),tc.timeout||5000)})]);
      clearTimeout(timer);out.push(result(tc.id,tc.domain,tc.name,'PASS',now()-t,detail||{},null,tc.critical!==false,{isolated:false,timeoutMs:tc.timeout||5000}));
    }catch(e){clearTimeout(timer);out.push(result(tc.id,tc.domain,tc.name,'FAIL',now()-t,{message:e.message,stack:e.stack},tc.classification||'CORE_BUG_OR_SPEC_GAP',tc.critical!==false,{isolated:false,timeoutMs:tc.timeout||5000}));}
  }
  return out;
}
