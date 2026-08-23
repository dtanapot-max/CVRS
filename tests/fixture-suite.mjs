export const cases=[
{id:'FIX-PASS',domain:'SELF',name:'isolated pass',isolate:true,timeout:1000,async run(){return {ok:true}}},
{id:'FIX-HANG',domain:'SELF',name:'isolated sync hang',isolate:true,timeout:250,async run(){while(true){}}}
];
