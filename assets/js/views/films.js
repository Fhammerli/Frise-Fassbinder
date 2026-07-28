/* Fassbinder Explorer V3.4 — views/films.js
 * Catalogue des films, fiches, distribution, équipe et liens vers les personnes.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

function personByReference(reference){
  return window.FassbinderNameNormalizer.resolve(reference);
}

function personCreditButton(person,label){
  const visible=label || person.name;
  return '<button class="film-person-link" type="button" data-film-person-id="'+escapeHTML(person.id)+'">'+escapeHTML(visible)+'</button>';
}

// Transforme dans un crédit affiché les noms correspondant aux IDs techniques
// en boutons de navigation, sans jamais afficher les identifiants eux-mêmes.
function linkKnownPeopleInHTML(html,ids){
  if(!html || !(ids||[]).length) return html||'';
  const people=[];
  const seen=new Set();
  (ids||[]).forEach(id=>{
    const person=personByReference(id);
    if(person && !seen.has(person.id)){seen.add(person.id);people.push(person);}
  });
  if(!people.length) return html;
  const template=document.createElement('template');
  template.innerHTML=html;
  const walker=document.createTreeWalker(template.content,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    let remaining=node.nodeValue||'';
    const fragment=document.createDocumentFragment();
    let changed=false;
    while(remaining){
      const lower=remaining.toLocaleLowerCase('fr');
      let match=null;
      people.forEach(person=>{
        const index=lower.indexOf(person.name.toLocaleLowerCase('fr'));
        if(index<0) return;
        if(!match || index<match.index || (index===match.index && person.name.length>match.person.name.length)) match={index,person};
      });
      if(!match){fragment.append(document.createTextNode(remaining));break;}
      changed=true;
      if(match.index) fragment.append(document.createTextNode(remaining.slice(0,match.index)));
      const button=document.createElement('button');
      button.className='film-person-link';
      button.type='button';
      button.dataset.filmPersonId=match.person.id;
      button.textContent=match.person.name;
      fragment.append(button);
      remaining=remaining.slice(match.index+match.person.name.length);
    }
    if(changed) node.replaceWith(fragment);
  });
  return template.innerHTML;
}

function renderFilmCreditEntries(entries,ids){
  const rendered=[];
  (entries||[]).forEach(entry=>{
    const text=plainTextFromHTML(entry);
    if(!text) return;
    rendered.push(linkKnownPeopleInHTML(escapeHTML(text),ids));
  });
  return rendered;
}


function splitCastCredit(text){
  const clean=plainTextFromHTML(text||'').replace(/\s+/g,' ').trim();
  if(!clean) return {name:'',role:''};
  const match=clean.match(/^(.+?)\s*[:：]\s*(.+)$/);
  return match ? {name:match[1].trim(),role:match[2].trim()} : {name:clean,role:''};
}
function renderFilmCastSection(entries,ids){
  const rows=[];
  const seen=new Set();
  (entries||[]).forEach(entry=>{
    const credit=splitCastCredit(entry);
    if(!credit.name) return;
    const person=personByReference(credit.name);
    if(person) seen.add(person.id);
    const actor=person ? personCreditButton(person,person.name) : escapeHTML(credit.name);
    rows.push('<li><span class="film-cast-actor">'+actor+'</span>'+(credit.role?'<span class="film-cast-role">'+escapeHTML(credit.role)+'</span>':'')+'</li>');
  });
  (ids||[]).forEach(id=>{
    const person=personByReference(id);
    if(person && !seen.has(person.id)){
      seen.add(person.id);
      rows.push('<li><span class="film-cast-actor">'+personCreditButton(person,person.name)+'</span></li>');
    }
  });
  if(!rows.length) return '';
  return '<section class="film-section"><h3>Distribution artistique</h3><ul class="film-cast-list">'+rows.join('')+'</ul></section>';
}

function filmSection(title,html){
  if(!html || !html.toString().trim()) return '';
  return '<section class="film-section"><h3>'+escapeHTML(title)+'</h3><p>'+html+'</p></section>';
}
function filmListSection(title,items){
  if(!items || !items.length) return '';
  return '<section class="film-section"><h3>'+escapeHTML(title)+'</h3><ul class="film-list">'+items.map(x=>'<li>'+x+'</li>').join('')+'</ul></section>';
}
function renderFilmIndex(filter=''){
  const q=norm(filter);
  const data=[...CANONICAL_MODEL.films].filter(f=>!q||norm([f.title,f.original,f.year,f.type,f.director,(f.keywords||[]).join(' ')].join(' ')).includes(q))
    .sort((a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999)||a.title.localeCompare(b.title,'fr',{sensitivity:'base'}));
  filmContent.querySelector('.film-index-list').innerHTML=data.map(f=>
    '<article class="film-index-entry"><div class="film-index-year">'+escapeHTML(f.year||'—')+'</div><div><button class="film-index-title" type="button" data-film-id="'+escapeHTML(f.id)+'">'+escapeHTML(f.title)+'</button>'+
    (f.original&&norm(f.original)!==norm(f.title)?'<p class="film-index-original">'+escapeHTML(f.original)+'</p>':'')+
    '<p class="film-index-meta">'+escapeHTML([f.type,f.director].filter(Boolean).join(' · '))+'</p></div></article>'
  ).join('')||'<p class="film-none">Aucun film ne correspond à cette recherche.</p>';
  filmContent.querySelector('.film-index-count').textContent=data.length+' œuvre'+(data.length>1?'s':'')+' affichée'+(data.length>1?'s':'');
}
function openFilmIndex(){
  filmContent.innerHTML='<div class="film-index-head"><p class="film-kicker">Filmographie de Fassbinder</p><h2>Base de données des films</h2><input class="film-index-search" id="filmIndexSearch" type="search" placeholder="Rechercher un titre, une année, une personne…"><div class="film-index-count"></div></div><div class="film-index-list"></div>';
  renderFilmIndex('');
  const search=filmContent.querySelector('#filmIndexSearch'); search?.addEventListener('input',()=>renderFilmIndex(search.value));
  filmDrawer.classList.add('open');filmOverlay.classList.add('open');filmDrawer.setAttribute('aria-hidden','false');filmOverlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(()=>search?.focus(),30);
}
function openFilm(filmId,origin=null){
  const f=CANONICAL_MODEL.films.find(x=>x.id===filmId); if(!f) return;
  activeFilmId=filmId;
  if(origin) crossNavigationOrigin=origin;
  const poster=f.poster?'<div class="film-poster"><img src="'+escapeHTML(f.poster)+'" alt="Affiche de '+escapeHTML(f.title)+'"></div>':'';
  const metaParts=[f.type,f.duration?(f.duration+' min'):'',f.country].filter(Boolean);
  const yearMeta=f.year
    ? '<button class="film-year-link film-main-year" data-film-year="'+escapeHTML(f.year)+'" type="button" title="Revenir à '+escapeHTML(f.year)+' sur la frise">'+escapeHTML(f.year)+'</button>'
    : '';
  const metaHTML=[yearMeta,metaParts.length?'<span>'+escapeHTML(metaParts.join(' · '))+'</span>':''].filter(Boolean).join('<span aria-hidden="true"> · </span>');
  const credits=[['Réalisation',escapeHTML(f.director)],['Scénario',f.screenplay],['Image',f.cinematography],['Montage',f.editing],['Décors',f.decor],['Musique',f.music],['Production',f.production]].filter(x=>x[1]).map(x=>'<li><strong>'+escapeHTML(x[0])+' :</strong> '+linkKnownPeopleInHTML(x[1],f.crewIds)+'</li>');
  const excerpts=(f.excerpts||[]).length?'<section class="film-section"><h3>Extraits</h3><div class="film-links">'+f.excerpts.map((x,i)=>'<a class="film-excerpt-link" href="'+escapeHTML(resolveExcerptSrc(x))+'" target="_blank" rel="noopener">Extrait '+(i+1)+'</a>').join('')+'</div></section>':'';
  const crossNav=(crossNavigationOrigin&&crossNavigationOrigin.type==='person')
    ? '<nav class="cross-nav" aria-label="Navigation croisée"><span class="cross-nav-label">Depuis la personne</span><button type="button" data-cross-back-person="'+escapeHTML(crossNavigationOrigin.id)+'">← Retour à '+escapeHTML(crossNavigationOrigin.label||'la fiche personne')+'</button></nav>'
    : '';
  filmContent.innerHTML=crossNav+'<div class="film-profile">'+poster+'<div class="film-profile-main"><p class="film-kicker">Film</p><h2>'+escapeHTML(f.title)+'</h2>'+(f.original&&norm(f.original)!==norm(f.title)?'<p class="film-original-title">'+escapeHTML(f.original)+'</p>':'')+'<p class="film-meta">'+metaHTML+'</p></div></div>'+filmSection('Synopsis',f.synopsis)+filmListSection('Générique technique',credits)+renderFilmCastSection(f.cast,f.castIds)+filmListSection('Autres indications techniques',renderFilmCreditEntries(f.crew,f.crewIds))+excerpts+filmSection('Analyse',f.analysis)+filmListSection('Bibliographie',f.bibliography)+filmListSection('Sources',f.sources);
  const img=filmContent.querySelector('.film-poster img'); if(img) img.addEventListener('error',()=>{
    const container=img.closest('.film-poster');
    if(f.posterExplicit) container.outerHTML='<div class="film-poster-missing">Image introuvable<br>'+escapeHTML(f.poster.replace(/^Films_images\//,''))+'</div>';
    else container.remove();
  },{once:true});
  filmDrawer.classList.add('open');
  filmOverlay.classList.add('open');
  filmDrawer.setAttribute('aria-hidden','false');
  filmOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  filmClose.focus();
}
function closeFilm(){filmDrawer.classList.remove('open');filmOverlay.classList.remove('open');filmDrawer.setAttribute('aria-hidden','true');filmOverlay.setAttribute('aria-hidden','true');document.body.style.overflow='';activeFilmId=null;}
