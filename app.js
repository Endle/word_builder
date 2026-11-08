'use strict';
const $ = id => document.getElementById(id);
let length = 5, activeQuery, matches = [], history = new Set(), historyKey = '', shown = [], excluded = new Set();
const batchSize=18;
let dictionary=[];
function readQuery(){return {letters:$('letters').value,length,starts:$('starts').value,ends:$('ends').value,pattern:$('pattern').value,commonOnly:$('common-only').checked};}
let solving = false, queuedRefresh = false;
async function solve(alternatives=false, openResults=false){
  if (solving) { queuedRefresh = true; return; }
  solving = true;
  $('find-button').disabled = true;
  $('alternatives').disabled = true;
  $('reset').disabled = $('sort').disabled = $('history-reset').disabled = true;
  $('results').setAttribute('aria-busy','true');
  $('error').hidden = true;
  const buttonLabel = $('find-button').innerHTML;
  try {
    const q=WordSolver.validate(readQuery());
    $('find-button').textContent = 'Loading words…';
    const wordLength=q.length || q.pattern.length;
    const lengths=wordLength ? [wordLength] : Array.from({length:Math.min(15,q.letters.length)-1},(_,i)=>i+2);
    const loaded=await loadWordDictionary(lengths);
    if (queuedRefresh) return;
    dictionary=loaded;
    const key=[...q.letters].sort().join('');
    if (key!==historyKey){history.clear();historyKey=key;}
    excluded=alternatives ? new Set(history) : new Set();
    activeQuery=q;
    matches=WordSolver.search(dictionary,q,excluded,$('sort').value);
    $('error').hidden=true;
    render();
    if (openResults) switchMobilePage('results');
  } catch(error){
    if (queuedRefresh) return;
    $('error').textContent=error.message;$('error').hidden=false;
    switchMobilePage('puzzle');
    if (error.dictionaryLoad) {
      $('results-count').textContent='Not loaded';
      $('result-summary').textContent='Tap Find words to retry the dictionary download.';
    }
  } finally {
    solving=false;
    $('find-button').disabled=false;
    $('reset').disabled = $('sort').disabled = $('history-reset').disabled = false;
    if (activeQuery) $('alternatives').disabled=!WordSolver.search(dictionary,activeQuery,history,$('sort').value).length;
    $('find-button').innerHTML=buttonLabel;
    $('results').setAttribute('aria-busy','false');
    if (queuedRefresh) { queuedRefresh=false; solve(); }
  }
}
function render(){
  shown=matches.slice(0,batchSize);
  shown.forEach(entry=>history.add(entry[0]));
  const grid=$('results');grid.replaceChildren();grid.setAttribute('aria-busy','false');
  $('results-count').textContent=matches.length+' found';
  $('result-summary').textContent=(activeQuery.length ? activeQuery.length+'-letter words' : 'Words, 2–'+Math.min(15,activeQuery.letters.length)+' letters')+' from '+activeQuery.letters.toUpperCase();
  if (!shown.length){
    const box=document.createElement('div');box.className='empty-state';
    const title=document.createElement('strong');title.textContent=excluded.size?'You’ve explored these possibilities.':'No words fit just yet.';
    const p=document.createElement('p');p.textContent=excluded.size?'Try different filters or show previous suggestions again.':'Check your letters, relax a position, or try a different length.';box.append(title,p);grid.append(box);
  }
  for(const [word,rank] of shown){
    const common=rank>0&&rank<=15000;
    const card=document.createElement('article');card.className='word-card'+(common?' common':'');
    const text=document.createElement('div');text.className='word-text';text.textContent=word.toUpperCase();
    const meta=document.createElement('div');meta.className='word-meta';const dot=document.createElement('span');dot.className='meta-dot';meta.append(dot,document.createTextNode(common?'Common word':'Dictionary word'));
    const copy=document.createElement('button');copy.className='copy-word';copy.textContent='⧉';copy.setAttribute('aria-label','Copy '+word);copy.title='Copy word';
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(word.toUpperCase());copy.textContent='✓';copy.setAttribute('aria-label','Copied '+word);setTimeout(()=>{copy.textContent='⧉';copy.setAttribute('aria-label','Copy '+word);},1500);}catch{copy.textContent='!';copy.title='Copy unavailable in this browser; select the word to copy.';}});
    card.append(text,meta,copy);grid.append(card);
  }
  $('shown-summary').textContent=shown.length?'Showing '+shown.length+' of '+matches.length+' matches':'Try another combination.';
  const remaining=WordSolver.search(dictionary,activeQuery,history,$('sort').value).length;
  $('alternatives').disabled=!remaining;$('alternatives').title=remaining?remaining+' unseen words remain':'No unseen words remain for these filters';
  $('history-reset').hidden=excluded.size===0;
}
$('puzzle-form').addEventListener('submit',event=>{event.preventDefault();solve(false,true);});
$('letters').addEventListener('input',()=>{$('letter-count').textContent=($('letters').value.match(/[a-z]/gi)||[]).length+' letters';});
$('length-options').addEventListener('click',event=>{const button=event.target.closest('button[data-length]');if(!button)return;length=Number(button.dataset.length);$('other-length').value='';updateLength();solve();});
function updateLength(){document.querySelectorAll('[data-length]').forEach(button=>{const active=Number(button.dataset.length)===length;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});}
$('other-length').addEventListener('change',()=>{if($('other-length').value){length=Number($('other-length').value);updateLength();solve();}});
$('sort').addEventListener('change',()=>{if(activeQuery){matches=WordSolver.search(dictionary,activeQuery,excluded,$('sort').value);render();}});
$('alternatives').addEventListener('click',()=>solve(true));
$('history-reset').addEventListener('click',()=>{history.clear();solve();});
$('reset').addEventListener('click',()=>{$('puzzle-form').reset();$('letters').value='';$('letter-count').textContent='0 letters';length=5;updateLength();history.clear();historyKey='';$('error').hidden=true;$('results').replaceChildren();$('results').setAttribute('aria-busy','false');$('results-count').textContent='Ready';$('result-summary').textContent='Your next word starts here.';$('shown-summary').textContent='Enter letters to get started.';$('alternatives').disabled=true;$('history-reset').hidden=true;activeQuery=null;switchMobilePage('puzzle');$('letters').focus();});
function switchMobilePage(page){
  $('workspace').dataset.mobilePage=page;
  $('page-puzzle').setAttribute('aria-pressed',String(page==='puzzle'));
  $('page-results').setAttribute('aria-pressed',String(page==='results'));
  if (window.matchMedia('(max-width: 620px)').matches) {
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('workspace').scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'});
  }
}
$('page-puzzle').addEventListener('click',()=>switchMobilePage('puzzle'));
$('page-results').addEventListener('click',()=>switchMobilePage('results'));
for(const id of ['help-open','about-open'])$(id).addEventListener('click',()=>$('help-dialog').showModal());
$('help-close').addEventListener('click',()=>$('help-dialog').close());
$('help-dialog').addEventListener('click',event=>{if(event.target===$('help-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
solve();
