'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(
  path.join(__dirname,'..','assets','js','normalizer.js'),
  'utf8'
);
const context={window:{},CANONICAL_MODEL:{people:[]}};
vm.createContext(context);
vm.runInContext(source,context);

const split=context.window.FassbinderListReader.split;
const values=(result)=>Array.from(result);

assert.deepEqual(values(split('a; b\nc\r\nd')),['a','b','c','d']);
assert.deepEqual(
  values(split('Titre|https://exemple.test\nAutre|https://deux.test')),
  ['Titre|https://exemple.test','Autre|https://deux.test']
);
assert.deepEqual(values(split('a;b|c\nd',{allowPipe:true})),['a','b','c','d']);
assert.deepEqual(values(split(['a;b','c\nd'],{allowPipe:true})),['a','b','c','d']);
assert.deepEqual(values(split('Nom, Prénom; Autre')),['Nom, Prénom','Autre']);
assert.deepEqual(values(split('Notion A, Notion B',{allowComma:true})),['Notion A','Notion B']);

console.log('Lecteur de listes V3.4 : 6 tests réussis.');
