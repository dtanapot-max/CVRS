import { loadCore2x } from '../adapters/core2x.mjs';
const [suiteUrl,id,corePath] = process.argv.slice(2);
let payload;
try {
  const mod = await import(suiteUrl);
  const tc = mod.cases.find(x=>x.id===id);
  if(!tc) throw new Error(`Unknown test case: ${id}`);
  const a = await loadCore2x(corePath);
  const started = performance.now();
  const detail = await tc.run({a,corePath});
  payload={ok:true,durationMs:performance.now()-started,detail:detail||{}};
} catch(e) {
  payload={ok:false,error:{name:e?.name||'Error',message:e?.message||String(e),stack:e?.stack||''}};
}
process.stdout.write(`\n__CVRS_RESULT__${JSON.stringify(payload)}\n`);
