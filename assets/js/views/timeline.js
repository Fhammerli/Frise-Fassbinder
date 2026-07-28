/* Fassbinder Explorer V3.4 — views/timeline.js
 * Rendu de la frise, des périodes, des années, des médias et des sources.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

function yearsFor(periodId){ return CANONICAL_MODEL.timeline.years.filter(y=>norm(y.periodLink)===norm(periodId)); }

function buildLegend(){
  legendEl.innerHTML='';
  TRACK_LABELS.forEach((label,i)=>{
    const btn=document.createElement('button');
    btn.dataset.idx=i;
    btn.className = activeTracks.has(i)?'active-border':'off';
    btn.style.setProperty('--c-track', PALETTE[i%PALETTE.length]);
    btn.innerHTML = `<span class="dot"></span>${label}`;
    legendEl.appendChild(btn);
  });
}

function buildSpine(){
  spine.innerHTML='';
  if(CANONICAL_MODEL.timeline.periods.length===0){ spine.innerHTML='<div class="empty">Aucune période détectée.</div>'; return; }
  CANONICAL_MODEL.timeline.periods.forEach((d,i)=>{
    const node=document.createElement('div');
    node.className='node'+(mode==='period'&&i===current?' active':'')+(yearsFor(d.id).length?' hasyears':'');
    node.style.flex=d.w+' 1 62px';
    node.innerHTML=`<div class="yr">${d.id}</div>`;
    node.addEventListener('click',()=>{ mode='period'; selectPeriod(i); });
    spine.appendChild(node);
  });
}

function renderRow(row){
  videoRowEl.innerHTML='';
  (row.video||[]).forEach((v)=>{
    const a=document.createElement('a');
    a.className='video-chip'; a.href=safeExternalHref(v.url); a.target='_blank'; a.rel='noopener noreferrer';
    const kind=v.kind || classifyLinkKind(v.url);
    const icon=kind==='video' ? PLAY_SVG : (kind==='document' ? DOCUMENT_SVG : LINK_SVG);
    a.dataset.linkKind=kind;
    a.innerHTML = icon + ' ' + escapeHTML(v.label || defaultLinkLabel(kind));
    videoRowEl.appendChild(a);
  });

  panelImagesEl.innerHTML='';
  const images=((row.images && row.images.length) ? row.images : (row.image ? [{src:row.image,legend:row.legend||'',source:row.source||''}] : [])).slice(0,3);
  if(images.length){
    images.forEach((item,index)=>{
      const figure=document.createElement('figure');
      figure.className='panel-head-figure';
      const frame=document.createElement('div');
      frame.className='panel-head-image';
      const img=document.createElement('img');
      img.src=item.src;
      img.alt=item.legend || ('Illustration '+(index+1)+' — '+row.id);
      frame.appendChild(img);
      figure.appendChild(frame);
      if(item.legend || item.source){
        const caption=document.createElement('figcaption');
        caption.textContent=[item.legend,item.source].filter(Boolean).join(' — ');
        figure.appendChild(caption);
      }
      panelImagesEl.appendChild(figure);
    });
    panelImagesEl.style.display='flex';
  } else {
    panelImagesEl.style.display='none';
  }

  excerptRowEl.innerHTML='';
  if(row.excerpt){
    const layout=document.createElement('div');
    layout.className='excerpt-layout';

    const wrap=document.createElement('div');
    wrap.className='excerpt-player';
    const title=document.createElement('p');
    title.className='excerpt-title';
    title.textContent='Extrait';
    wrap.appendChild(title);

    const src=row.excerpt;
    const ext=(src.split('?')[0].split('.').pop()||'').toLowerCase();
    if(['mp4','webm','ogg','mov'].includes(ext)){
      const video=document.createElement('video');
      video.controls=true; video.preload='metadata'; video.src=src;
      wrap.appendChild(video);
    } else if(['mp3','wav','m4a','aac','flac','oga'].includes(ext)){
      const audio=document.createElement('audio');
      audio.controls=true; audio.preload='metadata'; audio.src=src;
      wrap.appendChild(audio);
    } else {
      const link=document.createElement('a');
      link.href=src; link.target='_blank'; link.rel='noopener';
      link.innerHTML=PLAY_SVG+' Ouvrir l’extrait';
      wrap.appendChild(link);
    }
    layout.appendChild(wrap);

    if((row.excerptDescription && row.excerptDescription.trim()) || (row.excerptPrompt && row.excerptPrompt.trim())){
      const description=document.createElement('div');
      description.className='excerpt-description';
      if(row.excerptDescription && row.excerptDescription.trim()){
        const heading=document.createElement('h3');
        heading.textContent='Description de l’extrait';
        const text=document.createElement('p');
        text.innerHTML=row.excerptDescription;
        description.appendChild(heading);
        description.appendChild(text);
      }
      if(row.excerptPrompt && row.excerptPrompt.trim()){
        const prompt=document.createElement('div');
        prompt.className='excerpt-prompt';
        prompt.innerHTML='<strong>Consigne d’analyse</strong><p>'+row.excerptPrompt+'</p>';
        description.appendChild(prompt);
      }
      layout.appendChild(description);
    }

    excerptRowEl.appendChild(layout);
  }

  periodQuestionEl.innerHTML='';
  let displayedQuestion=(row.periodQuestion||'').trim();
  // En vue annuelle, reprend la question de la période si la cellule annuelle est vide.
  // En vue période, accepte aussi une question placée sur la première année de la période.
  if(!displayedQuestion && mode==='year'){
    const parent=CANONICAL_MODEL.timeline.periods.find(p=>norm(p.id)===norm(row.periodLink));
    if(parent) displayedQuestion=(parent.periodQuestion||'').trim();
  } else if(!displayedQuestion && mode==='period'){
    const firstQuestion=yearsFor(row.id).find(y=>(y.periodQuestion||'').trim());
    if(firstQuestion) displayedQuestion=firstQuestion.periodQuestion.trim();
  }
  if(displayedQuestion){
    periodQuestionEl.style.display='block';
    periodQuestionEl.innerHTML='<strong>Question directrice</strong>'+displayedQuestion;
  } else {
    periodQuestionEl.style.display='none';
  }

  notionsEl.innerHTML='';
  let notionSource=(row.notions||'').trim();
  if(!notionSource && mode==='year'){
    const parent=CANONICAL_MODEL.timeline.periods.find(p=>norm(p.id)===norm(row.periodLink));
    if(parent) notionSource=(parent.notions||'').trim();
  } else if(!notionSource && mode==='period'){
    notionSource=yearsFor(row.id).map(y=>y.notions||'').filter(Boolean).join(';');
  }
  const notions=[...new Set(splitCellList(notionSource,{allowComma:true}))];
  if(notions.length){
    notionsEl.style.display='flex';
    notions.forEach(n=>{
      const chip=document.createElement('span');
      chip.className='notion-chip';
      chip.textContent=n;
      notionsEl.appendChild(chip);
    });
  } else {
    notionsEl.style.display='none';
  }

  citationWrap.innerHTML='';
  if(row.citation && row.citation.trim()){
    const block=document.createElement('blockquote');
    block.className='citation';
    block.innerHTML=`<span class="citation-mark">“</span><p>${row.citation}</p>`;
    citationWrap.appendChild(block);
  }

  cardsEl.innerHTML='';
  row.trackLabels.forEach((label,i)=>{
    const card=document.createElement('div');
    card.className='card'+(activeTracks.has(i)?'':' hidden');
    card.style.setProperty('--c-track', PALETTE[i%PALETTE.length]);
    card.style.setProperty('--c-track-bg', BACKGROUND_PALETTE[i%BACKGROUND_PALETTE.length]);
    card.innerHTML=`<h3>${label}</h3><p>${(row.values[i]||'').toString()}</p>`;
    cardsEl.appendChild(card);
  });

  bubbleWrap.innerHTML='';
  if(row.reception && row.reception.trim()){
    const analysis=document.createElement('section');
    analysis.className='analysis-block';
    analysis.innerHTML='<h3>Analyse et réception critique</h3><p>'+row.reception+'</p>';
    bubbleWrap.appendChild(analysis);
  }
  // Les IDs techniques de la Frise servent à ouvrir directement les fiches Films.
  // Les identifiants eux-mêmes ne sont jamais affichés comme une piste documentaire.
  linkifyFilms(cardsEl,row.filmIds||[]);
  // Rend ensuite les personnes reconnues cliquables après la construction de la vue.
  linkifyPeople(document.querySelector('section'));
}

function buildDrilldown(){
  drilldownEl.innerHTML='';
  const list = mode==='period' ? yearsFor(CANONICAL_MODEL.timeline.periods[current].id) : yearList;
  if(list.length===0) return;

  if(mode==='year'){
    const back=document.createElement('button');
    back.className='back';
    back.textContent='← Retour à la période';
    back.addEventListener('click',exitYearMode);
    drilldownEl.appendChild(back);
  }

  const pills=document.createElement('div');
  pills.className='yearpills';
  list.forEach((y,i)=>{
    const p=document.createElement('button');
    p.textContent=y.id;
    if(mode==='year' && i===yearIndex) p.classList.add('active');
    p.setAttribute('aria-label',`Afficher l’année ${y.id}`);
    p.addEventListener('click',()=>{
      if(mode==='period'){
        enterYearMode(list);
        selectYear(i);
      } else {
        selectYear(i);
      }
    });
    pills.appendChild(p);
  });
  drilldownEl.appendChild(pills);
}

function enterYearMode(list){
  mode='year'; yearList=list; yearIndex=0;
  selectYear(0);
}
function exitYearMode(){
  mode='period'; selectPeriod(current);
}

function selectYear(i){
  yearIndex=Math.max(0,Math.min(yearList.length-1,i));
  const y=yearList[yearIndex];
  timecodeEl.textContent=y.id;
  captionEl.textContent='Année — période '+CANONICAL_MODEL.timeline.periods[current].id;
  positionEl.textContent=`Année ${yearIndex+1} / ${yearList.length} — période ${current+1} / ${CANONICAL_MODEL.timeline.periods.length}`;
  prevBtn.disabled = yearIndex===0;
  nextBtn.disabled = yearIndex===yearList.length-1;
  renderRow(y);
  buildDrilldown();
}

function selectPeriod(i){
  if(CANONICAL_MODEL.timeline.periods.length===0) return;
  current=Math.max(0,Math.min(CANONICAL_MODEL.timeline.periods.length-1,i));
  const d=CANONICAL_MODEL.timeline.periods[current];
  timecodeEl.textContent=d.id;
  captionEl.textContent=d.caption||'';
  positionEl.textContent=`Période ${current+1} / ${CANONICAL_MODEL.timeline.periods.length}`;
  prevBtn.disabled=current===0;
  nextBtn.disabled=current===CANONICAL_MODEL.timeline.periods.length-1;
  document.querySelectorAll('.node').forEach((n,idx)=>n.classList.toggle('active',idx===current));
  renderRow(d);
  buildDrilldown();
}

legendEl.addEventListener('click',(e)=>{
  const btn=e.target.closest('button'); if(!btn) return;
  const idx=Number(btn.dataset.idx);
  if(activeTracks.has(idx)){
    if(activeTracks.size===1) return;
    activeTracks.delete(idx); btn.classList.remove('active-border'); btn.classList.add('off');
  } else {
    activeTracks.add(idx); btn.classList.add('active-border'); btn.classList.remove('off');
  }
  if(mode==='period') renderRow(CANONICAL_MODEL.timeline.periods[current]); else renderRow(yearList[yearIndex]);
});

prevBtn.addEventListener('click',()=>{ mode==='period' ? selectPeriod(current-1) : selectYear(yearIndex-1); });
nextBtn.addEventListener('click',()=>{ mode==='period' ? selectPeriod(current+1) : selectYear(yearIndex+1); });
document.addEventListener('keydown',(e)=>{
  if(e.key==='ArrowRight') nextBtn.click();
  if(e.key==='ArrowLeft') prevBtn.click();
});

function rerenderAll(){
  activeTracks = new Set(TRACK_LABELS.map((t,i)=>i));
  mode='period';
  buildLegend(); buildSpine(); selectPeriod(0);
}


function timelineLinkKey(value){
  try{
    const url=new URL((value||'').trim(),window.location.href);
    url.hostname=url.hostname.toLowerCase();
    return url.href.replace(/\/$/,'');
  }catch(err){ return (value||'').trim(); }
}

function timelineLinkHost(value){
  try{ return new URL(value,window.location.href).hostname.replace(/^www\./,''); }
  catch(err){ return ''; }
}

function collectTimelineLinks(){
  const found=new Map();
  const addRows=(rows,locationLabel)=>rows.forEach(row=>{
    (row.video||[]).forEach(link=>{
      if(!link.url) return;
      const key=timelineLinkKey(link.url);
      if(!key) return;
      if(!found.has(key)) found.set(key,{...link,locations:new Set()});
      const item=found.get(key);
      if(link.customLabel && !item.customLabel){item.label=link.label;item.customLabel=true;}
      item.locations.add(locationLabel(row));
    });
  });
  addRows(CANONICAL_MODEL.timeline.periods,row=>'Période '+row.id);
  addRows(CANONICAL_MODEL.timeline.years,row=>'Année '+row.id);
  return [...found.values()].map(item=>({...item,locations:[...item.locations]}));
}

function renderGeneralSources(){
  if(!CANONICAL_MODEL.timeline.sources.length){
    return '<p class="sources-empty">Aucune référence générale n’est encore renseignée. Ajoutez vos ouvrages et sites dans la feuille <strong>Sources générales</strong> du tableau de la frise.</p>';
  }
  return '<div class="sources-list">'+CANONICAL_MODEL.timeline.sources.map(source=>{
    const link=source.url ? '<a href="'+escapeHTML(safeExternalHref(source.url))+'" target="_blank" rel="noopener noreferrer">'+LINK_SVG+' Consulter la ressource</a>' : '';
    return '<article class="source-entry">'+
      (source.category?'<p class="source-category">'+escapeHTML(source.category)+'</p>':'')+
      '<p class="source-reference">'+(source.reference||escapeHTML(source.url))+'</p>'+
      (source.usage?'<p class="source-usage"><strong>Usage :</strong> '+source.usage+'</p>':'')+
      link+'</article>';
  }).join('')+'</div>';
}

function renderTimelineSources(){
  const links=collectTimelineLinks();
  if(!links.length) return '<p class="sources-empty">Aucun lien n’est encore renseigné dans les feuilles Périodes et Années.</p>';
  return '<div class="sources-list">'+links.map(link=>{
    const kind=link.kind||classifyLinkKind(link.url);
    const host=timelineLinkHost(link.url);
    const title=link.customLabel ? link.label : (kind==='video'?'Vidéo':kind==='document'?'Document':'Page web')+(host?' — '+host:'');
    const icon=kind==='video'?PLAY_SVG:(kind==='document'?DOCUMENT_SVG:LINK_SVG);
    return '<article class="source-entry"><p class="source-category">'+escapeHTML(kind==='video'?'Vidéo':kind==='document'?'Document':'Page web')+'</p>'+
      '<p class="source-reference"><a href="'+escapeHTML(safeExternalHref(link.url))+'" target="_blank" rel="noopener noreferrer">'+icon+' '+escapeHTML(title)+'</a></p>'+
      '<p class="source-locations"><strong>Cité dans :</strong> '+escapeHTML(link.locations.join(' · '))+'</p></article>';
  }).join('')+'</div>';
}

function renderSourcesDrawer(){
  sourcesContent.innerHTML='<p class="sources-kicker">Sources et méthode</p><h2>Références de travail</h2>'+
    '<p class="sources-intro">Cette frise est un outil pédagogique évolutif. Les références générales indiquent les ouvrages et sites qui structurent le travail ; les ressources ponctuelles sont recensées automatiquement à partir des liens associés aux périodes et aux années.</p>'+
    '<section class="sources-group"><h3>Références générales</h3>'+renderGeneralSources()+'</section>'+
    '<section class="sources-group"><h3>Ressources citées dans la frise</h3>'+renderTimelineSources()+'</section>';
}

function openSources(){
  if(personDrawer.classList.contains('open')) closePerson();
  if(filmDrawer.classList.contains('open')) closeFilm();
  renderSourcesDrawer();
  sourcesDrawer.classList.add('open');sourcesOverlay.classList.add('open');
  sourcesDrawer.setAttribute('aria-hidden','false');sourcesOverlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';sourcesClose.focus();
}

function closeSources(){
  sourcesDrawer.classList.remove('open');sourcesOverlay.classList.remove('open');
  sourcesDrawer.setAttribute('aria-hidden','true');sourcesOverlay.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
