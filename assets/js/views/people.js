/* Fassbinder Explorer V3.4 — views/people.js
 * Index et fiches de l’entourage, œuvres rapprochées et occurrences dans la frise.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

function rowSearchText(row){
  return [
    row.id,row.caption,row.periodQuestion,row.notions,row.reception,row.citation,
    row.excerptDescription,row.excerptPrompt,
    ...(row.values||[]),
    ...((row.video||[]).map(v=>v.label||''))
  ].filter(Boolean).map(v=>String(v).replace(/<[^>]*>/g,' ')).join(' ');
}

function rebuildPeopleOccurrences(){
  if(!CANONICAL_MODEL.people.length) return;
  CANONICAL_MODEL.people.forEach(person=>{
    const aliases=PEOPLE_ALIAS_MAP.filter(item=>item.person.id===person.id).map(item=>item.alias);
    person.citedYears=CANONICAL_MODEL.timeline.years.filter(row=>{
      const text=rowSearchText(row);
      return aliases.some(alias=>new RegExp('(^|[^\p{L}\p{N}])'+regexEscape(alias)+'(?=$|[^\p{L}\p{N}])','iu').test(text));
    }).map(row=>row.id);
  });
}

function rebuildPeopleAliasMap(){
  PEOPLE_ALIAS_MAP=[];
  const nicknameOwners=new Map();
  CANONICAL_MODEL.people.forEach(person=>{
    (person.nicknames||[]).forEach(nickname=>{
      const key=norm(nickname);
      if(!key) return;
      if(!nicknameOwners.has(key)) nicknameOwners.set(key,new Set());
      nicknameOwners.get(key).add(person.id);
    });
  });
  CANONICAL_MODEL.people.forEach(person=>{
    const safeNicknames=(person.nicknames||[]).filter(nickname=>{
      const owners=nicknameOwners.get(norm(nickname));
      return nickname.length>=3 && owners && owners.size===1;
    });
    [...new Set([...(person.aliases||[]),...safeNicknames])].forEach(alias=>{
      if(alias && alias.length>=3) PEOPLE_ALIAS_MAP.push({alias,person});
    });
  });
  PEOPLE_ALIAS_MAP.sort((a,b)=>b.alias.length-a.alias.length);
}
function regexEscape(value){ return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function filmTitleKey(value){
  return (value||'').toLocaleLowerCase('fr')
    .replace(/[’ʼ‛`´]/g,"'")
    .replace(/\s+/g,' ')
    .trim();
}
function filmTitlePattern(value){
  return Array.from(value||'').map(char=>{
    if(/[’'ʼ‛`´]/.test(char)) return "['’ʼ‛`´]";
    if(/\s/.test(char)) return '\\s+';
    return regexEscape(char);
  }).join('');
}

function filmByTimelineId(reference){
  const key=(reference||'').toString().trim();
  if(!key) return null;
  return CANONICAL_MODEL.films.find(film=>film.id===key) || CANONICAL_MODEL.films.find(film=>norm(film.id)===norm(key)) || null;
}

// Rend cliquables uniquement les films explicitement reliés par les IDs de la Frise.
// Les titres français et originaux servent de libellés visibles ; les IDs restent techniques.
function linkifyFilms(root,filmIds){
  if(!root || !CANONICAL_MODEL.films.length || !(filmIds||[]).length) return;
  const films=[], seen=new Set();
  (filmIds||[]).forEach(id=>{
    const film=filmByTimelineId(id);
    if(film && !seen.has(film.id)){seen.add(film.id);films.push(film);}
  });
  const aliases=[];
  films.forEach(film=>{
    [film.title,film.original].filter(Boolean).forEach(label=>aliases.push({label,film}));
  });
  aliases.sort((a,b)=>b.label.length-a.label.length);
  if(!aliases.length) return;
  const lookup=new Map(aliases.map(item=>[filmTitleKey(item.label),item.film]));
  const alternatives=aliases.map(item=>filmTitlePattern(item.label)).join('|');
  const re=new RegExp('(^|[^\\p{L}\\p{N}])('+alternatives+')(?=$|[^\\p{L}\\p{N}])','giu');
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
    const parent=node.parentElement;
    if(!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    if(parent.closest('button,a,script,style')) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const text=node.nodeValue; re.lastIndex=0;
    let match,last=0,found=false; const frag=document.createDocumentFragment();
    while((match=re.exec(text))){
      found=true;
      const prefix=match[1]||'', matchedTitle=match[2], start=match.index;
      frag.appendChild(document.createTextNode(text.slice(last,start)+prefix));
      const film=lookup.get(filmTitleKey(matchedTitle));
      if(film){
        const btn=document.createElement('button');
        btn.type='button'; btn.className='person-link timeline-film-link'; btn.textContent=matchedTitle;
        btn.dataset.filmId=film.id;
        frag.appendChild(btn);
      }else frag.appendChild(document.createTextNode(matchedTitle));
      last=start+prefix.length+matchedTitle.length;
    }
    if(found){frag.appendChild(document.createTextNode(text.slice(last)));node.replaceWith(frag);}
  });
}

function linkifyPeople(root){
  if(!root || !PEOPLE_ALIAS_MAP.length) return;
  const aliasLookup=new Map(PEOPLE_ALIAS_MAP.map(x=>[x.alias.toLocaleLowerCase('fr'),x.person]));
  const alternatives=PEOPLE_ALIAS_MAP.map(x=>regexEscape(x.alias)).join('|');
  if(!alternatives) return;
  const re=new RegExp('(^|[^\\p{L}\\p{N}])('+alternatives+')(?=$|[^\\p{L}\\p{N}])','giu');
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
    const parent=node.parentElement;
    if(!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    if(parent.closest('button,a,script,style,.person-drawer')) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const text=node.nodeValue; re.lastIndex=0;
    let match,last=0,found=false; const frag=document.createDocumentFragment();
    while((match=re.exec(text))){
      found=true;
      const prefix=match[1]||'';
      const matchedName=match[2];
      const start=match.index;
      frag.appendChild(document.createTextNode(text.slice(last,start)+prefix));
      const person=aliasLookup.get(matchedName.toLocaleLowerCase('fr'));
      if(person){
        const btn=document.createElement('button');
        btn.type='button'; btn.className='person-link'; btn.textContent=matchedName;
        btn.dataset.personId=person.id;
        frag.appendChild(btn);
      } else frag.appendChild(document.createTextNode(matchedName));
      last=start+prefix.length+matchedName.length;
    }
    if(found){ frag.appendChild(document.createTextNode(text.slice(last))); node.replaceWith(frag); }
  });
}

function personSection(title,html){
  if(!html || !html.trim()) return '';
  return '<section class="person-section"><h3>'+escapeHTML(title)+'</h3><p>'+html+'</p></section>';
}

function plainTextFromHTML(value){
  const box=document.createElement('div');
  box.innerHTML=value||'';
  return (box.textContent||box.innerText||'').replace(/\s+/g,' ').trim();
}

function normalizedWorkTitle(value){
  return headerNorm(plainTextFromHTML(value))
    .replace(/\b(photographie|image|montage|musique|scenario|production|realisation|acteur|actrice)\s*:?\s*/g,' ')
    .replace(/\b(tv|telefilm|serie)\b/g,' ')
    .replace(/\b(19|20)\d{2}\b/g,' ')
    .replace(/\ble\s+le\b/g,'le')
    .replace(/ingoldstad\b/g,'ingolstadt')
    .replace(/\s+/g,' ')
    .trim();
}

