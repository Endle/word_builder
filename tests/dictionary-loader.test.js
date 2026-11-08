/* Network/cache regression tests, including actual dictionary files. */
function assert(value,message){if(!value)throw new Error(message);}
var requests=[],timers=new Map(),nextTimer=0,behavior;
var setTimeout=function(fn){timers.set(++nextTimer,fn);return nextTimer;};
var clearTimeout=function(id){timers.delete(id);};
var AbortController=function(){this.signal={aborted:false};this.abort=()=>{this.signal.aborted=true;};};
var fetch=function(url,options){requests.push({url,options});return behavior(url,options);};
function fresh(){requests=[];timers.clear();load('dictionary-loader.js');}
function success(url){const length=Number(url.match(/words-(\d+)\.json/)[1]);return Promise.resolve({ok:true,json:async()=>JSON.parse(readFile('assets/words-'+length+'.json'))});}
async function expectFailure(action,text){let failed=false;try{await action();}catch(error){failed=true;assert(error.dictionaryLoad,'Tagged dictionary error');assert(error.message.includes(text),error.message);}assert(failed,'Request should fail');}
async function run(){
 fresh();behavior=success;
 const result=await loadWordDictionary([3]);
 assert(result.some(e=>e[0]==='pit')&&result.some(e=>e[0]==='pot'),'Real 3-letter data includes PIT and POT');
 assert(requests.length===1&&requests[0].url==='assets/words-3.json?v=3','Fetch only requested word length');
 await loadWordDictionary([3]);assert(requests.length===1,'Cache successful data');
 await loadWordDictionary([3,5,3]);assert(requests.length===2,'Cache by length and deduplicate');
 assert(timers.size===0,'Successful requests clear timers');
 fresh();behavior=url=>requests.length===1?Promise.reject(new Error('offline')):success(url);
 await loadWordDictionary([5]);assert(requests.length===2&&requests[1].url.includes('retry='),'Retry with fresh URL');assert(requests[1].options.cache==='reload','Bypass cache on retry');
 fresh();behavior=()=>Promise.reject(new Error('offline'));
 await expectFailure(()=>loadWordDictionary([5]),'Check your connection');
 assert(requests.length===2,'Stop after two attempts');
 behavior=success;await loadWordDictionary([5]);assert(requests.length===3,'Allow user to retry after failure');
 fresh();behavior=()=>Promise.resolve({ok:false,status:404});
 await expectFailure(()=>loadWordDictionary([4]),'HTTP 404');
 fresh();behavior=()=>Promise.resolve({ok:true,json:async()=>{throw new Error('broken JSON');}});
 await expectFailure(()=>loadWordDictionary([4]),'not valid JSON');
 fresh();behavior=()=>Promise.resolve({ok:true,json:async()=>[['invalid length',0]]});
 await expectFailure(()=>loadWordDictionary([4]),'invalid entries');
 fresh();let release;behavior=url=>new Promise(resolve=>{release=()=>success(url).then(resolve);});
 const a=loadWordDictionary([3]),b=loadWordDictionary([3]);assert(requests.length===1,'Concurrent searches share a download');release();await Promise.all([a,b]);
 fresh();behavior=()=>new Promise(()=>{});
 const timeoutResult=expectFailure(()=>loadWordDictionary([5]),'timed out');
 [...timers.values()][0]();
 for(let i=0;i<12;i++)await Promise.resolve();
 assert(requests.length===2,'Timeout retries once');
 [...timers.values()][0]();await timeoutResult;
 assert(requests.every(r=>r.options.signal.aborted),'Timeout aborts requests');
 assert(timers.size===0,'No timers left behind');
 print('All dictionary loader tests passed.');
}
run().catch(function(error){print(error);quit(1);});
