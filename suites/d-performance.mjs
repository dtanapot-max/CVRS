import {assert,now,median,percentile} from '../lib/util.mjs';
function stats(samples,ops){return {samples,medianMs:median(samples),p95Ms:percentile(samples,.95),p99Ms:percentile(samples,.99),opsPerSecMedian:ops/(median(samples)/1000)}}
export const cases=[
{id:'D-ROUTER-001',domain:'D',name:'Router cold + warm protocol ≥7 samples',critical:false,timeout:12000,isolate:true,async run({a}){const ops=100000;const r=new a.Router();for(let i=0;i<5000;i++)r.add(`/u/${i}/:id`,()=>1);const coldT=now();r.match('/u/4999/1?q=x');const coldMs=now()-coldT;for(let i=0;i<20000;i++)r.match('/u/4999/1?q=x');const samples=[];for(let s=0;s<7;s++){const t=now();for(let i=0;i<ops;i++)r.match('/u/4999/1?q=x');samples.push(now()-t)}assert(samples.length>=7);return {coldMs,...stats(samples,ops),workload:'same router/same process'}}},
{id:'D-REACTIVE-001',domain:'D',name:'Reactive warm protocol ≥7 samples',critical:false,timeout:12000,isolate:true,async run({a}){const ops=100000;const sig=a.signal(0);for(let i=0;i<20000;i++){sig.set(i);sig.get()}const samples=[];for(let s=0;s<7;s++){const t=now();for(let i=0;i<ops;i++){sig.set(i);sig.get()}samples.push(now()-t)}return stats(samples,ops*2)}}
];
