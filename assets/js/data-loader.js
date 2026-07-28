/* Fassbinder Explorer V3.4 — data-loader.js
 * Import XLSX/CSV, modèle canonique et chargement des trois sources.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

const PALETTE = ['var(--t1)','var(--t2)','var(--t3)','var(--t4)'];
const BACKGROUND_PALETTE = ['var(--t1-bg)','var(--t2-bg)','var(--t3-bg)','var(--t4-bg)'];
const PLAY_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const LINK_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
const DOCUMENT_SVG = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/></svg>';
const NOTE_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4V5z"/></svg>';

const appLoader=document.getElementById('appLoader');
const appLoaderBar=document.getElementById('appLoaderBar');
const appLoaderMessage=document.getElementById('appLoaderMessage');
const appLoaderDetail=document.getElementById('appLoaderDetail');
const appLoaderEnter=document.getElementById('appLoaderEnter');
const appWrap=document.getElementById('appWrap');
const startupState={timeline:false,people:false,films:false,timelineError:'',peopleError:'',filmsError:''};
function setStartupProgress(percent,message,detail=''){
  appLoaderBar.style.width=Math.max(8,Math.min(100,percent))+'%';
  if(message) appLoaderMessage.textContent=message;
  appLoaderDetail.textContent=detail;
}
function finishStartup(){
  const errors=[startupState.timelineError,startupState.peopleError,startupState.filmsError].filter(Boolean);
  setStartupProgress(100,errors.length?'Site chargé avec un avertissement':'Site documentaire prêt',errors.join(' · '));
  const reveal=()=>{appLoader.classList.add('ready');document.body.classList.remove('is-loading');appWrap.setAttribute('aria-hidden','false');};
  if(errors.length){appLoaderEnter.hidden=false;appLoaderEnter.addEventListener('click',reveal,{once:true});setTimeout(reveal,4200);}
  else setTimeout(reveal,320);
}
const PEOPLE_WORKBOOK_FILENAME = 'RWF_Entourage.xlsx';
const PEOPLE_CACHE_KEY = 'RWF_Entourage_workbook_v9_entourage7';

let PEOPLE_ALIAS_MAP = [];
const FILMS_WORKBOOK_FILENAME='RWF_Films.xlsx';
const FILMS_CACHE_KEY='RWF_Films_workbook_v2';




function parseWeight(str){ const n=(str.match(/\d{3,4}/g)||[]).map(Number); return n.length>=2 ? Math.max(1,n[1]-n[0]) : 1; }

// Résout le chemin d'une image : URL/donnée déjà complète, ou nom de fichier
// à aller chercher dans le dossier "FriseRWF_images" placé à côté de ce fichier HTML.
function resolveImageSrc(v){
  if(!v) return '';
  if(/^(https?:|data:|\/|\.\/|\.\.\/)/i.test(v)) return v;
  return 'Images_Frise/' + v;
}

function resolveExcerptSrc(v){
  if(!v) return '';
  if(/^(https?:|data:|\/|\.\/|\.\.\/)/i.test(v)) return v;
  return 'Frise_extraits/' + v;
}

// ---------- DEFAULT EXAMPLE (illustrates all features; replace with your own content via l'import) ----------
const DEFAULT_TRACK_LABELS = ["Histoire & politique","Contexte culturel","Biographie de Fassbinder","Œuvres"];

const DEFAULT_PERIODS = [
 { id:"1945", w:1, caption:"Année zéro", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Capitulation du Troisième Reich (mai). L'Allemagne est en ruines (Année Zéro). Début de l'occupation alliée et de l'amnésie collective sur le passé nazi.",
   "Le cinéma est en ruines. Période des films de décombres (Trümmerfilme) comme Les assassins sont parmi nous (Staudte, 1946).",
   "Naissance de Rainer Werner Fassbinder le 31 mai à Bad Wörishofen, Bavière.",
   "L'œuvre de Fassbinder proposera plus tard une radiographie critique de ce « point zéro » de la nouvelle Allemagne." ]},
 { id:"1946–1960", w:15, caption:"Miracle économique et refoulement", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Création de la RFA (1949). Ère Adenauer. Miracle économique (Wirtschaftswunder) et intégration sociale conservatrice. Réarmement de la RFA (1955).",
   "Domination du « cinéma de papa » (Papas Kino) : films de terroir (Heimatfilm) et comédies légères dépolitisées.",
   "Enfance marquée par le divorce de ses parents (1951) et l'absence du père. Passion précoce pour le cinéma, vécu comme refuge. Première lecture de Berlin Alexanderplatz vers 14 ans.",
   "Fassbinder analyse rétrospectivement cette période — les mensonges du miracle économique — dans la future Trilogie de la RFA." ]},
 { id:"1961–1966", w:6, caption:"Naissance du Nouveau Cinéma Allemand", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"Le vieux cinéma est mort. Nous croyons au nouveau.", image:"", values:[
   "Construction du Mur de Berlin (1961). Procès d'Auschwitz à Francfort (1963-1965). Démission d'Adenauer. Grande Coalition (1966).",
   "Manifeste d'Oberhausen (1962) : naissance du Nouveau Cinéma Allemand (« Le vieux cinéma est mort »). Fondation de l'école de cinéma DFFB à Berlin (1966).",
   "Échec au concours d'entrée de la DFFB. Rencontre Hanna Schygulla et Irm Hermann dans un cours d'art dramatique. Rejoint l'Action-Theater (1967).",
   "Réalise ses premiers courts métrages : This Night (1966) et Le Clochard (1966). Confrontation de la mémoire de la Shoah." ]},
 { id:"1967–1970", w:4, caption:"L'Anti-teater et la politisation", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Mouvements étudiants de 1968. Tentative d'assassinat contre Rudi Dutschke. Victoire de Willy Brandt (SPD, 1969). Abrogation partielle de l'article 175 (homosexualité).",
   "Émergence de l'Anti-teater à Munich. Influence de la Nouvelle Vague française. Le cinéma devient politique et théorique.",
   "Fonde l'antiteater (1968). Collaboration intense avec sa « troupe » (Schygulla, Hermann, Raab, Baer, Lommel). Mariage avec Ingrid Caven (1970).",
   "L'amour est plus froid que la mort (1969, accueilli froidement à Berlin). Le Bouc (1969, succès à Mannheim) : critique de la xénophobie et de l'apathie bourgeoise." ]},
 { id:"1971–1974", w:4, caption:"La période sirkienne", trackLabels:DEFAULT_TRACK_LABELS,
   video:[
     { url:"#exemple-extrait-tous-les-autres-sappellent-ali", label:"Tous les autres s'appellent Ali — bande-annonce" },
     { url:"#exemple-extrait-martha", label:"Martha — extrait" }
   ],
   reception:"Exemple de bulle d'analyse et réception critique — à remplacer par votre propre texte. On pourrait ici reformuler la lecture qu'un critique a proposée du dispositif mélodramatique hérité de Sirk chez Fassbinder : distance et empathie tenues ensemble, jamais résolues.",
   citation:"Je ne veux pas faire pleurer les gens, mais leur montrer pourquoi ils ne peuvent pas s'aimer.",
   image:"",
   values:[
   "Terrorisme de la RAF (arrestations en 1972). Attentat des JO de Munich (1972). Démission de Willy Brandt (1974) suite à l'affaire Guillaume.",
   "Découverte des mélodrames de Douglas Sirk. Fondation du Filmverlag der Autoren (1971). Accords Film-Télévision (1974) favorisant les coproductions (WDR).",
   "Liaison avec El Hedi ben Salem. Direction du TAT à Francfort. Collaboration avec le caméraman Michael Ballhaus. Succès international.",
   "Période sirkienne : Le Marchand des quatre saisons (1971). Tous les autres s'appellent Ali (1974, succès mondial à Cannes), critique du racisme ordinaire. Martha (1974)." ]},
 { id:"1975–1976", w:2, caption:"Crise et visibilité", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Tensions sociales et crises du logement (Westend). Débats sur la visibilité des minorités. Lois limitant les libertés civiles.",
   "Développement du « film amphibie » (cinéma/télévision). Le cinéma devient un outil de critique sociale directe.",
   "Scandale théâtral autour de la pièce L'Ordure, la ville et la mort (accusations d'antisémitisme). Liaison avec Armin Meier.",
   "Maman Küsters s'en va au ciel (1975). Le Droit du plus fort (1975), où Fassbinder joue le rôle principal, assumant une visibilité politique de son homosexualité." ]},
 { id:"1977–1979", w:3, caption:"L'automne allemand", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Automne allemand (1977) : enlèvement de Schleyer, détournement du Landshut, morts à Stammheim. Diffusion de la série Holocaust (1979).",
   "Film collectif L'Allemagne en automne (1978). Le mouvement atteint son apogée thématique et politique.",
   "Suicide d'Armin Meier (31 mai 1978). Début de la collaboration avec Juliane Lorenz. Fassbinder se filme en crise, exposant son angoisse face à l'État.",
   "L'Année des treize lunes (1978), œuvre radicale sur le désespoir. Le Mariage de Maria Braun (1979), triomphe international, allégorie de la reconstruction." ]},
 { id:"1980–1981", w:2, caption:"L'apogée formelle", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Fondation des Verts (1980). Manifestations écologistes. Fin de l'ère sociale-libérale.",
   "Production de séries monumentales pour la télévision. Le Nouveau Cinéma Allemand atteint une maturité formelle extrême.",
   "Travaille frénétiquement. Réalise son projet de vie, l'adaptation de Döblin. Épuisement physique dû aux excès.",
   "Monumental Berlin Alexanderplatz (1980, 15h). Suite de la Trilogie de la RFA : Lola, une femme allemande (1981) et Lili Marleen (1981)." ]},
 { id:"1982", w:1, caption:"Mort de Fassbinder", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Victoire d'Helmut Kohl (CDU) en octobre. Fin d'une époque artistique et politique radicale.",
   "Mort de Fassbinder marquant symboliquement la fin du Nouveau Cinéma Allemand.",
   "Décès de Fassbinder le 10 juin à Munich, à l'âge de 37 ans (épuisement et overdose).",
   "Le Secret de Veronika Voss (Ours d'or à Berlin). Querelle (œuvre posthume). Fassbinder laisse un héritage de plus de 40 films." ]},
];

// Exemple illustratif du niveau "Années" (structure de démonstration uniquement)
const DEFAULT_YEARS = [
 { id:"1972", periodLink:"1971–1974", trackLabels:DEFAULT_TRACK_LABELS, video:[{ url:"#exemple-extrait-jo-munich", label:"Extrait — JO de Munich" }], reception:"", citation:"", image:"", values:[
   "Attentat contre la délégation israélienne aux Jeux olympiques de Munich (septembre 1972).",
   "Fassbinder tourne à un rythme intense ; consolidation de son style sirkien.",
   "Collaboration continue avec Michael Ballhaus à la caméra.",
   "Préparation de Tous les autres s'appellent Ali, tourné en quelques jours seulement." ]},
 { id:"1974", periodLink:"1971–1974", trackLabels:DEFAULT_TRACK_LABELS, video:[], reception:"", citation:"", image:"", values:[
   "Démission du chancelier Willy Brandt (mai) après l'affaire de l'espion Günter Guillaume.",
   "Accords Film-Télévision favorisant les coproductions avec la WDR.",
   "Reconnaissance critique internationale après Cannes.",
   "Sortie de Tous les autres s'appellent Ali et de Martha." ]},
];

const CANONICAL_MODEL = {
  timeline: { periods: DEFAULT_PERIODS, years: DEFAULT_YEARS, sources: [] },
  films: [],
  people: []
};
let TRACK_LABELS = DEFAULT_TRACK_LABELS;
let activeTracks = new Set(TRACK_LABELS.map((t,i)=>i));

let mode = 'period';        // 'period' | 'year'
let current = 0;            // index in CANONICAL_MODEL.timeline.periods
let yearList = [];          // filtered CANONICAL_MODEL.timeline.years for current period
let yearIndex = 0;

const spine=document.getElementById('spine');
const cardsEl=document.getElementById('cards'), videoRowEl=document.getElementById('videoRow'), excerptRowEl=document.getElementById('excerptRow'), bubbleWrap=document.getElementById('bubbleWrap');
const periodQuestionEl=document.getElementById('periodQuestion');
const notionsEl=document.getElementById('notions');
const citationWrap=document.getElementById('citationWrap');
const timecodeEl=document.getElementById('timecode'), captionEl=document.getElementById('caption'), positionEl=document.getElementById('position');
const panelImagesEl=document.getElementById('panelImages');
const prevBtn=document.getElementById('prevBtn'), nextBtn=document.getElementById('nextBtn'), legendEl=document.getElementById('legend');
const statusEl=document.getElementById('status'), fileInput=document.getElementById('fileInput');
const drilldownEl=document.getElementById('drilldown');
const peopleFileInput=document.getElementById('peopleFileInput');
const peopleStatusEl=document.getElementById('peopleStatus');
const personDrawer=document.getElementById('personDrawer');
const personOverlay=document.getElementById('personOverlay');
const personClose=document.getElementById('personClose');
const personContent=document.getElementById('personContent');
const peopleIndexButton=document.getElementById('peopleIndexButton');
const filmIndexButton=document.getElementById('filmIndexButton');
const filmsFileInput=document.getElementById('filmsFileInput');
const filmsStatusEl=document.getElementById('filmsStatus');
const filmDrawer=document.getElementById('filmDrawer');
let activePersonId=null;
let activeFilmId=null;
let crossNavigationOrigin=null;
const filmOverlay=document.getElementById('filmOverlay');
const filmClose=document.getElementById('filmClose');
const filmContent=document.getElementById('filmContent');
const sourcesButton=document.getElementById('sourcesButton');
const sourcesOverlay=document.getElementById('sourcesOverlay');
const sourcesDrawer=document.getElementById('sourcesDrawer');
const sourcesClose=document.getElementById('sourcesClose');
const sourcesContent=document.getElementById('sourcesContent');



function classifyHeader(headerRow){
  let idCol=0, periodTitleCol=null, periodLinkCol=null, filmIdsCol=null, videoCol=null, excerptCol=null, excerptDescriptionCol=null, excerptPromptCol=null, periodQuestionCol=null, notionsCol=null, receptionCol=null, citationCol=null;
  const imageCols=[], legendCols=[], sourceCols=[], tracks=[];
  const numberedIndex=(text)=>{ const match=text.match(/(?:^| )(\d+)$/); return match ? Number(match[1]) : 1; };
  for(let c=1;c<headerRow.length;c++){
    const label=(headerRow[c]||'').toString().trim();
    if(!label) continue;
    const nl=headerNorm(label);
    if(nl==='titre de periode' || nl==='titre periode' || (nl.includes('titre') && nl.includes('periode'))) periodTitleCol=c;
    else if(nl.includes('question directrice') || nl.includes('problematique de la periode') || nl.includes('question de la periode') || ((nl.includes('question') || nl.includes('problematique')) && nl.includes('periode'))) periodQuestionCol=c;
    else if(nl.includes('consigne d analyse') || nl.includes('consigne analyse') || nl.includes('question sur l extrait') || ((nl.includes('consigne') || nl.includes('question')) && nl.includes('extrait'))) excerptPromptCol=c;
    else if(nl==='notion' || nl==='notions' || nl.includes('notion cle') || nl.includes('notions cles') || nl.includes('mots cles') || nl.includes('mots-clefs')) notionsCol=c;
    else if((nl.includes('id film') || nl.includes('ids film')) && (nl.includes('oeuvre') || nl.includes('uvres'))) filmIdsCol=c;
    else if(nl.includes('periode')) periodLinkCol=c;
    else if(nl==='lien' || nl==='liens' || nl.includes('lien video') || nl.includes('liens video')) videoCol=c;
    else if(nl.includes('description') && nl.includes('extrait')) excerptDescriptionCol=c;
    else if(nl.includes('extrait')) excerptCol=c;
    else if(nl.includes('citation')) citationCol=c;
    else if(nl.includes('analyse et reception') || nl.includes('reception critique') || nl==='analyse' || nl==='analyse critique') receptionCol=c;
    else if(nl.includes('image') || nl.includes('photo') || nl.includes('illustration')) imageCols.push({index:c,number:numberedIndex(nl)});
    else if(nl.includes('legende')) legendCols.push({index:c,number:numberedIndex(nl)});
    else if(nl.includes('source')) sourceCols.push({index:c,number:numberedIndex(nl)});
    else tracks.push({index:c,label});
  }
  return {idCol,periodTitleCol,periodLinkCol,filmIdsCol,videoCol,excerptCol,excerptDescriptionCol,excerptPromptCol,periodQuestionCol,notionsCol,receptionCol,citationCol,imageCols,legendCols,sourceCols,tracks};
}

// Lit le texte simple d'une cellule, notamment pour les dates, chemins et en-têtes.
function getCellText(ws,r,c){
  const cell=ws[XLSX.utils.encode_cell({r,c})];
  if(!cell) return '';
  if(cell.w!=null) return cell.w.toString();
  if(cell.v!=null) return cell.v.toString();
  return '';
}

function escapeHTML(value){
  return (value||'').toString()
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// Nettoie le HTML produit par SheetJS. Seuls le gras, l'italique,
// le soulignement et les retours à la ligne sont conservés.
function sanitizeRichHTML(html){
  const template=document.createElement('template');
  template.innerHTML=html||'';
  const allowed=new Set(['B','STRONG','I','EM','U','BR','SPAN']);

  function clean(node){
    [...node.childNodes].forEach(child=>{
      if(child.nodeType===Node.TEXT_NODE) return;
      if(child.nodeType!==Node.ELEMENT_NODE){ child.remove(); return; }
      if(!allowed.has(child.tagName)){
        child.replaceWith(...child.childNodes);
        return;
      }
      if(child.tagName==='SPAN'){
        const style=(child.getAttribute('style')||'').toLowerCase();
        const rules=[];
        if(/font-weight\s*:\s*(bold|[6-9]00)/.test(style)) rules.push('font-weight:bold');
        if(/font-style\s*:\s*italic/.test(style)) rules.push('font-style:italic');
        if(/text-decoration[^;]*underline/.test(style)) rules.push('text-decoration:underline');
        [...child.attributes].forEach(a=>child.removeAttribute(a.name));
        if(rules.length) child.setAttribute('style',rules.join(';'));
        else child.replaceWith(...child.childNodes);
      } else {
        [...child.attributes].forEach(a=>child.removeAttribute(a.name));
      }
      if(child.isConnected || child.parentNode) clean(child);
    });
  }
  clean(template.content);
  return template.innerHTML;
}

// Lit le contenu enrichi d'une cellule. SheetJS place le texte enrichi
// dans cell.h lorsque l'option cellHTML est activée.
function getCellRichHTML(ws,r,c){
  const cell=ws[XLSX.utils.encode_cell({r,c})];
  if(!cell) return '';
  let html=cell.h ? sanitizeRichHTML(cell.h) : escapeHTML(getCellText(ws,r,c)).replace(/\r?\n/g,'<br>');

  // Prend aussi en compte un style appliqué à la cellule entière.
  const font=cell.s && cell.s.font ? cell.s.font : null;
  if(font){
    if(font.u || font.underline) html='<u>'+html+'</u>';
    if(font.i || font.italic) html='<em>'+html+'</em>';
    if(font.b || font.bold) html='<strong>'+html+'</strong>';
  }
  return html;
}

// Reconstruit un tableau de lignes à partir de la plage réelle de la feuille,
// en conservant la position physique (ligne/colonne) de chaque cellule — nécessaire
// pour retrouver ensuite les liens hypertexte (colonne « Liens »).
function sheetToRows(ws){
  if(!ws['!ref']) return [];
  const range=XLSX.utils.decode_range(ws['!ref']);
  const rows=[];
  for(let r=range.s.r;r<=range.e.r;r++){
    const row=[];
    for(let c=range.s.c;c<=range.e.c;c++){ row.push(getCellText(ws,r,c)); }
    row._physicalRow=r; row._colOffset=range.s.c;
    rows.push(row);
  }
  return rows;
}

function classifyLinkKind(url){
  const value=(url||'').trim();
  const clean=value.split(/[?#]/)[0].toLowerCase();
  if(/\.(pdf|docx?|odt|rtf|txt|epub|pptx?|odp|xlsx?|ods|csv|zip)$/i.test(clean)) return 'document';
  try{
    const host=new URL(value,window.location.href).hostname.toLowerCase().replace(/^www\./,'');
    if(/(^|\.)(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|dai\.ly|arte\.tv|ina\.fr)$/.test(host)) return 'video';
  }catch(err){ /* Une adresse non absolue reste un lien de page. */ }
  if(/\.(mp4|webm|ogv|mov|m4v)$/i.test(clean)) return 'video';
  return 'page';
}

