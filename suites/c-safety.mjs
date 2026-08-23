import {assert} from '../lib/util.mjs';
export const cases=[
{id:'C-DEFAULT-DI-001',domain:'C',name:'Default DI services available',async run({a}){const c=a.createCore();for(const k of ['events','storage','navigation','diagnostics','timeTravel'])assert(c.services.has(k),k);await c.destroy()}},
{id:'C-DIRECT-CLEANUP-001',domain:'C',name:'Direct-service final cleanup',async run({a}){const c=a.createCore();let d=0;c.services.provide('x',{onDestroy:async()=>d++});await c.destroy();assert(d===1)}},
{id:'C-STORAGE-PRESERVE-001',domain:'C',name:'Existing storage survives failed boot',async run({a}){const s=new a.MemoryStorageAdapter('cvrsC','preserve');await s.clear();await s.set('keep',{ok:true});const c=a.createCore({storageAdapter:s});c.modules.register({name:'bad',init:async()=>{throw new Error('x')}});try{await c.boot()}catch{}assert((await s.get('keep'))?.ok===true)}},
{id:'C-ABORT-001',domain:'C',name:'AbortSignal cancels EventBus listener',async run({a}){const b=new a.EventBus(),ac=new AbortController();let n=0;b.on('x',()=>n++,{signal:ac.signal});b.emit('x');ac.abort();b.emit('x');assert(n===1&&b.listenerCount('x')===0)}},
{id:'C-POLLUTION-001',domain:'C',name:'Prototype pollution resistance',async run({a}){const r=new a.Router();r.add('/x',()=>1);const m=r.match('/x?__proto__=polluted&constructor=x&prototype=y');assert(m.query.__proto__===undefined&&m.query.constructor===undefined&&m.query.prototype===undefined);assert({}.polluted===undefined)}},
{id:'C-FREEZE-001',domain:'C',name:'deepFreeze recursive immutability',async run({a}){const x={a:{b:1}};a.deepFreeze(x);assert(Object.isFrozen(x)&&Object.isFrozen(x.a))}},
{id:'C-CLONE-001',domain:'C',name:'resilient clone deep separation',async run({a}){const x={a:{b:1}};const y=a.clone(x);assert(y!==x&&y.a!==x.a&&y.a.b===1)}},
{id:'C-PAGE-NAV-001',domain:'C',name:'Page → Router → Navigation compatibility',async run({a}){const c=a.createCore();let entered=0;c.pages.register({id:'p',route:'/p/:id',enter:()=>entered++,render:(ctx)=>ctx.route.params.id});await c.boot();const r=await c.navigate('/p/42');assert(r.metadata.pageId==='p'&&r.renderOutput==='42'&&entered===1);await c.destroy()}}
];
