/* Fassbinder Explorer V3.4 — app.js
 * Démarrage, diagnostic caché, quiz et flashcards.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

const maintenancePanel=document.querySelector('.maintenance-panel');
function openMaintenancePanel(targetSelector){
  if(maintenancePanel)maintenancePanel.open=true;
  document.body.classList.add('v31-maintenance-open');
  if(!targetSelector)return;
  requestAnimationFrame(()=>{
    const target=document.querySelector(targetSelector);
    if(!target)return;
    target.setAttribute('tabindex','-1');
    target.scrollIntoView({block:'start'});
    target.focus({preventScroll:true});
  });
}
function openDataState(){
  if(maintenancePanel)maintenancePanel.scrollTop=0;
  openMaintenancePanel('.maintenance-panel > summary');
}
function closeMaintenancePanel(){document.body.classList.remove('v31-maintenance-open');}
function isMaintenanceShortcut(event,letter){
  const modifier=(event.ctrlKey||event.metaKey)&&event.altKey;
  return modifier&&(String(event.key||'').toLowerCase()===letter||event.code==='Key'+letter.toUpperCase());
}
document.addEventListener('keydown',event=>{
  if(isMaintenanceShortcut(event,'d')){event.preventDefault();openDataState();return;}
  if(isMaintenanceShortcut(event,'n')){event.preventDefault();openMaintenancePanel('.validation-summary');return;}
  if(event.key==='Escape'&&document.body.classList.contains('v31-maintenance-open'))closeMaintenancePanel();
},true);
document.addEventListener('click',event=>{if(document.body.classList.contains('v31-maintenance-open')&&!event.target.closest('.maintenance-panel'))closeMaintenancePanel();});
const params=new URLSearchParams(location.search);if(params.get('admin')==='1')openDataState();else if(params.get('normalisation')==='1')openMaintenancePanel('.validation-summary');

(function(){
'use strict';
const QUIZ_FILES=[
  {file:'RWF_Quiz.csv',label:'Quiz œuvre'},
  {file:'RWF_Quiz2.csv',label:'Quiz histoire de l’Allemagne'},
  {file:'RWF-Quiz3.csv',label:'Quiz histoire du Nouveau cinéma allemand'}
];
const FLASH_FILES=[{file:'RWF_Flashcards.csv',label:'Flashcards'}];
const DATA_FILES=[
  {file:'RWF_Frise.xlsx',label:'Frise',kind:'xlsx'},
  {file:'RWF_Films.xlsx',label:'Films',kind:'xlsx'},
  {file:'RWF_Entourage.xlsx',label:'Entourage',kind:'xlsx'}
];
const state={quizSets:new Map(),flashSets:new Map(),quiz:null,flash:null,fileStatus:new Map()};
const overlay=document.getElementById('learningOverlay');
const drawer=document.getElementById('learningDrawer');
const content=document.getElementById('learningContent');
const closeBtn=document.getElementById('learningClose');
const text=v=>v==null?'':String(v).trim();
const normKey=s=>text(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'oe').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
const escapeHTML=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function field(row,aliases){
  const entries=Object.entries(row);
  for(const alias of aliases){const exact=entries.find(([k])=>text(k).toLowerCase()===text(alias).toLowerCase());if(exact&&text(exact[1]))return text(exact[1]);}
  for(const alias of aliases){const target=normKey(alias);const found=entries.find(([k])=>normKey(k)===target);if(found&&text(found[1]))return text(found[1]);}
  return '';
}
function parseDelimited(raw){
  if(!window.XLSX)throw new Error('Le lecteur CSV n’est pas disponible.');
  let cleaned=String(raw||'').replace(/^\uFEFF/,'');
  const lines=cleaned.split(/\r?\n/);
  if(lines.length>1&&!/[;,\t]/.test(lines[0])&&/^(front|recto)[;,\t](back|verso)/i.test(lines[1].trim()))cleaned=lines.slice(1).join('\n');
  const wb=XLSX.read(cleaned,{type:'string',raw:false});
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:'',raw:false});
}
function answerIndex(answer,options){
  const a=text(answer);if(!a)return-1;
  const letter=a.match(/^\s*([A-Za-z])(?:\s*[.):-]|\s+)/);if(letter){const i=letter[1].toUpperCase().charCodeAt(0)-65;if(i>=0&&i<options.length)return i;}
  if(/^[A-Za-z]$/.test(a)){const i=a.toUpperCase().charCodeAt(0)-65;if(i>=0&&i<options.length)return i;}
  const number=a.match(/^\s*(\d+)(?:\s*[.):-]|\s+)/);if(number){const i=Number(number[1])-1;if(i>=0&&i<options.length)return i;}
  if(/^\d+$/.test(a)){const i=Number(a)-1;if(i>=0&&i<options.length)return i;}
  return options.findIndex(o=>normKey(o)===normKey(a));
}
function shuffledCopy(items){const copy=items.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function quizRows(rows,fallback){
  const out=[];
  rows.forEach((row,i)=>{
    const question=field(row,['Question','Enoncé','Énoncé','Intitulé']);if(!question)return;
    const options=[field(row,['Option A','Réponse A','Reponse A','Choix A']),field(row,['Option B','Réponse B','Reponse B','Choix B']),field(row,['Option C','Réponse C','Reponse C','Choix C']),field(row,['Option D','Réponse D','Reponse D','Choix D'])];
    if(options.some(o=>!o)||new Set(options.map(normKey)).size!==4){console.warn('Question ignorée : quatre options distinctes sont requises, ligne '+(i+2));return;}
    const correct=answerIndex(field(row,['Correct Answer','Bonne réponse','Bonne reponse','Réponse correcte','Reponse correcte','Correct','Solution']),options);if(correct<0){console.warn('Question ignorée : réponse correcte non reconnue, ligne '+(i+2));return;}
    out.push({group:fallback,question,options,correct,explanation:field(row,['Rationale','Explication','Commentaire','Justification','Correction']),category:field(row,['Catégorie','Categorie','Notion','Chapitre']),hint:field(row,['Hint','Indice','Aide'])});
  });
  return out;
}
function flashRows(rows,fallback){const out=[];rows.forEach(row=>{const front=field(row,['Front','Recto','Question','Terme','Face A','Avant']);const back=field(row,['Back','Verso','Réponse','Reponse','Définition','Definition','Face B','Arrière','Arriere']);if(front&&back)out.push({group:field(row,['Jeu','Deck','Paquet','Groupe','Série','Serie','Thème','Theme'])||fallback,front,back,category:field(row,['Catégorie','Categorie','Notion','Chapitre'])});});return out;}
function addToMap(map,items){items.forEach(item=>{if(!map.has(item.group))map.set(item.group,[]);map.get(item.group).push(item);});}
async function probeFile(entry){
  try{const response=await fetch(entry.file,{cache:'no-store'});if(!response.ok){state.fileStatus.set(entry.file,{...entry,status:'absent',detail:'HTTP '+response.status});return null;}const buffer=await response.arrayBuffer();state.fileStatus.set(entry.file,{...entry,status:'ok',detail:Math.max(1,Math.round(buffer.byteLength/1024))+' Ko'});return buffer;}catch(error){state.fileStatus.set(entry.file,{...entry,status:'error',detail:error.message});return null;}
}
async function loadLearningFile(entry,type){
  const buffer=await probeFile(entry);if(!buffer)return false;
  try{const raw=new TextDecoder('utf-8').decode(buffer);const rows=parseDelimited(raw);const items=type==='quiz'?quizRows(rows,entry.label):flashRows(rows,entry.label);if(!items.length){state.fileStatus.set(entry.file,{...entry,status:'warn',detail:'aucune ligne reconnue'});return false;}addToMap(type==='quiz'?state.quizSets:state.flashSets,items);const previous=state.fileStatus.get(entry.file);state.fileStatus.set(entry.file,{...previous,detail:items.length+' élément'+(items.length>1?'s':'')});return true;}catch(error){state.fileStatus.set(entry.file,{...entry,status:'error',detail:error.message});return false;}
}
function injectButtons(){
  let bar=document.querySelector('.module-buttons');if(!bar){const header=document.querySelector('header');if(!header)return setTimeout(injectButtons,100);bar=document.createElement('div');bar.className='module-buttons learning-tools';header.appendChild(bar);}else bar.classList.add('learning-tools');
  if(!document.getElementById('quizOpen'))bar.insertAdjacentHTML('beforeend','<button class="learning-tool-button" id="quizOpen" type="button">Quiz</button>');
  if(!document.getElementById('flashOpen'))bar.insertAdjacentHTML('beforeend','<button class="learning-tool-button" id="flashOpen" type="button">Flashcards</button>');
  
}
function openDrawer(){drawer.classList.add('open');overlay.classList.add('open');document.body.style.overflow='hidden'}function closeDrawer(){drawer.classList.remove('open');overlay.classList.remove('open');document.body.style.overflow=''}
closeBtn.onclick=closeDrawer;overlay.onclick=closeDrawer;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
function setOptions(select,map){select.innerHTML=[...map.keys()].map(k=>'<option value="'+escapeHTML(k)+'">'+escapeHTML(k)+'</option>').join('')}
function quizShell(){content.innerHTML='<p class="learning-kicker">Réviser et vérifier ses connaissances</p><h2>Quiz</h2><p class="learning-intro">Seuls les quiz dont le fichier CSV est disponible apparaissent.</p><div class="learning-toolbar"><select id="quizSet"></select><button class="learning-action primary" id="quizStart">Commencer en ordre aléatoire</button><button class="learning-action" id="quizShuffle">Remélanger</button></div><div id="quizStage"></div>';const select=content.querySelector('#quizSet');setOptions(select,state.quizSets);const has=state.quizSets.size>0;content.querySelector('#quizStart').disabled=!has;content.querySelector('#quizShuffle').disabled=!has;content.querySelector('#quizStart').onclick=()=>startQuiz(select.value);content.querySelector('#quizShuffle').onclick=()=>startQuiz(select.value);content.querySelector('#quizStage').innerHTML=has?'<div class="learning-empty">Sélectionnez un quiz puis cliquez sur « Commencer ».</div>':'<div class="learning-empty">Aucun quiz n’est actuellement disponible.</div>'}
function startQuiz(name){const questions=shuffledCopy(state.quizSets.get(name)||[]).map(q=>({...q,options:[...q.options]}));state.quiz={name,questions,index:0,score:0,answered:false};renderQuizQuestion()}
function renderQuizQuestion(){const stage=content.querySelector('#quizStage'),qz=state.quiz;if(!qz||!stage)return;if(qz.index>=qz.questions.length)return renderQuizSummary();const q=qz.questions[qz.index];stage.innerHTML='<div class="quiz-progress">Question '+(qz.index+1)+' / '+qz.questions.length+(q.category?' · '+escapeHTML(q.category):'')+'</div><article class="quiz-card"><h3 class="quiz-question">'+escapeHTML(q.question)+'</h3><div class="quiz-options">'+q.options.map((o,i)=>'<button class="quiz-option" data-answer="'+i+'"><span class="quiz-option-letter">'+String.fromCharCode(65+i)+'</span><span>'+escapeHTML(o)+'</span></button>').join('')+'</div><div id="quizFeedback"></div><div class="quiz-nav"><button class="learning-action" id="quizRestart">Recommencer</button><button class="learning-action primary" id="quizNext" disabled>'+(qz.index===qz.questions.length-1?'Voir le résultat':'Question suivante')+'</button></div></article>';stage.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answerQuiz(Number(b.dataset.answer)));stage.querySelector('#quizRestart').onclick=()=>startQuiz(qz.name);stage.querySelector('#quizNext').onclick=()=>{qz.index++;qz.answered=false;renderQuizQuestion()}}
function answerQuiz(choice){const qz=state.quiz;if(!qz||qz.answered)return;qz.answered=true;const q=qz.questions[qz.index];if(choice===q.correct)qz.score++;content.querySelectorAll('[data-answer]').forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add('correct');else if(i===choice)b.classList.add('wrong')});content.querySelector('#quizFeedback').innerHTML='<div class="quiz-feedback"><strong>'+(choice===q.correct?'Bonne réponse.':'Réponse incorrecte.')+'</strong>'+(q.explanation?'<br>'+escapeHTML(q.explanation):'')+'</div>';content.querySelector('#quizNext').disabled=false}
function renderQuizSummary(){const qz=state.quiz,stage=content.querySelector('#quizStage');const pct=qz.questions.length?Math.round(qz.score/qz.questions.length*100):0;stage.innerHTML='<div class="quiz-summary"><p class="learning-kicker">Résultat</p><div class="quiz-score">'+qz.score+' / '+qz.questions.length+'</div><p>'+pct+' % de réponses correctes</p><button class="learning-action primary" id="quizAgain">Recommencer ce quiz</button></div>';stage.querySelector('#quizAgain').onclick=()=>startQuiz(qz.name)}
function flashShell(){content.innerHTML='<p class="learning-kicker">Mémoriser par rappel actif</p><h2>Flashcards</h2><p class="learning-intro">Cliquez sur la carte pour la retourner.</p><div class="learning-toolbar"><select id="flashSet"></select><button class="learning-action primary" id="flashStart">Ouvrir en ordre aléatoire</button><button class="learning-action" id="flashShuffle">Remélanger</button></div><div id="flashStage"></div>';const select=content.querySelector('#flashSet');setOptions(select,state.flashSets);const has=state.flashSets.size>0;content.querySelector('#flashStart').disabled=!has;content.querySelector('#flashShuffle').disabled=!has;content.querySelector('#flashStart').onclick=()=>startFlash(select.value);content.querySelector('#flashShuffle').onclick=()=>startFlash(select.value);content.querySelector('#flashStage').innerHTML=has?'<div class="learning-empty">Sélectionnez un jeu puis cliquez sur « Ouvrir ».</div>':'<div class="learning-empty">Aucun jeu de flashcards n’est actuellement disponible.</div>'}
function startFlash(name){state.flash={name,cards:shuffledCopy(state.flashSets.get(name)||[]),index:0};renderFlashCard()}
function renderFlashCard(){const stage=content.querySelector('#flashStage'),fs=state.flash;if(!stage||!fs||!fs.cards.length)return;const c=fs.cards[fs.index];stage.innerHTML='<div class="quiz-progress">'+escapeHTML(fs.name)+(c.category?' · '+escapeHTML(c.category):'')+'</div><div class="flashcard-wrap"><div class="flashcard" id="flashCard" tabindex="0" role="button"><div class="flash-face front"><div class="flash-label">Question</div><div class="flash-text">'+escapeHTML(c.front)+'</div><div class="flash-hint">Cliquer pour afficher la réponse</div></div><div class="flash-face back"><div class="flash-label">Réponse</div><div class="flash-text">'+escapeHTML(c.back)+'</div><div class="flash-hint">Cliquer pour revenir à la question</div></div></div></div><div class="flash-controls"><button class="learning-action" id="flashPrev">← Précédente</button><span class="flash-counter">'+(fs.index+1)+' / '+fs.cards.length+'</span><button class="learning-action primary" id="flashNext">Suivante →</button></div>';const card=stage.querySelector('#flashCard');const flip=()=>card.classList.toggle('flipped');card.onclick=flip;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}};stage.querySelector('#flashPrev').onclick=()=>{fs.index=(fs.index-1+fs.cards.length)%fs.cards.length;renderFlashCard()};stage.querySelector('#flashNext').onclick=()=>{fs.index=(fs.index+1)%fs.cards.length;renderFlashCard()}}
function openQuiz(){quizShell();openDrawer()}function openFlash(){flashShell();openDrawer()}
window.__openFassbinderQuiz=openQuiz;window.__openFassbinderFlashcards=openFlash;
// L'en-tête du socle peut être reconstruit après l'initialisation. Une liaison
// déléguée garde donc les deux outils actifs même si leurs boutons sont remplacés.
document.addEventListener('click',function(event){
  const quizButton=event.target.closest('#quizOpen');
  const flashButton=event.target.closest('#flashOpen');
  if(quizButton){event.preventDefault();openQuiz();}
  else if(flashButton){event.preventDefault();openFlash();}
});
Promise.all([...DATA_FILES.map(probeFile),...QUIZ_FILES.map(f=>loadLearningFile(f,'quiz')),...FLASH_FILES.map(f=>loadLearningFile(f,'flash'))]).finally(injectButtons);injectButtons();
})();

(async function startV34(){
  setStartupProgress(10,'Initialisation de la chronologie…','Préparation du lecteur Excel local');
  await loadSharedWorkbook();
  await loadFilmsWorkbook();
  await loadPeopleWorkbook();
  validateCanonicalModel();
  finishStartup();
})();