// Répare les caractères UTF-8 parfois interprétés comme du latin-1 par le
// lecteur XLSX : « à » devient sinon « Ã  », et « é » devient « Ã© ».
function repairMojibake(value){
  let source=value||'';
  // Couvre aussi les formes mixtes observées dans Safari : « Ã%C2%A0 ».
  try{ source=decodeURI(source); }catch(err){ /* Conserve la valeur d'origine. */ }
  source=source.replace(/\u00A0/g,'\xA0');
  if(!/[ÃÂ]/.test(source)) return source;
  try{
    const chars=Array.from(source);
    if(chars.some(char=>char.charCodeAt(0)>255)) return source;
    return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(chars,char=>char.charCodeAt(0)));
  }catch(err){
    return source;
  }
}

// Nettoie et normalise l'adresse fournie par Excel avant de l'ouvrir.
function safeExternalHref(value){
  const cleaned=repairMojibake(value).replace(/[\u0000-\u001F\u007F\u200B-\u200D\u2060\uFEFF]/g,'').trim();
  try{
    const url=new URL(cleaned,window.location.href);
    return url.href;
  }catch(err){
    return cleaned;
  }
}

function defaultLinkLabel(kind,index,total){
  const base=kind==='video' ? 'Voir la vidéo' : (kind==='document' ? 'Ouvrir le document' : 'Consulter la page');
  return total>1 ? `${base} ${index+1}` : base;
}

