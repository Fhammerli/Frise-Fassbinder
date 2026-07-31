/* Fassbinder Explorer V3.4 — normalizer.js
 * Normalisation des en-têtes, noms, ligatures, alias et identifiants canoniques.
 * Source fonctionnelle : V3.2-STANDALONE-PREVIEW-FIX.
 */
'use strict';

function norm(s){
  return (s||'').toString()
    .replace(/œ/g,'oe').replace(/Œ/g,'OE')
    .replace(/æ/g,'ae').replace(/Æ/g,'AE')
    .replace(/ß/g,'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .trim().toLowerCase();
}
function headerNorm(s){ return norm(s).replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); }

// Lecteur unique des cellules multi-valeurs.
// Le point-virgule et le retour à la ligne sont toujours reconnus.
// Le caractère | n'est séparateur que pour les champs où cette convention est documentée.
function splitCellList(value,{allowPipe=false,allowComma=false}={}){
  if(Array.isArray(value)) return value.flatMap(item=>splitCellList(item,{allowPipe,allowComma}));
  const text=String(value??'').replace(/\r\n?/g,'\n');
  const separator=allowPipe
    ? (allowComma ? /[;\n|,]/ : /[;\n|]/)
    : (allowComma ? /[;\n,]/ : /[;\n]/);
  return text.split(separator).map(item=>item.trim()).filter(Boolean);
}

window.FassbinderListReader=Object.freeze({
  version:'3.4',
  split:splitCellList
});


// Clé de comparaison stable : accents, apostrophes, tirets, ponctuation et
// ordre « Nom, Prénom » ne doivent pas empêcher de retrouver une personne.
function v32NameKey(value){
  return String(value||'')
    .replace(/^\s*pers[-_:]\s*/i,'')
    .replace(/^person[-_:]\s*/i,'')
    .replace(/\s*,\s*/g,' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/ß/g,'ss').replace(/æ/g,'ae').replace(/œ/g,'oe')
    .replace(/[’‘ʼ‛\u0060´]/g,"'")
    .toLocaleLowerCase('fr')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ').trim();
}

function v32CanonicalId(value){
  const key=v32NameKey(value)||'personne';
  return 'pers-'+key.replace(/\s+/g,'-');
}

function v32NameVariants(person){
  const values=[
    person.id,person.name,person.displayName,person.sourceName,person.sortName,
    ...(person.aliases||[]),...(person.nicknames||[])
  ].filter(Boolean).map(value=>String(value).trim()).filter(Boolean);
  const display=String(person.displayName||person.name||'').trim();
  const first=String(person.firstName||'').trim();
  const family=String(person.sortName||'').trim();
  if(first&&family){
    values.push(first+' '+family,family+' '+first,family+', '+first);
  }else if(display.includes(',')){
    const parts=display.split(',').map(x=>x.trim()).filter(Boolean);
    if(parts.length===2) values.push(parts[1]+' '+parts[0]);
  }
  const seen=new Set();
  return values.filter(value=>{
    const key=v32NameKey(value);
    if(!key||seen.has(key))return false;
    seen.add(key);return true;
  });
}

function v32NormalizePeople(people){
  const idOwners=new Map();
  return (people||[]).map((person,index)=>{
    const explicit=String(person.id||'').trim();
    let id=/^(pers|person)-/i.test(explicit)?explicit:v32CanonicalId(explicit||person.displayName||person.name);
    const base=id;let suffix=2;
    while(idOwners.has(v32NameKey(id))&&idOwners.get(v32NameKey(id))!==index)id=base+'-'+suffix++;
    idOwners.set(v32NameKey(id),index);
    const aliases=v32NameVariants({...person,id});
    return {...person,id,aliases,normalizationKey:v32NameKey(person.displayName||person.name),canonicalId:id};
  });
}

// Le parseur d'origine reste la source des données. Le module 3.2 ne fait
// qu'ajouter le modèle canonique immédiatement après sa lecture.
if(typeof parsePeopleWorkbook==='function'){
  const v31ParsePeopleWorkbook=parsePeopleWorkbook;
  parsePeopleWorkbook=function(buffer){return v32NormalizePeople(v31ParsePeopleWorkbook(buffer));};
}

window.FassbinderNameNormalizer=Object.freeze({
  version:'3.4',
  key:v32NameKey,
  canonicalId:v32CanonicalId,
  normalizePeople:v32NormalizePeople,
  resolve(reference){
    const raw=String(reference||'').trim();
    const key=v32NameKey(raw);
    return CANONICAL_MODEL.people.find(person=>
      person.id===raw || v32NameKey(person.id)===key ||
      v32NameVariants(person).some(alias=>v32NameKey(alias)===key)
    )||null;
  }
});

