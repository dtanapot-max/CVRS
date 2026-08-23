import {spawnSync} from 'node:child_process';
const [a,b]=process.argv.slice(2);
if(!a||!b){console.error('Usage: node tools/compare-cores.mjs <core-A.mjs> <core-B.mjs>');process.exit(2)}
const bench=new URL('../workloads/final-selection-bench.mjs',import.meta.url).pathname;
function run(core){const rows=[];for(let i=0;i<3;i++){const r=spawnSync(process.execPath,['--expose-gc',bench,core],{encoding:'utf8',maxBuffer:10*1024*1024});if(r.status!==0)throw new Error(r.stderr||`benchmark failed ${r.status}`);rows.push(JSON.parse(r.stdout.trim().split(/\r?\n/).at(-1)))}return rows}
const median=x=>{x=[...x].sort((a,b)=>a-b);return x[Math.floor(x.length/2)]};
function aggregate(rows){const o={environment:{node:rows[0].node,platform:rows[0].platform,arch:rows[0].arch},runs:3};for(const k of ['reactive','eventbus','router','computed500']){o[k]={};for(const m of ['medianMs','p95Ms','p99Ms','maxMs','throughput'])o[k][m]=median(rows.map(x=>x[k][m]))}o.routerColdMs=median(rows.map(x=>x.routerColdMs));o.heapDeltaMedian=median(rows.map(x=>x.memory.deltaHeap));return o}
const out={coreA:{path:a,...aggregate(run(a))},coreB:{path:b,...aggregate(run(b))}};out.deltaPercent={};for(const k of ['reactive','eventbus','router','computed500'])out.deltaPercent[k]=(out.coreB[k].throughput/out.coreA[k].throughput-1)*100;console.log(JSON.stringify(out,null,2));
