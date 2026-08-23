import fs from 'node:fs';
const g=JSON.parse(fs.readFileSync(new URL('../gvs.json',import.meta.url),'utf8'));
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const checks=[
 ['Version semantic',/^\d+\.\d+\.\d+$/.test(g.version)],
 ['Package/version match',pkg.version===g.version],
 ['Release YYYYMMDD',/^\d{8}$/.test(g.release)],
 ['Build YYYYMMDD-HHmm',/^\d{8}-\d{4}$/.test(g.build)],
 ['Core identity present',typeof g.core==='string'&&g.core.length>0],
 ['Baseline present',typeof g.baseline==='string'&&g.baseline.length>0],
 ['Schema version separate',typeof g.schema==='string'&&g.schema.length>0&&g.schema!==g.version],
 ['Standard separate',typeof g.standard==='string'&&g.standard.length>0&&g.standard!==g.version],
 ['Status present',typeof g.status==='string'&&g.status.length>0],
 ['No field aliasing',new Set([g.version,g.release,g.build,g.core,g.baseline,g.schema]).size===6]
];
for(const [n,ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${n}`);
const pass=checks.filter(x=>x[1]).length;
console.log(`GVS VERIFY ${pass}/${checks.length} ${pass===checks.length?'PASS':'FAIL'}`);
process.exit(pass===checks.length?0:1);
