load('solver.js');
function assert(value,message){if(!value)throw new Error(message);}
const dictionary=[['train',100],['stain',200],['inert',300],['rates',400],['tears',500],['eerie',600],['rarer',0],['aa',0],['tarn',20000]];
const query={letters:'AERSTIN',length:5};
assert(WordSolver.search(dictionary,query).length===5,'Find all five-letter matches');
assert(WordSolver.search(dictionary,{letters:'ERI',length:0}).length===0,'Do not reuse letters');
assert(WordSolver.search(dictionary,{letters:'EEERI',length:5})[0][0]==='eerie','Allow provided repeats');
assert(WordSolver.search(dictionary,{...query,starts:'T',ends:'N',pattern:'_ R ? _ _'})[0][0]==='train','Combine all positions');
assert(WordSolver.search(dictionary,query,new Set(['train'])).every(e=>e[0]!=='train'),'Exclude previous suggestions');
assert(WordSolver.search(dictionary,{letters:'RARR E',length:5,commonOnly:true}).length===0,'Filter uncommon words');
assert(WordSolver.search(dictionary,query,new Set(),'alpha')[0][0]==='inert','Sort alphabetically');
assert(WordSolver.search(dictionary,{...query,length:0,pattern:'_r___'})[0][0]==='train','Pattern supplies length with Any');
for(const bad of [{...query,letters:'12'}, {...query,pattern:'___'}, {...query,starts:'a',pattern:'b____'}, {...query,starts:'zz'}, {...query,length:7,letters:'cat'}]){
 let rejected=false;try{WordSolver.validate(bad);}catch(e){rejected=true;}assert(rejected,'Reject invalid or conflicting input');
}
const allWords=[];
for(let n=2;n<=15;n++){const entries=JSON.parse(readFile('assets/words-'+n+'.json'));assert(entries.every(e=>e[0].length===n),'Shard contains only its declared word length');allWords.push(...entries);}
assert(allWords.length>150000,'Full dictionary is bundled');
const real=WordSolver.search(allWords,query);
assert(real.some(e=>e[0]==='train'),'Real dictionary includes train');
for(const [word] of real){const letters=[...query.letters.toLowerCase()];for(const ch of word){const index=letters.indexOf(ch);assert(index>=0,'Dictionary result respects letter counts');letters.splice(index,1);}}
print('All solver regression tests passed; '+allWords.length+' dictionary entries; '+real.length+' sample matches.');

const short=WordSolver.search(allWords,{letters:'opntio',length:3});
assert(['pit','pot'].every(w=>short.some(e=>e[0]===w)),'OPNTIO includes PIT and POT');
