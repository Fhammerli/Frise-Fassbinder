/* Fassbinder Explorer V3.4 — validator.js
 * Contrôle de cohérence P0/P1 et rapport localisé avant publication.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

let VALIDATION_ISSUES=[];
const splitReferences=value=>splitCellList(value,{allowPipe:true});
function validationIssue(severity,module,record,field,value,message,action,route){
  return {severity,module,record,field,value:String(value||''),message,action,route};
}
function duplicateIssues(items,module){
  const seen=new Map(),issues=[];
  items.forEach(item=>{
    const id=String(item.id||'').trim();
    if(!id){issues.push(validationIssue('error',module,item.title||item.name||item.year||'fiche','ID','',
      'Identifiant canonique vide.','Renseigner un identifiant unique.'));return;}
    const key=norm(id);
    if(seen.has(key))issues.push(validationIssue('error',module,item.title||item.name||id,'ID',id,
      'Identifiant canonique dupliqué avec '+seen.get(key)+'.','Corriger l’un des deux identifiants.'));
    else seen.set(key,item.title||item.name||id);
  });
  return issues;
}
function validateCanonicalModel(model=CANONICAL_MODEL){
  const issues=[
    ...duplicateIssues(model.timeline.periods,'Frise'),
    ...duplicateIssues(model.timeline.years,'Frise'),
    ...duplicateIssues(model.films,'Films'),
    ...duplicateIssues(model.people,'Entourage')
  ];
  const filmIds=new Set(model.films.map(f=>norm(f.id)));
  const personIds=new Set(model.people.map(p=>norm(p.id)));
  const years=new Set(model.timeline.years.map(y=>String(y.id)));
  [...model.timeline.periods,...model.timeline.years].forEach(row=>{
    splitReferences(row.filmIds).forEach(id=>{if(!filmIds.has(norm(id)))issues.push(validationIssue('error','Frise',row.id,'IDs films',id,'Référence vers un film absent.','Corriger l’ID ou créer la fiche film.',{type:'year',id:row.id}));});
  });
  model.films.forEach(film=>{
    if(!/^\d{4}$/.test(String(film.year||'')))issues.push(validationIssue('error','Films',film.title,'Année',film.year,'Année absente ou inutilisable.','Saisir une année sur quatre chiffres.',{type:'film',id:film.id}));
    [...splitReferences(film.castIds),...splitReferences(film.crewIds)].forEach(id=>{if(!personIds.has(norm(id)))issues.push(validationIssue('error','Films',film.title,'IDs entourage',id,'Référence d’entourage introuvable.','Corriger l’ID ou créer la fiche personne.',{type:'film',id:film.id}));});
    if(film.year && !years.has(String(film.year)))issues.push(validationIssue('warning','Films',film.title,'Année',film.year,'Aucune entrée annuelle correspondante dans la frise.','Ajouter l’année ou vérifier le lien.',{type:'film',id:film.id}));
    if(!film.poster)issues.push(validationIssue('warning','Films',film.title,'Affiche','','Affiche non renseignée.','Ajouter un nom de fichier image.',{type:'film',id:film.id}));
  });
  model.people.forEach(person=>{
    splitReferences(person.filmographyIds).forEach(id=>{if(!filmIds.has(norm(id)))issues.push(validationIssue('error','Entourage',person.name,'IDs films — Œuvres de Fassbinder',id,'Référence vers un film absent.','Corriger l’ID ou créer la fiche film.',{type:'person',id:person.id}));});
    if(!person.image)issues.push(validationIssue('warning','Entourage',person.name,'Portrait','','Portrait non renseigné.','Ajouter un nom de fichier image.',{type:'person',id:person.id}));
  });
  VALIDATION_ISSUES=issues;
  renderValidationReport();
  return issues;
}
function renderValidationReport(){
  const host=document.querySelector('.maintenance-content');if(!host)return;
  let section=host.querySelector('.validation-summary');if(!section){section=document.createElement('section');section.className='validation-summary';host.append(section);}
  const counts={error:0,warning:0,info:0};VALIDATION_ISSUES.forEach(issue=>counts[issue.severity]++);
  const items=VALIDATION_ISSUES.map((issue,index)=>'<article class="validation-item '+issue.severity+'"><strong>'+escapeHTML(issue.module+' · '+issue.record)+'</strong><br>'+escapeHTML(issue.message)+' <small>'+escapeHTML(issue.field+(issue.value?' : '+issue.value:''))+'</small>'+(issue.route?'<br><button type="button" data-validation-index="'+index+'">Ouvrir la fiche</button>':'')+'</article>').join('');
  section.innerHTML='<h3>Contrôle de cohérence</h3><div class="validation-counts"><span class="validation-badge error">'+counts.error+' erreur(s)</span><span class="validation-badge warning">'+counts.warning+' avertissement(s)</span><span class="validation-badge info">'+counts.info+' information(s)</span></div><div class="validation-list">'+(items||'<p>Aucune incohérence détectée.</p>')+'</div><p class="normalization-summary">'+CANONICAL_MODEL.people.length+' personnes et '+CANONICAL_MODEL.films.length+' films dans le modèle canonique.</p>';
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-validation-index]');if(!button)return;
  const issue=VALIDATION_ISSUES[Number(button.dataset.validationIndex)];if(!issue?.route)return;
  document.body.classList.remove('v31-maintenance-open');
  if(issue.route.type==='film')openFilm(issue.route.id);else if(issue.route.type==='person')openPerson(issue.route.id);else navigateToCitedYear(issue.route.id);
});
window.FassbinderValidator=Object.freeze({validate:validateCanonicalModel,get issues(){return VALIDATION_ISSUES.slice();},splitReferences});
