/* Tests loader behavior with simulated browser script requests. */
function assert(value,message){if(!value)throw new Error(message);}
var requests=[],timers=new Set(),nextTimer=0,behavior;
var setTimeout=function(){timers.add(++nextTimer);return nextTimer;};
var clearTimeout=function(id){timers.delete(id);};
var document={createElement:function(){return {remove:function(){this.removed=true;}};},head:{appendChild:function(script){requests.push(script);behavior(script);}}};
function fresh(){delete globalThis.WORDS;requests=[];load('dictionary-loader.js');}
async function run(){
 fresh();
 behavior=function(script){globalThis.WORDS=[['pit',100]];script.onload();};
 const result=await loadWordDictionary();
 assert(result[0][0]==='pit','Successful data is returned');
 await loadWordDictionary();assert(requests.length===1,'Loaded dictionary is reused');
 assert(requests[0].removed&&timers.size===0,'Successful request cleans up');
 fresh();
 behavior=function(script){if(requests.length===1)script.onerror();else{globalThis.WORDS=[['pot',200]];script.onload();}};
 await loadWordDictionary();
 assert(requests.length===2&&requests[1].src.includes('retry='),'Failed request retries with cache bypass');
 fresh();behavior=function(script){script.onerror();};
 let failed=false;try{await loadWordDictionary();}catch(error){failed=true;assert(error.message.includes('tap Find words'),'Failure offers actionable retry');}
 assert(failed&&requests.length===2,'Persistent failure stops after two attempts');
 behavior=function(script){globalThis.WORDS=[['tip',300]];script.onload();};
 await loadWordDictionary();assert(requests.length===3,'User can retry after failure');
 fresh();behavior=function(script){script.onload();};
 failed=false;try{await loadWordDictionary();}catch(error){failed=true;}
 assert(failed&&requests.length===2,'Missing data retries and fails clearly');
 fresh();let waiting;
 behavior=function(script){waiting=script;};
 const a=loadWordDictionary(),b=loadWordDictionary();
 assert(a===b&&requests.length===1,'Concurrent callers share a request');
 globalThis.WORDS=[['pin',400]];waiting.onload();await a;
 assert(timers.size===0,'No timers left behind');
 print('All dictionary loader tests passed.');
}
run().catch(function(error){print(error);quit(1);});