// Extrait un ou plusieurs liens depuis une cellule :
// - si la cellule contient un lien hypertexte Excel, on utilise son texte affiché
//   ("texte à afficher") comme libellé du bouton ;
// - sinon, le texte de la cellule est découpé par point-virgule ou retour à la ligne ;
//   chaque segment peut être "Libellé|URL" ou une simple URL.
function parseLinksCell(ws,r,c,cellText){
  const cell=ws[XLSX.utils.encode_cell({r,c})];
  if(cell && cell.l && cell.l.Target){
    const url=cell.l.Target.trim();
    const kind=classifyLinkKind(url);
    const label=(cellText||'').trim();
    const customLabel=Boolean(label && label!==url);
    return [{ url, kind, customLabel, label: customLabel ? label : defaultLinkLabel(kind,0,1) }];
  }
  if(!cellText) return [];
  const chunks=splitCellList(cellText);
  return chunks.map((chunk,i)=>{
    const pipeIdx=chunk.indexOf('|');
    let label='',url=chunk;
    if(pipeIdx>-1){
      label=chunk.slice(0,pipeIdx).trim();
      url=chunk.slice(pipeIdx+1).trim();
    }
    const kind=classifyLinkKind(url);
    return { url, kind, customLabel:Boolean(label), label: label || defaultLinkLabel(kind,i,chunks.length) };
  });
}

