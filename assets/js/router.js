/* Fassbinder Explorer V3.4 — router.js
 * Navigation croisée Frise ↔ Films ↔ Entourage et conservation de l’origine.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

const NAVIGATION_STATE={filmFilter:'',peopleFilter:'',timelineMode:'period',periodIndex:0,yearIndex:0};

function navigateToCitedYear(yearId){
  const target=CANONICAL_MODEL.timeline.years.find(y=>String(y.id)===String(yearId));
  if(!target) return;
  const periodIndex=CANONICAL_MODEL.timeline.periods.findIndex(p=>norm(p.id)===norm(target.periodLink));
  if(periodIndex<0) return;
  closePerson();
  current=periodIndex;
  yearList=yearsFor(CANONICAL_MODEL.timeline.periods[current].id);
  mode='year';
  buildSpine();
  const targetIndex=yearList.findIndex(y=>String(y.id)===String(yearId));
  selectYear(targetIndex<0?0:targetIndex);
  document.querySelector('section')?.scrollIntoView({behavior:'smooth',block:'start'});
}


filmIndexButton.addEventListener('click',openFilmIndex);filmClose.addEventListener('click',closeFilm);filmOverlay.addEventListener('click',closeFilm);
sourcesButton.addEventListener('click',openSources);sourcesClose.addEventListener('click',closeSources);sourcesOverlay.addEventListener('click',closeSources);
document.addEventListener('click',e=>{
  const backFilm=e.target.closest('[data-cross-back-film]');
  if(backFilm){const person=CANONICAL_MODEL.people.find(p=>p.id===activePersonId);closePerson();crossNavigationOrigin=null;openFilm(backFilm.dataset.crossBackFilm,person?{type:'person',id:person.id,label:person.name}:null);return;}
  const backPerson=e.target.closest('[data-cross-back-person]');
  if(backPerson){const film=CANONICAL_MODEL.films.find(f=>f.id===activeFilmId);closeFilm();crossNavigationOrigin=null;openPerson(backPerson.dataset.crossBackPerson,film?{type:'film',id:film.id,label:film.title}:null);return;}
  const personYear=e.target.closest('[data-person-film-year]');
  if(personYear){closePerson();crossNavigationOrigin=null;navigateToCitedYear(personYear.dataset.personFilmYear);return;}
  const filmPersonButton=e.target.closest('[data-film-person-id]');
  if(filmPersonButton){const film=CANONICAL_MODEL.films.find(f=>f.id===activeFilmId);closeFilm();openPerson(filmPersonButton.dataset.filmPersonId,film?{type:'film',id:film.id,label:film.title}:null);return;}
  const personFilmButton=e.target.closest('[data-person-film-id]');
  if(personFilmButton){const person=CANONICAL_MODEL.people.find(p=>p.id===activePersonId);closePerson();openFilm(personFilmButton.dataset.personFilmId,person?{type:'person',id:person.id,label:person.name}:null);return;}
  const filmButton=e.target.closest('[data-film-id]');
  if(filmButton){crossNavigationOrigin=null;openFilm(filmButton.dataset.filmId);return;}
  const yearButton=e.target.closest('[data-film-year]');
  if(yearButton){closeFilm();crossNavigationOrigin=null;navigateToCitedYear(yearButton.dataset.filmYear);}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&filmDrawer.classList.contains('open'))closeFilm();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sourcesDrawer.classList.contains('open'))closeSources();});

window.FassbinderRouter=Object.freeze({
  state:NAVIGATION_STATE,
  openYear:navigateToCitedYear,
  openFilm(id){openFilm(id);},
  openPerson(id){openPerson(id);}
});
