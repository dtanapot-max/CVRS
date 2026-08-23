import fs from 'node:fs';
import path from 'node:path';

const target=path.resolve(process.argv[2]||'.');
const maxFiles=Number(process.env.CVRS_DISCOVERY_MAX_FILES||10000);
const ignore=new Set(['node_modules','.git','vendor','dist','build','coverage','evidence']);
const files=[];
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignore.has(ent.name)) continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) walk(p);
    else { files.push(p); if(files.length>maxFiles) throw new Error('discovery file limit exceeded'); }
  }
}
walk(target);
const rel=p=>path.relative(target,p).replaceAll('\\','/');
const names=files.map(rel);
const ext=new Map();
for(const n of names){const e=path.extname(n).toLowerCase()||'<none>';ext.set(e,(ext.get(e)||0)+1)}
const has=(rx)=>names.some(n=>rx.test(n));
const manifests=names.filter(n=>/(^|\/)(package\.json|composer\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod)$/i.test(n));
const tests=names.filter(n=>/(^|\/)(test|tests|spec|specs)(\/|\.|_)/i.test(n)||/\.(test|spec)\.[^.]+$/i.test(n));
const capabilities=[];
if(has(/\.(mjs|cjs|js|ts|tsx|jsx)$/i)) capabilities.push('runtime.javascript');
if(has(/\.py$/i)) capabilities.push('runtime.python');
if(has(/\.php$/i)) capabilities.push('runtime.php');
if(has(/\.(html|css)$/i)) capabilities.push('runtime.browser');
if(has(/(^|\/)(routes?|router|navigation)[\/._-]/i)) capabilities.push('routing');
if(has(/(^|\/)(storage|opfs|indexeddb|filesystem|fs)[\/._-]/i)) capabilities.push('storage');
if(has(/(^|\/)(db|database|sql|repository)[\/._-]/i)) capabilities.push('database');
if(has(/(^|\/)(http|server|api|controller)[\/._-]/i)) capabilities.push('http');
if(has(/(^|\/)(signal|reactive|computed|effect)[\/._-]/i)) capabilities.push('reactive');
const out={
 schema:'cvrs-discovery.v1', target, fileCount:files.length,
 extensions:Object.fromEntries([...ext].sort((a,b)=>b[1]-a[1])),
 manifests, tests, capabilities:[...new Set(capabilities)],
 recommendation:{
   builtInTests:tests.length>0,
   requiresContractMapping:true,
   executeTargetDuringDiscovery:false,
   next:'map capabilities to explicit contract pack/adapter before verification'
 }
};
console.log(JSON.stringify(out,null,2));
