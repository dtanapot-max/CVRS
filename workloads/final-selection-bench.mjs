
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
const p=process.argv[2];
const m=await import(pathToFileURL(p).href+'?sel='+Date.now());
const med=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
const pct=(a,p)=>{a=[...a].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.ceil(a.length*p)-1)]};
const stats=(a,ops)=>({medianMs:med(a),p95Ms:pct(a,.95),p99Ms:pct(a,.99),maxMs:Math.max(...a),throughput:ops/(med(a)/1000)});
async function sample(fn,ops,n=15){for(let i=0;i<5;i++)fn();let a=[];for(let i=0;i<n;i++){let t=performance.now();fn();a.push(performance.now()-t)}return stats(a,ops)}
let out={node:process.version,platform:process.platform,arch:process.arch};
{
 let s=m.signal(0); out.reactive=await sample(()=>{for(let i=0;i<500000;i++){s.set(i);s.get()}},1000000);
}
{
 let b=new m.EventBus();b.on('x',()=>{});out.eventbus=await sample(()=>{for(let i=0;i<500000;i++)b.emit('x',i)},500000);
}
{
 let r=new m.Router();for(let i=0;i<5000;i++)r.add(`/u/${i}/:id`,()=>1);
 let t=performance.now();r.match('/u/4999/1?q=x');out.routerColdMs=performance.now()-t;
 out.router=await sample(()=>{for(let i=0;i<200000;i++)r.match('/u/4999/1?q=x')},200000);
}
{
 let root=m.signal(1), cur=root;
 for(let i=0;i<500;i++){let prev=cur;cur=m.computed(()=>prev.get()+1)}
 out.computed500=await sample(()=>{for(let i=0;i<1000;i++){root.set(i+2);cur.get()}},1000,11);
}
if(global.gc){
 global.gc(); let before=process.memoryUsage().heapUsed;
 for(let k=0;k<10000;k++){let s=m.signal(k);let c=m.computed(()=>s.get()+1);c.get();c.dispose?.();s.dispose?.()}
 global.gc(); let after=process.memoryUsage().heapUsed;
 out.memory={beforeHeap:before,afterHeap:after,deltaHeap:after-before};
}else out.memory={note:'run with --expose-gc'};
console.log(JSON.stringify(out));