function filmsDetectedInEntry(entry){
  if(!CANONICAL_MODEL.films.length) return [];
  const source=normalizedWorkTitle(entry);
  if(!source) return [];
  const detected=[];
  CANONICAL_MODEL.films.forEach(film=>{
    const candidates=[film.title,film.original].filter(Boolean).map(normalizedWorkTitle).filter(Boolean);
    const matched=candidates.some(title=>
      source.includes(title) ||
      (source.length>=7 && title.includes(source))
    );
    if(matched) detected.push(film);
  });
  return detected.sort((a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999)||a.title.localeCompare(b.title,'fr',{sensitivity:'base'}));
}

function resolvedPersonFilms(person){
  const linked=[], unresolved=[];
  const seen=new Set();
  const titles=person?.filmography||[];
  const ids=person?.filmographyIds||[];
  const addFilm=film=>{
    if(!film || seen.has(film.id)) return false;
    seen.add(film.id); linked.push(film); return true;
  };
  const count=Math.max(titles.length,ids.length);
  for(let i=0;i<count;i++){
    const id=(ids[i]||'').trim();
    const title=titles[i]||'';
    const exact=id ? CANONICAL_MODEL.films.find(film=>film.id===id) : null;
    if(exact){addFilm(exact);continue;}
    const matches=filmsDetectedInEntry(title);
    if(matches.length) matches.forEach(addFilm);
    else{
      const text=plainTextFromHTML(title);
      if(text) unresolved.push(text);
    }
  }
  (person?.unmatchedWorks||[]).forEach(entry=>{
    const text=plainTextFromHTML(entry);
    if(text) unresolved.push(text);
  });
  linked.sort((a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999)||a.title.localeCompare(b.title,'fr',{sensitivity:'base'}));
  return {linked,unresolved:uniqueNonEmpty(unresolved)};
}

