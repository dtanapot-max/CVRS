import {assert,now} from '../lib/util.mjs';
export const cases=[
{id:'S-OPS-1M',domain:'STRESS',name:'1M reactive read/write operations',critical:true,timeout:15000,isolate:true,async run({a}){const s=a.signal(0),n=500000,t=now();for(let i=0;i<n;i++){s.set(i);s.get()}return {operations:n*2,durationMs:now()-t}}},
{id:'S-NODES-100K',domain:'STRESS',name:'100K reactive nodes',critical:true,timeout:20000,isolate:true,async run({a}){const xs=[];for(let i=0;i<100000;i++)xs.push(a.signal(i));assert(xs[99999].get()===99999);return {nodes:xs.length}}},
{id:'S-LIFECYCLE-10K',domain:'STRESS',name:'10K create/destroy cycles',critical:true,timeout:30000,isolate:true,async run({a}){for(let i=0;i<10000;i++){const c=a.createCore();await c.destroy()}return {cycles:10000}}},
{id:'S-BOOT-RETRY-1K',domain:'STRESS',name:'1K boot/fail/retry cycles',critical:true,timeout:45000,isolate:true,async run({a}){for(let i=0;i<1000;i++){const c=a.createCore();let first=true;c.modules.register({name:'m',init:async()=>{if(first){first=false;throw new Error('x')}},teardown:async()=>{}});try{await c.boot()}catch{}await c.boot();await c.destroy()}return {cycles:1000}}}
];
