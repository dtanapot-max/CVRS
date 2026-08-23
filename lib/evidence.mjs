import fs from 'node:fs';import path from 'node:path';
export function writeEvidence(dir,data){
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(data,null,2));
 const lines=['# CVRS Report','',`**CVRS:** ${data.cvrsVersion}`,`**Profile:** ${data.profile.toUpperCase()}`,`**Decision:** ${data.decision}`,`**Target SHA-256:** ${data.environment.coreSha256}`,'',`PASS ${data.summary.pass}/${data.summary.total} | FAIL ${data.summary.fail}`,''];
 for(const r of data.results)lines.push(`- ${r.status==='PASS'?'🟢':'🔴'} **${r.id}** ${r.name}${r.classification?` — ${r.classification}`:''}${r.isolated?' [isolated]':''}`);
 if(data.regressionComparison){lines.push('','## Baseline Regression','',`
${JSON.stringify(data.regressionComparison,null,2)}`)}
 fs.writeFileSync(path.join(dir,'REPORT.md'),lines.join('\n'));
 return dir;
}