function parseSheetRows(ws, headerMatch){
  const rows=sheetToRows(ws);
  if(rows.length===0) return null;
  const acceptedHeaders=(Array.isArray(headerMatch)?headerMatch:[headerMatch]).map(headerNorm);
  let headerRowIdx=-1;
  for(let r=0;r<rows.length;r++){
    if(acceptedHeaders.includes(headerNorm(rows[r][0]))){ headerRowIdx=r; break; }
  }
  if(headerRowIdx===-1) return null;
  const headerRow=rows[headerRowIdx];
  const cls=classifyHeader(headerRow);
  if(cls.tracks.length===0) return null;
  const colOffset=headerRow._colOffset;

  const out=[];
  for(let r=headerRowIdx+1;r<rows.length;r++){
    const row=rows[r];
    const idVal=(row[cls.idCol]||'').toString().trim();
    // Une ligne vide ou incomplète ne doit pas interrompre la lecture de toutes
    // les années suivantes du classeur.
    if(!idVal) continue;
    let video=[];
    if(cls.videoCol!=null){
      const cellText=(row[cls.videoCol]||'').toString().trim();
      video=parseLinksCell(ws,row._physicalRow,colOffset+cls.videoCol,cellText);
    }
    const physicalRow=row._physicalRow;
    const richCell=(relativeCol)=>getCellRichHTML(ws,physicalRow,colOffset+relativeCol).trim();
    out.push({
      id:idVal,
      w:parseWeight(idVal),
      caption: cls.periodTitleCol!=null ? (row[cls.periodTitleCol]||'').toString().trim() : '',
      periodLink: cls.periodLinkCol!=null ? (row[cls.periodLinkCol]||'').toString().trim() : null,
      video: video,
      reception: cls.receptionCol!=null ? richCell(cls.receptionCol) : '',
      citation: cls.citationCol!=null ? richCell(cls.citationCol) : '',
      images: cls.imageCols.map(imgCol=>{
        const raw=(row[imgCol.index]||'').toString().trim();
        if(!raw) return null;
        const legendCol=cls.legendCols.find(col=>col.number===imgCol.number);
        const sourceCol=cls.sourceCols.find(col=>col.number===imgCol.number);
        return {src:resolveImageSrc(raw),legend:legendCol ? (row[legendCol.index]||'').toString().trim() : '',source:sourceCol ? (row[sourceCol.index]||'').toString().trim() : ''};
      }).filter(Boolean),
      image: cls.imageCols.length ? resolveImageSrc((row[cls.imageCols[0].index]||'').toString().trim()) : '',
      legend: cls.legendCols.length ? (row[cls.legendCols[0].index]||'').toString().trim() : '',
      source: cls.sourceCols.length ? (row[cls.sourceCols[0].index]||'').toString().trim() : '', 
      excerpt: cls.excerptCol!=null ? resolveExcerptSrc((row[cls.excerptCol]||'').toString().trim()) : '',
      excerptDescription: cls.excerptDescriptionCol!=null ? richCell(cls.excerptDescriptionCol) : '',
      excerptPrompt: cls.excerptPromptCol!=null ? richCell(cls.excerptPromptCol) : '',
      periodQuestion: cls.periodQuestionCol!=null ? richCell(cls.periodQuestionCol) : '',
      notions: cls.notionsCol!=null ? getCellText(ws,physicalRow,colOffset+cls.notionsCol).trim() : '',
      filmIds: cls.filmIdsCol!=null ? splitCellList(row[cls.filmIdsCol],{allowPipe:true}) : [],
      trackLabels: cls.tracks.map(t=>t.label),
      values: cls.tracks.map(t=>richCell(t.index)),
    });
  }
  return out;
}

function parseGeneralSourcesWorkbook(wb){
  const sheetName=wb.SheetNames.find(name=>{
    const n=headerNorm(name);
    return n==='sources generales' || n==='references generales' || n==='bibliographie generale';
  });
  if(!sheetName) return [];
  const ws=wb.Sheets[sheetName];
  const rows=sheetToRows(ws);
  if(!rows.length) return [];
  let headerIndex=-1, columns=null;
  for(let r=0;r<rows.length;r++){
    const normalized=rows[r].map(headerNorm);
    const reference=normalized.findIndex(value=>value.includes('reference') || value.includes('bibliograph'));
    if(reference<0) continue;
    headerIndex=r;
    columns={
      category:normalized.findIndex(value=>value.includes('categorie') || value.includes('type')),
      reference,
      usage:normalized.findIndex(value=>value.includes('usage') || value.includes('utilisation') || value.includes('fonction')),
      link:normalized.findIndex(value=>value==='lien' || value==='url' || value.includes('lien externe'))
    };
    break;
  }
  if(headerIndex<0 || !columns) return [];
  const offset=rows[headerIndex]._colOffset;
  const sources=[];
  for(let r=headerIndex+1;r<rows.length;r++){
    const row=rows[r], physicalRow=row._physicalRow;
    const plain=index=>index>=0 ? getCellText(ws,physicalRow,offset+index).trim() : '';
    const rich=index=>index>=0 ? getCellRichHTML(ws,physicalRow,offset+index).trim() : '';
    const reference=rich(columns.reference);
    let url=plain(columns.link);
    if(columns.link>=0){
      const linkCell=ws[XLSX.utils.encode_cell({r:physicalRow,c:offset+columns.link})];
      if(linkCell && linkCell.l && linkCell.l.Target) url=linkCell.l.Target.trim();
    }
    if(!reference && !url) continue;
    sources.push({category:plain(columns.category),reference,usage:rich(columns.usage),url});
  }
  return sources;
}

const WORKBOOK_FILENAME = 'RWF_Frise.xlsx';
const LOCAL_CACHE_KEY = 'RWF_Frise_workbook_v16_periodes_inferrees';
const OBSOLETE_CACHE_KEYS = ['RWF_Frise_workbook_v1','RWF_Frise_workbook_v2','RWF_Frise_workbook_v3','RWF_Frise_workbook_v9','RWF_Frise_workbook_v14'];