function filmographySection(person){
  if(!person || (!(person.filmography||[]).length && !(person.filmographyIds||[]).length && !(person.unmatchedWorks||[]).length)) return '';
  const resolved=resolvedPersonFilms(person);
  const linkedItems=resolved.linked.map(f=>
    '<li><button class="person-film-link" type="button" data-person-film-id="'+escapeHTML(f.id)+'">'+escapeHTML(f.title)+'</button>'+
    (f.year?'<button class="person-film-year-button" type="button" data-person-film-year="'+escapeHTML(f.year)+'" title="Voir '+escapeHTML(f.year)+' sur la frise">'+escapeHTML(f.year)+'</button>':'')+'</li>'
  );
  const unresolvedItems=resolved.unresolved.map(f=>'<li><span class="person-film-unlinked">'+escapeHTML(f)+'</span></li>');
  const items=[...linkedItems,...unresolvedItems];
  if(!items.length) return '';
  return '<section class="person-section person-filmography-section" data-film-count="'+items.length+'"><h3>Œuvres de Fassbinder</h3><ul class="person-film-list">'+items.join('')+'</ul></section>';
}


function renderPeopleIndex(filter=''){
  const query=norm(filter);
  const people=[...CANONICAL_MODEL.people]
    .filter(p=>!query || norm([p.name,p.sortName,(p.nicknames||[]).join(' '),(p.aliases||[]).join(' '),p.role,p.stratum].join(' ')).includes(query))
    .sort((a,b)=>{
      const bySort=(a.sortName||a.name).localeCompare(b.sortName||b.name,'fr',{sensitivity:'base'});
      return bySort || a.name.localeCompare(b.name,'fr',{sensitivity:'base'});
    });
  let previousLetter='';
  const rows=people.map(person=>{
    const years=(person.citedYears||[]);
    const initial=((person.sortName||person.name).trim().charAt(0)||'#').toLocaleUpperCase('fr');
    const letter=initial!==previousLetter?'<h3 class="people-index-letter">'+escapeHTML(initial)+'</h3>':'';
    previousLetter=initial;
    const nickname=(person.nicknames||[]).length
      ? '<p class="people-index-nickname">Surnom : '+escapeHTML(person.nicknames.join(' · '))+'</p>' : '';
    return letter+'<article class="people-index-entry" data-index-name="'+escapeHTML(norm(person.sortName||person.name))+'">'+
      '<button class="people-index-name" type="button" data-person-id="'+escapeHTML(person.id)+'">'+escapeHTML(person.name)+'</button>'+nickname+
      ((person.role||person.stratum)?'<p class="people-index-meta">'+escapeHTML([person.role,person.stratum].filter(Boolean).join(' · '))+'</p>':'')+
      (years.length?'<div class="people-index-years">'+years.map(y=>'<button class="people-index-year" type="button" data-cited-year="'+escapeHTML(String(y))+'">'+escapeHTML(String(y))+'</button>').join('')+'</div>':'<span class="people-index-none">Aucune citation repérée dans les lignes annuelles</span>')+
    '</article>';
  }).join('');
  const list=personContent.querySelector('.people-index-list');
  const count=personContent.querySelector('.people-index-count');
  if(list) list.innerHTML=rows || '<p class="people-index-none">Aucun nom ne correspond à cette recherche.</p>';
  if(count) count.textContent=people.length+' nom'+(people.length>1?'s':'')+' affiché'+(people.length>1?'s':'');
}
function openPeopleIndex(){
  rebuildPeopleOccurrences();
  personContent.innerHTML=
    '<div class="people-index-head">'+
      '<p class="person-kicker">Entourage de Fassbinder</p>'+
      '<h2>Index des noms</h2>'+
      '<input class="people-index-search" id="peopleIndexSearch" type="search" placeholder="Rechercher un nom…" aria-label="Rechercher dans l’index">'+
      '<div class="people-index-count"></div>'+
    '</div><div class="people-index-list"></div>';
  renderPeopleIndex('');
  const search=personContent.querySelector('#peopleIndexSearch');
  search?.addEventListener('input',()=>renderPeopleIndex(search.value));
  personDrawer.classList.add('open'); personOverlay.classList.add('open');
  personDrawer.setAttribute('aria-hidden','false'); personOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  setTimeout(()=>search?.focus(),30);
}

