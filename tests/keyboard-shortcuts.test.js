const fs=require('fs');
const vm=require('vm');

function assert(condition,message){
  if(!condition)throw new Error(message);
}

const listeners={};
const classes=new Set();
const maintenancePanel={open:false};
const validationSummary={
  focused:false,
  scrolled:false,
  setAttribute(){},
  scrollIntoView(){this.scrolled=true;},
  focus(){this.focused=true;}
};
const document={
  body:{
    classList:{
      add:value=>classes.add(value),
      remove:value=>classes.delete(value),
      contains:value=>classes.has(value)
    }
  },
  querySelector(selector){
    if(selector==='.maintenance-panel')return maintenancePanel;
    if(selector==='.validation-summary')return validationSummary;
    return null;
  },
  addEventListener(type,callback){listeners[type]=callback;}
};
const source=fs.readFileSync('assets/js/app.js','utf8').split('(function(){')[0];
vm.runInNewContext(source,{
  document,
  location:{search:''},
  URLSearchParams,
  requestAnimationFrame:callback=>callback()
});

function keyboardEvent(overrides){
  return {
    key:'',
    code:'',
    ctrlKey:false,
    metaKey:false,
    altKey:false,
    prevented:false,
    preventDefault(){this.prevented=true;},
    ...overrides
  };
}

const controlOptionN=keyboardEvent({key:'˜',code:'KeyN',ctrlKey:true,altKey:true});
listeners.keydown(controlOptionN);
assert(controlOptionN.prevented,'Ctrl + Alt + N doit neutraliser le raccourci natif.');
assert(maintenancePanel.open,'Ctrl + Alt + N doit déplier le panneau de maintenance.');
assert(classes.has('v31-maintenance-open'),'Ctrl + Alt + N doit afficher le panneau de maintenance.');
assert(validationSummary.scrolled&&validationSummary.focused,'Ctrl + Alt + N doit atteindre le rapport de normalisation.');

classes.clear();
maintenancePanel.open=false;
validationSummary.focused=false;
validationSummary.scrolled=false;
const commandOptionN=keyboardEvent({key:'n',code:'KeyN',metaKey:true,altKey:true});
listeners.keydown(commandOptionN);
assert(commandOptionN.prevented,'Commande + Option + N doit être reconnu sur Mac.');
assert(maintenancePanel.open&&classes.has('v31-maintenance-open'),'Commande + Option + N doit ouvrir le rapport.');

console.log('Raccourcis de maintenance : 2 combinaisons testées avec succès.');