function arrayBufferToBase64(buffer){
  const bytes=new Uint8Array(buffer);
  let binary='';
  const chunkSize=0x8000;
  for(let i=0;i<bytes.length;i+=chunkSize){
    binary += String.fromCharCode(...bytes.subarray(i,i+chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64){
  const binary=atob(base64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}

function cacheWorkbook(buffer){
  try{
    localStorage.setItem(LOCAL_CACHE_KEY,arrayBufferToBase64(buffer));
  }catch(err){
    console.warn('Le classeur est trop volumineux pour le cache local.',err);
  }
}

function applyWorkbook(buffer,sourceLabel,saveLocally=false){
  const wb=XLSX.read(buffer,{type:'array',cellHTML:true,cellStyles:true});
  let periods=null, years=null;
  for(const name of wb.SheetNames){
    const ws=wb.Sheets[name];
    if(!periods){ const p=parseSheetRows(ws,['dates','id periode']); if(p) periods=p; }
    if(!years){ const y=parseSheetRows(ws,['annee']); if(y) years=y; }
  }
  if(!periods) throw new Error("Aucune feuille avec une ligne d'en-tête « Dates » trouvée.");
  CANONICAL_MODEL.timeline.periods=periods;
  CANONICAL_MODEL.timeline.years=years||[];
  // Si l’ID de période a été oublié sur une ligne annuelle, rattache l’année à
  // la période dont l’intervalle la contient (ex. 1963 → 1961-1966).
  CANONICAL_MODEL.timeline.years.forEach(yearRow=>{
    if((yearRow.periodLink||'').trim()) return;
    const yearMatch=String(yearRow.id||'').match(/\d{4}/);
    if(!yearMatch) return;
    const yearNumber=Number(yearMatch[0]);
    const parent=periods.find(period=>{
      const bounds=String(period.id||'').match(/\d{4}/g)?.map(Number)||[];
      if(bounds.length===1) return yearNumber===bounds[0];
      return bounds.length>=2 && yearNumber>=bounds[0] && yearNumber<=bounds[1];
    });
    if(parent) yearRow.periodLink=parent.id;
  });
  CANONICAL_MODEL.timeline.sources=parseGeneralSourcesWorkbook(wb);
  TRACK_LABELS=periods[0].trackLabels;
  if(saveLocally) cacheWorkbook(buffer);
  const detected=[];
  if(periods.some(r=>(r.caption||'').trim())) detected.push('titres de période');
  if(periods.some(r=>(r.periodQuestion||'').trim()) || CANONICAL_MODEL.timeline.years.some(r=>(r.periodQuestion||'').trim())) detected.push('questions directrices');
  if(CANONICAL_MODEL.timeline.years.some(r=>(r.excerptPrompt||'').trim())) detected.push('consignes liées aux extraits');
  if(periods.some(r=>(r.notions||'').trim()) || CANONICAL_MODEL.timeline.years.some(r=>(r.notions||'').trim())) detected.push('notions');
  if(periods.some(r=>(r.filmIds||[]).length) || CANONICAL_MODEL.timeline.years.some(r=>(r.filmIds||[]).length)) detected.push('liens films par ID');
  if(CANONICAL_MODEL.timeline.sources.length) detected.push('références générales');
  statusEl.textContent=sourceLabel + (detected.length ? ' — détecté : '+detected.join(', ') : ' — aucune nouvelle colonne renseignée détectée');
  statusEl.className='status ok';
  rebuildPeopleOccurrences();
  rerenderAll();
}

async function loadSharedWorkbook(){
  // Sur SharePoint ou tout serveur web, le classeur portant ce nom est chargé
  // automatiquement à chaque ouverture. Le paramètre évite un ancien cache réseau.
  if(location.protocol==='http:' || location.protocol==='https:'){
    statusEl.textContent='Chargement de RWF_Frise.xlsx…';
    setStartupProgress(22,'Chargement de la chronologie…','RWF_Frise.xlsx');
    statusEl.className='status';
    try{
      const url=new URL(WORKBOOK_FILENAME,location.href);
      url.searchParams.set('v',Date.now().toString());
      const response=await fetch(url.toString(),{cache:'no-store'});
      if(!response.ok) throw new Error(`fichier introuvable (${response.status})`);
      const buffer=await response.arrayBuffer();
      applyWorkbook(buffer,'RWF_Frise.xlsx chargé automatiquement');
      startupState.timeline=true;
      setStartupProgress(58,'Chronologie chargée','Chargement de l’entourage…');
      return true;
    }catch(err){
      console.warn('Chargement automatique impossible :',err);
      statusEl.textContent='RWF_Frise.xlsx inaccessible — données intégrées affichées';
      startupState.timelineError='Chronologie Excel introuvable : données de secours affichées';
      statusEl.className='status err';
      rerenderAll();
      return false;
    }
  }

  // En ouverture locale (double-clic), les navigateurs interdisent généralement
  // le chargement automatique d'un fichier voisin. On restaure donc le dernier
  // classeur importé manuellement dans ce navigateur.
  OBSOLETE_CACHE_KEYS.forEach(key=>localStorage.removeItem(key));
  const cached=localStorage.getItem(LOCAL_CACHE_KEY);
  if(cached){
    try{
      applyWorkbook(base64ToArrayBuffer(cached),'Dernier tableau importé restauré');
      return;
    }catch(err){
      localStorage.removeItem(LOCAL_CACHE_KEY);
      console.warn('Cache local illisible :',err);
    }
  }
  statusEl.textContent='Importez le tableau Excel pour remplacer les données intégrées';
  statusEl.className='status';
  rerenderAll();
}

fileInput.addEventListener('change',(e)=>{
  const file=e.target.files[0]; if(!file) return;
  statusEl.textContent='Lecture en cours…'; statusEl.className='status';
  const reader=new FileReader();
  reader.onload=(evt)=>{
    try{
      const now=new Date();
      const dateStr=now.toLocaleDateString('fr-FR')+' à '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      applyWorkbook(evt.target.result,'Importé et mémorisé le '+dateStr,true);
    }catch(err){
      statusEl.textContent="Erreur d'import : "+err.message;
      statusEl.className='status err';
    }
  };
  reader.readAsArrayBuffer(file);
});

function resolvePersonImageSrc(v){
  if(!v) return '';
  const clean=v.toString().trim().replace(/\\/g,'/');
  if(!clean || /^#(VALUE|N\/A|REF|NAME|DIV\/0)/i.test(clean)) return '';
  if(/^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i.test(clean)) return clean;
  const encoded=clean.split('/').map(part=>encodeURIComponent(part)).join('/');
  return clean.toLocaleLowerCase('fr').startsWith('entourage_images/')
    ? encoded
    : 'Entourage_images/' + encoded;
}

function classifyPeopleHeader(headerRow){
  const cols={
    name:null, firstName:null, sortName:null, displayName:null, nickname:null, internalId:null, normalizedId:null,
    aliases:null, role:null, stratum:null, collaborationType:null,
    bio:null, relation:null, filmography:null, filmographyIds:null, unmatchedWorks:null, universeRole:null,
    image:null, source:null, dates:null, link:null
  };
  headerRow.forEach((value,c)=>{
    const h=headerNorm(value);
    if(!h) return;
    if(h==='id canonique' || h.includes('id normalise') || h.includes('identifiant normalise')) cols.normalizedId=c;
    else if(h==='id' || h==='identifiant' || h==='identifiant personne' || h==='cle') cols.internalId=c;
    else if(h==='nom tri' || h==='nom de tri' || h==='nom classement' || h==='nom pour le tri') cols.sortName=c;
    else if(h==='nom canonique' || h==='nom affichage' || h==='nom d affichage' || h==='nom complet affiche' || h==='nom usuel') cols.displayName=c;
    else if(h==='prenom source' || h==='prenom' || h==='prenoms' || h==='first name') cols.firstName=c;
    else if(h==='surnom' || h==='surnoms' || h==='nickname') cols.nickname=c;
    else if(h==='nom source' || h==='nom' || h==='nom de famille' || h==='patronyme' || h==='nom complet' || h==='personne' || h==='name') cols.name=c;
    else if(h.includes('variante') || h.includes('alias') || h.includes('autre nom')) cols.aliases=c;
    else if(h==='strate' || h.includes('cercle') || h.includes('groupe')) cols.stratum=c;
    else if(h.includes('fonction dominante') || h==='fonction' || h.includes('profession') || h.includes('activite')) cols.role=c;
    else if(h.includes('type de collaboration') || h==='collaboration') cols.collaborationType=c;
    else if(h.includes('vie privee') || h.includes('lien avec fassbinder') || h.includes('relation avec fassbinder')) cols.relation=c;
    else if(h.includes('role dans') && h.includes('fassbinder')) cols.universeRole=c;
    else if(h.includes('biographie') || h==='bio' || h.includes('presentation')) cols.bio=c;
    else if(h.includes('ids films') && (h.includes('oeuvres de fassbinder') || h.includes('uvres de fassbinder'))) cols.filmographyIds=c;
    else if(h.includes('oeuvres non rapprochees') || h.includes('uvres non rapprochees')) cols.unmatchedWorks=c;
    else if(h.includes('filmographie') || h.includes('films avec') || h.includes('oeuvres de fassbinder') || h.includes('uvres de fassbinder') || h==='oeuvres' || h==='uvres') cols.filmography=c;
    else if(h.includes('image') || h.includes('photo') || h.includes('portrait')) cols.image=c;
    else if(h.includes('source')) cols.source=c;
    else if(h.includes('date') || h.includes('naissance') || h.includes('deces')) cols.dates=c;
    else if(h==='lien' || h.includes('url') || h.includes('notice')) cols.link=c;
  });
  return cols;
}
function naturalPersonName(name){
  const parts=(name||'').split(',').map(x=>x.trim()).filter(Boolean);
  return parts.length===2 ? parts[1]+' '+parts[0] : (name||'').trim();
}

function inferredSortName(sourceName,displayName){
  const commaParts=(sourceName||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(commaParts.length>=2) return commaParts[0];
  return (displayName||sourceName||'').trim();
}

function personSlug(value){
  return headerNorm(value||'personne').replace(/\s+/g,'-') || 'personne';
}

function splitPeopleValues(value){
  return splitCellList(value,{allowPipe:true});
}

function uniqueNonEmpty(values){
  const seen=new Set();
  return values.filter(v=>{
    const key=(v||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('fr');
    if(!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

function joinRichValues(values,separator='<br>'){
  return uniqueNonEmpty(values).join(separator);
}

function parsePeopleWorkbook(buffer){
  const wb=XLSX.read(buffer,{type:'array',cellHTML:true,cellStyles:true});
  const people=[];
  for(const sheetName of wb.SheetNames){
    const ws=wb.Sheets[sheetName];
    const rows=sheetToRows(ws);
    let headerIndex=-1, cols=null;
    for(let r=0;r<Math.min(rows.length,30);r++){
      const candidate=classifyPeopleHeader(rows[r]);
      if(candidate.name!=null || candidate.displayName!=null){ headerIndex=r; cols=candidate; break; }
    }
    if(headerIndex<0) continue;
    if(cols.filmography==null){
      // Compatibilité avec les classeurs dont l’en-tête contient la ligature « Œ ».
      const rawHeader=rows[headerIndex];
      for(let c=0;c<rawHeader.length;c++){
        const label=norm(rawHeader[c]).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
        if(label.includes('oeuvres de fassbinder') || label.includes('uvres de fassbinder')){ cols.filmography=c; break; }
      }
    }
    const offset=rows[headerIndex]._colOffset;
    let currentPerson=null;

    for(let r=headerIndex+1;r<rows.length;r++){
      const row=rows[r];
      const rich=(col)=> col==null ? '' : getCellRichHTML(ws,row._physicalRow,offset+col).trim();
      const plain=(col)=> col==null ? '' : (row[col]||'').toString().trim();
      const rawName=plain(cols.name);
      const rawFirstName=plain(cols.firstName);
      const rawDisplayName=plain(cols.displayName);
      const legacyId=plain(cols.internalId);
      const explicitId=plain(cols.normalizedId) || legacyId;
      const beginsPerson=rawDisplayName || rawName || (explicitId && rawFirstName);

      if(beginsPerson){
        // Structure recommandée du classeur : Nom = nom de famille,
        // Prénom = prénom, Surnom = appellation distincte et facultative.
        // La colonne Nom (affichage), lorsqu’elle existe, reste prioritaire.
        const composedName=[rawFirstName,rawName].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
        const displayName=rawDisplayName || composedName || naturalPersonName(rawName);
        const sortName=plain(cols.sortName) || rawName || inferredSortName(rawName,displayName);
        const nicknames=splitPeopleValues(plain(cols.nickname));
        const explicitAliases=splitPeopleValues(plain(cols.aliases));
        const legacyCommaName=(rawName && rawFirstName) ? rawName+', '+rawFirstName : '';
        currentPerson={
          id:explicitId || ('person-'+personSlug(displayName)+'-'+people.length),
          name:displayName,
          displayName,
          firstName:rawFirstName,
          sortName,
          sourceName:legacyCommaName || rawName || displayName,
          nicknames,
          aliases:[displayName,rawName,legacyCommaName,sortName,legacyId,explicitId,...explicitAliases].filter(Boolean),
          roleValues:[], stratumValues:[], collaborationValues:[], bioValues:[],
          relationValues:[], filmographyValues:[], filmographyIdValues:[], unmatchedWorkValues:[], universeRoleValues:[],
          image:'', sourceValues:[], datesValues:[], link:''
        };
        people.push(currentPerson);
      }

      // Une ligne sans nom prolonge la fiche précédente : les œuvres et les autres
      // informations éventuelles sont donc agrégées automatiquement.
      if(!currentPerson) continue;
      const add=(arr,value)=>{ if(value && value.trim()) arr.push(value.trim()); };
      add(currentPerson.roleValues,plain(cols.role));
      add(currentPerson.stratumValues,plain(cols.stratum));
      add(currentPerson.collaborationValues,rich(cols.collaborationType));
      add(currentPerson.bioValues,rich(cols.bio));
      add(currentPerson.relationValues,rich(cols.relation));
      splitPeopleValues(plain(cols.filmography)).forEach(value=>add(currentPerson.filmographyValues,value));
      splitPeopleValues(plain(cols.filmographyIds)).forEach(value=>add(currentPerson.filmographyIdValues,value));
      splitPeopleValues(plain(cols.unmatchedWorks)).forEach(value=>add(currentPerson.unmatchedWorkValues,value));
      add(currentPerson.universeRoleValues,rich(cols.universeRole));
      add(currentPerson.sourceValues,plain(cols.source));
      add(currentPerson.datesValues,plain(cols.dates));
      if(!currentPerson.image){
        const imageValue=plain(cols.image);
        if(imageValue && !/^#(VALUE|N\/A|REF|NAME|DIV\/0)/i.test(imageValue)) currentPerson.image=resolvePersonImageSrc(imageValue);
      }
      if(!currentPerson.link) currentPerson.link=plain(cols.link);
    }

    if(people.length) break;
  }
  if(!people.length) throw new Error('Aucune colonne « Nom » exploitable, ni aucune personne détectée.');

  return v32NormalizePeople(people.map(person=>({
    id:person.id,
    name:person.name,
    displayName:person.displayName || person.name,
    firstName:person.firstName || '',
    sortName:person.sortName || person.name,
    nicknames:[...new Set(person.nicknames||[])],
    aliases:[...new Set(person.aliases)],
    role:uniqueNonEmpty(person.roleValues).join(' · '),
    stratum:uniqueNonEmpty(person.stratumValues).join(' · '),
    collaborationType:joinRichValues(person.collaborationValues),
    bio:joinRichValues(person.bioValues),
    relation:joinRichValues(person.relationValues),
    filmography:uniqueNonEmpty(person.filmographyValues),
    filmographyIds:uniqueNonEmpty(person.filmographyIdValues),
    unmatchedWorks:uniqueNonEmpty(person.unmatchedWorkValues),
    universeRole:joinRichValues(person.universeRoleValues),
    image:person.image,
    source:uniqueNonEmpty(person.sourceValues).join(' · '),
    dates:uniqueNonEmpty(person.datesValues).join(' · '),
    link:person.link,
    citedYears:[]
  })));
}

function cachePeopleWorkbook(buffer){
  try{ localStorage.setItem(PEOPLE_CACHE_KEY,arrayBufferToBase64(buffer)); }
  catch(err){ console.warn('Cache du tableau entourage impossible.',err); }
}

function applyPeopleWorkbook(buffer,label,save=false){
  CANONICAL_MODEL.people=parsePeopleWorkbook(buffer);
  rebuildPeopleAliasMap();
  rebuildPeopleOccurrences();
  if(save) cachePeopleWorkbook(buffer);
  peopleStatusEl.textContent=label+' — '+CANONICAL_MODEL.people.length+' fiche'+(CANONICAL_MODEL.people.length>1?'s':'')+' détectée'+(CANONICAL_MODEL.people.length>1?'s':'');
  peopleStatusEl.className='people-status ok';
  if(mode==='period') renderRow(CANONICAL_MODEL.timeline.periods[current]); else renderRow(yearList[yearIndex]);
}

async function loadPeopleWorkbook(){
  setStartupProgress(64,'Chargement de l’entourage…','RWF_Entourage.xlsx');
  if(location.protocol==='http:' || location.protocol==='https:'){
    try{
      const url=new URL(PEOPLE_WORKBOOK_FILENAME,location.href); url.searchParams.set('v',Date.now().toString());
      const response=await fetch(url.toString(),{cache:'no-store'});
      if(!response.ok){const error=new Error('introuvable');error.code='PEOPLE_NOT_FOUND';throw error;}
      applyPeopleWorkbook(await response.arrayBuffer(),'RWF_Entourage.xlsx chargé automatiquement'); startupState.people=true; setStartupProgress(92,'Entourage chargé','Préparation de l’index des noms…'); return true;
    }catch(err){
      const missing=err && err.code==='PEOPLE_NOT_FOUND';
      peopleStatusEl.textContent=missing ? 'RWF_Entourage.xlsx non trouvé' : 'RWF_Entourage.xlsx trouvé mais illisible';
      peopleStatusEl.className='people-status err';
      startupState.peopleError=missing ? 'Tableau de l’entourage introuvable' : ('Structure Entourage non reconnue : '+(err?.message||'erreur inconnue'));
    }
  }
  const cached=localStorage.getItem(PEOPLE_CACHE_KEY);
  if(cached){
    try{ applyPeopleWorkbook(base64ToArrayBuffer(cached),'Dernier tableau entourage restauré'); startupState.people=true; return true; }
    catch(err){ localStorage.removeItem(PEOPLE_CACHE_KEY); }
  }
  peopleStatusEl.textContent='RWF_Entourage.xlsx requis pour activer les noms cliquables';
  return false;
}

peopleFileInput.addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file) return;
  peopleStatusEl.textContent='Lecture de l’entourage…'; peopleStatusEl.className='people-status';
  const reader=new FileReader();
  reader.onload=evt=>{
    try{ applyPeopleWorkbook(evt.target.result,'Tableau entourage importé et mémorisé',true); }
    catch(err){ peopleStatusEl.textContent='Erreur : '+err.message; peopleStatusEl.className='people-status err'; }
  };
  reader.readAsArrayBuffer(file);
});


// ---------- BASE DE DONNÉES DES FILMS (V21) ----------

function resolveFilmImageSrc(value){
  if(!value) return '';
  const clean=value.toString().trim().replace(/\\/g,'/');
  if(!clean || /^#(VALUE|N\/A|REF|NAME|DIV\/0)/i.test(clean)) return '';
  if(/^(https?:|data:|blob:|\/|\.\/|\.\.\/)/i.test(clean)) return clean;
  const encoded=clean.split('/').map(part=>encodeURIComponent(part)).join('/');
  return clean.toLocaleLowerCase('fr').startsWith('films_images/') ? encoded : 'Films_images/'+encoded;
}
function inferredFilmPosterPath(title){
  if(!title) return '';
  const filename=title.toString().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,'_')
    .replace(/[<>:"/\\|?*.,;!]+/g,'')
    .trim()
    .replace(/\s+/g,'_')
    .replace(/_+/g,'_');
  return filename ? resolveFilmImageSrc(filename+'.jpg') : '';
}
function splitFilmValues(value){
  return splitCellList(value,{allowPipe:true});
}
function splitFilmIds(value){
  return splitCellList(value,{allowPipe:true});
}
function classifyFilmHeader(headerRow){
  const c={id:null,title:null,original:null,year:null,type:null,duration:null,country:null,director:null,screenplay:null,cinematography:null,editing:null,decor:null,music:null,production:null,cast:null,crew:null,castIds:null,crewIds:null,synopsis:null,excerpts:null,analysis:null,bibliography:null,poster:null,posterLegend:null,posterSource:null,timeline:null,keywords:null,sources:null,status:null};
  headerRow.forEach((value,i)=>{
    const h=headerNorm(value); if(!h) return;
    if(h.includes('id normalise') || h.includes('identifiant normalise')) c.normalizedId=i;
    else if(h==='id'||h==='identifiant') c.id=i;
    else if(h==='titre francais'||h==='titre'||h==='film') c.title=i;
    else if(h.includes('titre original')) c.original=i;
    else if(h==='annee'||h==='date') c.year=i;
    else if(h==='type'||h.includes('format')) c.type=i;
    else if(h.includes('duree')) c.duration=i;
    else if(h==='pays'||h.includes('pays de production')) c.country=i;
    else if(h.includes('realisation')||h==='realisateur') c.director=i;
    else if(h.includes('scenario')) c.screenplay=i;
    else if(h==='image'||h.includes('photographie')||h.includes('direction de la photographie')) c.cinematography=i;
    else if(h.includes('montage')) c.editing=i;
    else if(h.includes('decor')) c.decor=i;
    else if(h.includes('musique')) c.music=i;
    else if(h.includes('production')) c.production=i;
    else if(h.includes('ids entourage') && h.includes('distribution artistique')) c.castIds=i;
    else if(h.includes('ids entourage') && h.includes('equipe technique')) c.crewIds=i;
    else if(h.includes('distribution artistique')||h==='distribution'||h==='interpretes') c.cast=i;
    else if(h.includes('equipe technique')) c.crew=i;
    else if(h.includes('synopsis')||h.includes('resume')) c.synopsis=i;
    else if(h.includes('extrait')) c.excerpts=i;
    else if(h.includes('analyse')) c.analysis=i;
    else if(h.includes('bibliographie')) c.bibliography=i;
    else if(h==='affiche'||h.includes('image affiche')) c.poster=i;
    else if(h.includes('legende affiche')) c.posterLegend=i;
    else if(h.includes('source affiche')) c.posterSource=i;
    else if(h.includes('liens chronologie')||h.includes('lien chronologie')||h.includes('annees frise')) c.timeline=i;
    else if(h.includes('mot cle')) c.keywords=i;
    else if(h==='sources'||h==='source') c.sources=i;
    else if(h==='statut') c.status=i;
  });
  return c;
}
function filmSlug(value){return headerNorm(value||'film').replace(/\s+/g,'-')||'film';}
function parseFilmsWorkbook(buffer){
  const wb=XLSX.read(buffer,{type:'array',cellHTML:true,cellStyles:true});
  for(const sheetName of wb.SheetNames){
    const ws=wb.Sheets[sheetName], rows=sheetToRows(ws);
    let headerIndex=-1,cols=null;
    for(let r=0;r<Math.min(rows.length,30);r++){
      const candidate=classifyFilmHeader(rows[r]);
      if(candidate.title!=null && candidate.year!=null){headerIndex=r;cols=candidate;break;}
    }
    if(headerIndex<0) continue;
    const offset=rows[headerIndex]._colOffset, films=[];
    for(let r=headerIndex+1;r<rows.length;r++){
      const row=rows[r];
      const plain=col=>col==null?'':(row[col]??'').toString().trim();
      const rich=col=>col==null?'':getCellRichHTML(ws,row._physicalRow,offset+col).trim();
      const title=plain(cols.title); if(!title) continue;
      const year=plain(cols.year);
      const posterValue=plain(cols.poster);
      films.push({
        id:plain(cols.normalizedId)||plain(cols.id)||('film-'+filmSlug(title)+'-'+r), title, original:plain(cols.original), year,
        type:plain(cols.type), duration:plain(cols.duration), country:plain(cols.country), director:plain(cols.director),
        screenplay:rich(cols.screenplay), cinematography:rich(cols.cinematography), editing:rich(cols.editing), decor:rich(cols.decor), music:rich(cols.music), production:rich(cols.production),
        cast:splitFilmValues(plain(cols.cast)), crew:splitFilmValues(plain(cols.crew)), castIds:splitFilmIds(plain(cols.castIds)), crewIds:splitFilmIds(plain(cols.crewIds)), synopsis:rich(cols.synopsis),
        excerpts:splitFilmValues(plain(cols.excerpts)), analysis:rich(cols.analysis), bibliography:splitFilmValues(rich(cols.bibliography)),
        poster:resolveFilmImageSrc(posterValue)||inferredFilmPosterPath(title), posterExplicit:Boolean(posterValue), posterLegend:plain(cols.posterLegend), posterSource:plain(cols.posterSource),
        timelineYears:splitFilmValues(plain(cols.timeline)), keywords:splitFilmValues(plain(cols.keywords)), sources:splitFilmValues(plain(cols.sources)), status:plain(cols.status)
      });
    }
    if(films.length) return films;
  }
  throw new Error('Aucune feuille contenant les colonnes « Titre français » et « Année » n’a été trouvée.');
}

function cacheFilmsWorkbook(buffer){try{localStorage.setItem(FILMS_CACHE_KEY,arrayBufferToBase64(buffer));}catch(err){console.warn('Cache des films impossible.',err);}}
function applyFilmsWorkbook(buffer,label,save=false){
  CANONICAL_MODEL.films=parseFilmsWorkbook(buffer);
  if(save) cacheFilmsWorkbook(buffer);
  filmsStatusEl.textContent=label+' — '+CANONICAL_MODEL.films.length+' œuvre'+(CANONICAL_MODEL.films.length>1?'s':'')+' détectée'+(CANONICAL_MODEL.films.length>1?'s':'');
  filmsStatusEl.className='status ok';
  // La chronologie est chargée avant les Films : on la réaffiche pour activer les liens ID.
  if(CANONICAL_MODEL.timeline.periods.length){
    if(mode==='period' && CANONICAL_MODEL.timeline.periods[current]) renderRow(CANONICAL_MODEL.timeline.periods[current]);
    else if(mode==='year' && yearList[yearIndex]) renderRow(yearList[yearIndex]);
  }
}
async function loadFilmsWorkbook(){
  setStartupProgress(93,'Chargement des films…','RWF_Films.xlsx');
  if(location.protocol==='http:'||location.protocol==='https:'){
    try{const url=new URL(FILMS_WORKBOOK_FILENAME,location.href);url.searchParams.set('v',Date.now().toString());const response=await fetch(url.toString(),{cache:'no-store'});if(!response.ok)throw new Error('introuvable');applyFilmsWorkbook(await response.arrayBuffer(),'RWF_Films.xlsx chargé automatiquement');startupState.films=true;setStartupProgress(98,'Films chargés','Préparation de la base documentaire…');return true;}
    catch(err){filmsStatusEl.textContent='RWF_Films.xlsx non chargé';filmsStatusEl.className='status err';startupState.filmsError='Tableau des films introuvable';}
  }
  const cached=localStorage.getItem(FILMS_CACHE_KEY);if(cached){try{applyFilmsWorkbook(base64ToArrayBuffer(cached),'Dernier tableau de films restauré');startupState.films=true;return true;}catch(err){localStorage.removeItem(FILMS_CACHE_KEY);}}
  return false;
}
filmsFileInput.addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=evt=>{try{applyFilmsWorkbook(evt.target.result,'Tableau de films importé et mémorisé',true);}catch(err){filmsStatusEl.textContent='Erreur : '+err.message;filmsStatusEl.className='status err';}};reader.readAsArrayBuffer(file);});

parseLinksCell=function(ws,r,c,cellText){
  const cell=ws[XLSX.utils.encode_cell({r,c})];
  const nativeUrl=(cell&&cell.l&&cell.l.Target)?cell.l.Target.trim():'';
  const chunks=splitCellList(cellText);
  if(!chunks.length){if(!nativeUrl)return[];const kind=classifyLinkKind(nativeUrl);return[{url:nativeUrl,kind,customLabel:false,label:defaultLinkLabel(kind,0,1)}]}
  const links=[];
  chunks.forEach((chunk,i)=>{const pipe=chunk.indexOf('|');let label='',url='';if(pipe>-1){label=chunk.slice(0,pipe).trim();url=chunk.slice(pipe+1).trim()}else if(/^(https?:\/\/|www\.)/i.test(chunk)){url=chunk}else if(i===0&&nativeUrl){label=chunk;url=nativeUrl}else{console.warn('Lien non identifié : « '+chunk+' ». Utilisez « Libellé|https://adresse ».');return}if(/^www\./i.test(url))url='https://'+url;if(!url)return;const kind=classifyLinkKind(url);links.push({url,kind,customLabel:Boolean(label),label:label||defaultLinkLabel(kind,links.length,chunks.length)})});
  return links;
};

window.FassbinderModel = CANONICAL_MODEL;
