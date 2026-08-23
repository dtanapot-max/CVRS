import {assert} from '../lib/util.mjs';
import {runCases} from '../lib/runner.mjs';
import {cases as REG} from '../suites/regression.mjs';

function makeAdapter({buggyRollback=false,buggyDefaults=false}={}) {
  const defaults=['events','storage','navigation','diagnostics','timeTravel'];
  return {
    LifecyclePhase:{READY:'ready'},
    createCore(){
      const defs=new Map(defaults.map(k=>[k,{direct:true}]));
      const modules=[]; let phase='created';
      const services={
        provide(token,inst){defs.set(token,{inst});return services},
        has(token){return defs.has(token)}
      };
      return {
        services,
        modules:{register(m){modules.push(m)}},
        get phase(){return phase},
        async boot(){
          try { for(const m of modules) await m.init?.(); phase='ready'; }
          catch(e){
            if(buggyRollback) defs.clear();
            else if(buggyDefaults) for(const k of defaults) defs.delete(k);
            phase='destroyed'; throw e;
          }
        },
        async destroy(){phase='destroyed'}
      };
    }
  };
}

const reg004=REG.find(x=>x.id==='REG-004');
const reg006=REG.find(x=>x.id==='REG-006');
assert(reg004&&reg006,'required regression gates missing');

let r=await runCases([reg004,reg006],{a:makeAdapter()});
assert(r.every(x=>x.status==='PASS'),'false positive against conforming rollback behavior');

r=await runCases([reg004],{a:makeAdapter({buggyRollback:true})});
assert(r[0].status==='FAIL','REG-004 failed to detect definition-loss defect');

r=await runCases([reg006],{a:makeAdapter({buggyDefaults:true})});
assert(r[0].status==='FAIL','REG-006 failed to detect default-service-loss defect');

console.log('CVRS REGRESSION HARNESS SELF TEST PASS 4/4');
