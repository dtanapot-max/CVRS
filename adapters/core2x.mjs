import { pathToFileURL } from 'node:url';
export async function loadCore2x(path){
  const C=await import(pathToFileURL(path).href+`?cvrs=${Date.now()}_${Math.random()}`);
  if(typeof C.createCore!=='function') throw new Error('createCore export not found');
  const wrapSignal=(v)=>{const [get,set]=C.createSignal(v);return {get,set,peek:get.peek}};
  const wrapComputed=(fn,o)=>{const get=C.createComputed(fn,o);return {get,peek:get.peek}};
  return {
    id:'core2x.v1', raw:C,
    capabilities:{reactive:!!C.createSignal,eventBus:!!C.EventBus,lifecycle:!!C.createCore,module:!!C.ModuleRegistry,service:!!C.ServiceRegistry,router:!!C.Router,navigation:!!C.NavigationManager,storage:!!C.MemoryStorageAdapter,diagnostics:!!C.DiagnosticsManager,pages:!!C.PageRegistry,contracts:!!C.Contracts},
    createCore:(o={})=>C.createCore(o),signal:wrapSignal,computed:wrapComputed,effect:(fn)=>C.createEffect(fn),batch:(fn)=>C.batch(fn),untrack:(fn)=>C.untrack(fn),store:(o)=>C.createStore(o),
    Router:C.Router,MemoryStorageAdapter:C.MemoryStorageAdapter,EventBus:C.EventBus,ModuleRegistry:C.ModuleRegistry,ServiceRegistry:C.ServiceRegistry,PageRegistry:C.PageRegistry,NavigationManager:C.NavigationManager,DiagnosticsManager:C.DiagnosticsManager,
    deepFreeze:C.deepFreeze,clone:C.resilientClone,LifecyclePhase:C.LifecyclePhase,CoreError:C.CoreError,ErrorCode:C.ErrorCode
  };
}
