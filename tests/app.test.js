/* Exercise the real page handlers with lightweight DOM stand-ins. */
function assert(value,message){if(!value)throw new Error(message);}
class Element {
 constructor(){this.value='';this.dataset={};this.listeners={};this.children=[];this.attributes={};this.classList={toggle(){}};this.innerHTML='Find words';}
 addEventListener(type,handler){this.listeners[type]=handler;}
 setAttribute(name,value){this.attributes[name]=value;}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=children;}
 focus(){}
 scrollIntoView(options){this.scrollOptions=options;}
}
const elements={};
const buttons=[0,3,4,5,6,7].map(n=>{const e=new Element();e.dataset.length=String(n);return e;});
var document={getElementById(id){return elements[id]||(elements[id]=new Element());},querySelectorAll(){return buttons;},createElement(){return new Element();},createTextNode(text){return text;}};
var window={matchMedia(){return {matches:true};}};
document.getElementById('letters').value='AERSTIN';
document.getElementById('sort').value='common';
const loads=[];let releaseInitial;
var loadWordDictionary=async function(lengths){loads.push(lengths);if(loads.length===1)await new Promise(resolve=>{releaseInitial=resolve;});let entries=[];for(const n of lengths)entries=entries.concat(JSON.parse(readFile('assets/words-'+n+'.json')));return entries;};
load('solver.js');load('app.js');
function clickLength(n){const button=buttons.find(e=>Number(e.dataset.length)===n);elements['length-options'].listeners.click({target:{closest(){return button;}}});}
async function flush(){for(let i=0;i<20;i++)await Promise.resolve();}
async function run(){
 clickLength(3);clickLength(4);releaseInitial();await flush();
 assert(loads.length===2&&loads[1][0]===4,'Rapid changes load the final selected length after the pending request');
 assert(elements['result-summary'].textContent.startsWith('4-letter'),'Final length renders automatically');
 assert(buttons.find(e=>e.dataset.length==='4').attributes['aria-pressed']==='true','Selected length is accessible');
 elements.letters.value='opntio';clickLength(3);await flush();
 const cards=elements.results.children;
 assert(cards.some(card=>card.children[0].textContent==='PIT'),'Three-letter click shows PIT without submission');
 assert(cards.some(card=>card.children[0].textContent==='POT'),'Three-letter click shows POT without submission');
 elements['other-length'].value='2';elements['other-length'].listeners.change();await flush();
 assert(elements['result-summary'].textContent.startsWith('2-letter'),'Dropdown length also refreshes automatically');
 assert(!elements['find-button'].disabled&&elements.results.attributes['aria-busy']==='false','Page returns to ready state');
 elements['page-results'].listeners.click();
 assert(elements.workspace.dataset.mobilePage==='results','One tap opens mobile results');
 assert(elements['page-results'].attributes['aria-pressed']==='true','Results switch announces selected state');
 elements['page-puzzle'].listeners.click();
 assert(elements.workspace.dataset.mobilePage==='puzzle','One tap returns to puzzle inputs');
 elements['puzzle-form'].listeners.submit({preventDefault(){}});await flush();
 assert(elements.workspace.dataset.mobilePage==='results','Submitting a puzzle opens results');
 print('All page interaction tests passed.');
}
run().catch(error=>{print(error);quit(1);});