function openPerson(personId,origin=null){
  const person=CANONICAL_MODEL.people.find(p=>p.id===personId); if(!person) return;
  activePersonId=personId;
  if(origin) crossNavigationOrigin=origin;
  const meta=[person.role,person.stratum].filter(Boolean).join(' · ');
  const expectedImage=person.image||'';
  const photoHTML=expectedImage
    ? '<div class="person-photo"><img src="'+escapeHTML(expectedImage)+'" alt="Portrait de '+escapeHTML(person.name)+'" data-expected-src="'+escapeHTML(expectedImage)+'"></div>'
    : '<div class="person-photo-missing">Portrait non renseigné</div>';
  const crossNav=(crossNavigationOrigin&&crossNavigationOrigin.type==='film')
    ? '<nav class="cross-nav" aria-label="Navigation croisée"><span class="cross-nav-label">Depuis le film</span><button type="button" data-cross-back-film="'+escapeHTML(crossNavigationOrigin.id)+'">← Retour à '+escapeHTML(crossNavigationOrigin.label||'la fiche film')+'</button></nav>'
    : '';
  personContent.innerHTML=
    crossNav+
    '<div class="person-profile">'+
      photoHTML+
      '<div class="person-profile-main">'+
        '<p class="person-kicker">Entourage de Fassbinder</p>'+
        '<h2>'+escapeHTML(person.name)+'</h2>'+
        ((person.nicknames||[]).length?'<p class="person-nickname">Surnom : '+escapeHTML(person.nicknames.join(' · '))+'</p>':'')+
        (meta||person.dates?'<p class="person-role">'+escapeHTML(meta)+(person.dates?(meta?' · ':'')+escapeHTML(person.dates):'')+'</p>':'')+
      '</div>'+
    '</div>'+
    personSection('Fonction dans le collectif',person.collaborationType)+
    personSection('Biographie',person.bio)+
    personSection('Vie privée / lien avec Fassbinder',person.relation)+
    personSection('Rôle dans l’univers Fassbinder',person.universeRole)+
    filmographySection(person)+
    (person.source?personSection('Source',escapeHTML(person.source)):'')+
    (person.link?'<section class="person-section"><a class="person-external" href="'+escapeHTML(person.link)+'" target="_blank" rel="noopener">Ouvrir la notice externe</a></section>':'');
  const portrait=personContent.querySelector('.person-photo img');
  if(portrait){
    portrait.addEventListener('error',()=>{
      const expected=portrait.dataset.expectedSrc||'';
      const fallback=document.createElement('div');
      fallback.className='person-photo-missing';
      fallback.innerHTML='Image introuvable<br><strong>'+escapeHTML(expected.replace(/^Entourage_images\//,''))+'</strong><br>à placer dans<br>Entourage_images';
      portrait.closest('.person-photo').replaceWith(fallback);
    },{once:true});
  }
  personDrawer.classList.add('open'); personOverlay.classList.add('open');
  personDrawer.setAttribute('aria-hidden','false'); personOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden'; personClose.focus();
}

function closePerson(){
  personDrawer.classList.remove('open'); personOverlay.classList.remove('open');
  personDrawer.setAttribute('aria-hidden','true'); personOverlay.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  activePersonId=null;
}

document.addEventListener('click',e=>{
  const yearButton=e.target.closest('[data-cited-year]');
  if(yearButton){ navigateToCitedYear(yearButton.dataset.citedYear); return; }
  const indexName=e.target.closest('.people-index-name');
  if(indexName){ openPerson(indexName.dataset.personId); return; }
  const link=e.target.closest('.person-link');
  if(link) openPerson(link.dataset.personId);
});
peopleIndexButton.addEventListener('click',openPeopleIndex);
personClose.addEventListener('click',closePerson);
personOverlay.addEventListener('click',closePerson);
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && personDrawer.classList.contains('open')) closePerson(); });
