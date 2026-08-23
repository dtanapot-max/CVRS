import fs from 'node:fs';
export function compareBaseline(current,baselinePath){
 if(!baselinePath)return null;
 const b=JSON.parse(fs.readFileSync(baselinePath,'utf8')); const bm=new Map((b.results||[]).map(x=>[x.id,x]));
 const transitions=[];
 for(const r of current){const old=bm.get(r.id);if(old&&old.status!==r.status)transitions.push({id:r.id,from:old.status,to:r.status,critical:r.critical});}
 return {baseline:baselinePath,transitions,criticalRegressions:transitions.filter(x=>x.critical&&x.from==='PASS'&&x.to!=='PASS')};
}
