(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function clone(o){return o==null?o:JSON.parse(JSON.stringify(o))}
function uid(p){return p+Math.random().toString(36).slice(2,9)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}

var KINDS={map:'Mappa con segnaposto',ladder:'Gerarchia a gradini',people:'Personaggi con ritratto',cards:'Schede in griglia'};
var LT={
  governo:{label:'Governo',c:'--brass'},
  industria:{label:'Fonderie e industria',c:'--ember'},
  residenza:{label:'Abitazioni e botteghe',c:'--stone'},
  sapere:{label:'Sapere e memoria',c:'--cool'},
  sacro:{label:'Luogo sacro / rituale',c:'--holy'},
  ingresso:{label:'Ingresso / passaggio',c:'--stone'},
  pericolo:{label:'Pericolo',c:'--lava'}
};
var IC={
  governo:'<path d="M12 2 5 6v2h14V6zM6 9h2v8H6zm5 0h2v8h-2zm5 0h2v8h-2zM4 18h16v3H4z" fill="currentColor"/>',
  industria:'<path d="M3 21V10l5 3V10l5 3V5h3l1 4h1l1-6h2v18z" fill="currentColor"/>',
  residenza:'<path d="M12 3 3 11h3v10h4.5v-6h3v6H18V11h3z" fill="currentColor"/>',
  sapere:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zm16 0h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" fill="currentColor"/>',
  sacro:'<path d="M12 2c.8 3.4 5.2 6.1 5.2 11.1a5.2 5.2 0 0 1-10.4 0c0-2.2 1-3.8 2.2-5 .1 1.6.7 2.7 1.8 3.3C10.3 8.6 10.8 5 12 2z" fill="currentColor"/>',
  ingresso:'<path d="M5 21V11a7 7 0 0 1 14 0v10h-4v-9a3 3 0 0 0-6 0v9z" fill="currentColor"/>',
  pericolo:'<path d="M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>'
};
var EYE_OFF='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3.2 3.7M6.6 6.6C4.2 8.2 3 12 3 12s4 6 9 6a9 9 0 0 0 4.1-1"/></svg>';
var EYE='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
function icon(type,px){var T=LT[type]||LT.governo;return '<svg viewBox="0 0 24 24" width="'+px+'" height="'+px+'" aria-hidden="true" style="color:var('+T.c+')">'+(IC[type]||IC.governo)+'</svg>'}

var app=$('#app');
var S={meta:null,data:{}};
var ASSETS=null,ISOWNER=false,loaded=false,loadErr='';
var edit=false,preview=false,tab=null,sel={},armed=null,filter=null,newKind='cards';
var TM={},chain={},infl=0,stMsg='',stErr=false,uploading=false,photoTarget=null,drag=null;
try{var sv=JSON.parse(lsGet('zk-sel')||'{}');if(sv&&typeof sv==='object')sel=sv}catch(e){}

/* ---------- vista giocatori (proiezione) ---------- */
var META_F=['title','subtitle','tagline','city','cityText','motto'];
function pubMeta(m){
  var o={};META_F.forEach(function(k){o[k]=m[k]||''});
  o.tabs=(m.tabs||[]).filter(function(t){return t.vis!==false}).map(function(t){return {id:t.id,name:t.name||'',kind:t.kind,intro:t.intro||'',map:t.map||null}});
  return o;
}
function pubItems(a){
  return (a||[]).filter(function(it){return it.vis!==false}).map(function(it){
    var o=clone(it);delete o.notes;delete o.vis;if(!o.secretVis)delete o.secret;delete o.secretVis;return o;
  });
}
function project(s){
  if(!s.meta)return s;
  var m=pubMeta(s.meta),d={};
  m.tabs.forEach(function(t){d[t.id]=pubItems(s.data[t.id])});
  return {meta:m,data:d};
}
function V(){return (ISOWNER&&preview)?project(S):S}
function own(){return ISOWNER&&!preview}
function canEdit(){return own()&&edit}
function norm(s){
  if(!s.meta)return s;
  s.meta.tabs=Array.isArray(s.meta.tabs)?s.meta.tabs:[];
  s.meta.tabs.forEach(function(t){if(!Array.isArray(s.data[t.id]))s.data[t.id]=[]});
  return s;
}
function tabById(id){var v=V();if(!v.meta)return null;for(var i=0;i<v.meta.tabs.length;i++)if(v.meta.tabs[i].id===id)return v.meta.tabs[i];return null}
function itemById(tid,id){var a=V().data[tid]||[];for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
function mTab(id){for(var i=0;i<S.meta.tabs.length;i++)if(S.meta.tabs[i].id===id)return S.meta.tabs[i];return null}
function mItem(tid,id){var a=S.data[tid]||[];for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}

/* ---------- salvataggio (solo il Master, con password) ---------- */
var MODE=window.ZK_MODE==='master'?'master':'player';
function sGet(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function sSet(k,v){try{if(v==null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){}}
var KEY=sGet('zk-key')||'',saving=false,again=false,lastPub='';
function api(path,opt){opt=opt||{};opt.headers=Object.assign({'x-master-key':KEY},opt.headers||{});opt.cache='no-store';return fetch(path,opt)}
function status(t,err){stMsg=t;stErr=!!err;renderBar()}
function saveAll(now){
  if(!ISOWNER||!S.meta)return;
  clearTimeout(TM.all);
  if(!now){TM.all=setTimeout(function(){delete TM.all;saveAll(true)},800);stErr=false;status('Modifiche in attesa di salvataggio...');return}
  delete TM.all;
  if(saving){again=true;return}
  saving=true;status('Salvataggio in corso...');
  api('/zk-api/master/data',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(S)}).then(function(r){
    if(r.status===401){sSet('zk-key',null);throw {code:'auth'}}
    if(r.status===413)throw {code:'big'};
    if(!r.ok)throw {code:'http'};
    saving=false;
    if(again){again=false;saveAll(true);return}
    if(!TM.all)status('Tutto salvato sul sito.');
  }).catch(function(e){
    saving=false;again=false;
    status(e&&e.code==='auth'?'Sessione scaduta: ricarica la pagina e rientra con la password. Le ultime modifiche non sono salvate.':e&&e.code==='big'?'Troppi contenuti per un solo salvataggio: riduci le immagini o i testi.':'Salvataggio non riuscito. Riprova tra poco (la modifica successiva ritenta).',true);
  });
}
function saveMeta(now){saveAll(now)}
function saveTab(id,now){saveAll(now)}
function dropTab(id){saveAll(true)}
window.addEventListener('beforeunload',function(e){if(TM.all||saving){e.preventDefault();e.returnValue=''}});

/* ---------- caricamento ---------- */
function showLogin(text){
  app.innerHTML='<div class="center"><h1>Zhar-Khazad</h1><p>Area riservata al Master.</p><form id="lg" class="fld" style="text-align:left;max-width:340px;margin:24px auto 0"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required><p style="color:#ffb08a;margin:6px 0 0">'+esc(text||'')+'</p><p style="margin-top:12px"><button class="btn pri" type="submit">Entra</button></p></form></div>';
  $('#lg').addEventListener('submit',function(e){e.preventDefault();KEY=$('#pw').value;sSet('zk-key',KEY);init()});
  var p=$('#pw');if(p)p.focus();
}
function init(){
  if(MODE==='master'){
    if(!KEY){showLogin('');return}
    api('/zk-api/master/data').then(function(r){
      if(r.status===401){sSet('zk-key',null);KEY='';showLogin('Password errata.');return null}
      if(r.status===503){showLogin('Sul sito manca la variabile MASTER_PASSWORD (Netlify → Site configuration → Environment variables).');return null}
      if(!r.ok)throw new Error('http');
      return r.json();
    }).then(function(d){
      if(!d)return;
      ISOWNER=true;loaded=true;S=norm({meta:d.meta,data:d.data||{}});
      ASSETS={upload:function(b){return api('/zk-api/upload',{method:'POST',headers:{'content-type':b.type||'image/jpeg'},body:b}).then(function(r){if(!r.ok)throw {code:r.status===401?'auth':'http'};return r.json()})}};
      render();
    }).catch(function(){loaded=true;loadErr='Non riesco a contattare il server. Riprova tra poco.';render()});
    return;
  }
  function pull(){
    return fetch('/zk-api/public',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('http');return r.text()}).then(function(t){
      loaded=true;loadErr='';
      if(t===lastPub)return;
      var ae=document.activeElement;if(lastPub&&ae&&app.contains(ae)&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;
      lastPub=t;var d=JSON.parse(t);S=norm({meta:d.meta||null,data:d.data||{}});render();
    });
  }
  pull().catch(function(){loaded=true;loadErr='Non riesco a contattare il server. Riprova tra poco.';render()});
  setInterval(function(){if(!document.hidden)pull().catch(function(){})},15000);
}

/* ---------- foto ---------- */
function photoSrc(p){return p?(p.url||(p.id?'/_blob/'+p.id:'')):''}
function photoImg(it,cls){var s=photoSrc(it.photo);return s?'<img class="'+(cls||'ph')+'" src="'+esc(s)+'" alt="'+esc(it.name||'')+'" loading="lazy">':''}
function photoField(tid,it){
  if(!ASSETS&&!photoSrc(it.photo))return '';
  var has=!!photoSrc(it.photo);
  return '<div class="fld"><span class="fl">Immagine</span>'+photoImg(it)+(ASSETS?'<div class="ctl"><button class="btn small" data-act="photo" data-t="'+tid+'" data-id="'+it.id+'"'+(uploading?' disabled':'')+'>'+(uploading?'Caricamento...':(has?'Cambia immagine':'Aggiungi immagine'))+'</button>'+(has?'<button class="btn small danger" data-act="rmphoto" data-t="'+tid+'" data-id="'+it.id+'">Rimuovi</button>':'')+'</div>':'')+'</div>';
}
function prep(file){
  if(!window.createImageBitmap)return Promise.resolve(file);
  return createImageBitmap(file).then(function(bmp){
    var k=Math.min(1,1800/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(bmp.width*k));c.height=Math.max(1,Math.round(bmp.height*k));
    var g=c.getContext('2d');g.fillStyle='#1e120d';g.fillRect(0,0,c.width,c.height);g.drawImage(bmp,0,0,c.width,c.height);
    return new Promise(function(res){c.toBlob(function(b){res(b||file)},'image/jpeg',0.88)});
  }).catch(function(){return file});
}
var fin=document.createElement('input');
fin.type='file';fin.accept='image/*';fin.hidden=true;fin.setAttribute('aria-label','Scegli un\'immagine');
document.body.appendChild(fin);
fin.addEventListener('change',function(){
  var f=fin.files&&fin.files[0],t=photoTarget;
  if(!f||!t||!ASSETS)return;
  if(!/^image\//.test(f.type)){status('Scegli un file immagine.',true);return}
  uploading=true;render();status('Caricamento immagine...');
  prep(f).then(function(b){return ASSETS.upload(b)}).then(function(r){
    uploading=false;var p={id:r.id,url:r.url};
    if(t.map){var tb=mTab(t.tid);if(tb){tb.map=p;saveMeta(true)}}
    else{var it=mItem(t.tid,t.id);if(it){it.photo=p;saveTab(t.tid,true)}}
    render();
  }).catch(function(e){
    uploading=false;render();status('Caricamento non riuscito'+(e&&e.code==='rate_limited'?': troppe richieste, riprova tra poco.':'. Riprova.'),true);
  });
});

/* ---------- pezzi comuni ---------- */
function visCtl(tid,it){
  if(!own())return '';
  var on=it.vis!==false;
  return '<div class="visrow"><span class="badge '+(on?'on':'off')+'">'+(on?EYE+'Visibile ai PG':EYE_OFF+'Nascosto ai PG')+'</span><button class="btn small'+(on?'':' pri')+'" data-act="vis" data-t="'+tid+'" data-id="'+it.id+'">'+(on?'Nascondi ai PG':'Rivela ai PG')+'</button></div>';
}
function hidCls(it){return own()&&it.vis===false?' hid-item':''}
function secretHtml(tid,it){
  if(!it.secret)return '';
  if(own()){
    var r=!!it.secretVis;
    return '<div class="secret'+(r?' rev':'')+'"><div class="sh"><span>Segreto · '+(r?'rivelato ai PG':'solo per te')+'</span><button class="btn small'+(r?'':' pri')+'" data-act="svis" data-t="'+tid+'" data-id="'+it.id+'">'+(r?'Nascondi':'Rivela')+'</button></div><p>'+esc(it.secret)+'</p></div>';
  }
  return '<div class="secret rev"><div class="sh"><span>Scoperto</span></div><p>'+esc(it.secret)+'</p></div>';
}
function notesHtml(it){return own()&&it.notes?'<div class="mnote"><h4>Note del Master · mai visibili ai PG</h4><p>'+esc(it.notes)+'</p></div>':''}
var FIELDS={
  map:[['name','Nome','in'],['sub','Funzione','in'],['type','Tipo','sel'],['text','Descrizione','ta']],
  ladder:[['name','Nome','in'],['sub','Sottotitolo','in'],['text','Descrizione','ta']],
  cards:[['name','Titolo','in'],['sub','Sottotitolo','in'],['text','Testo','ta']],
  people:[['sub','Incudine / casata','in'],['name','Nome','in'],['role','Ruolo','in'],['age','Età','in'],['domain','Dominio','in'],['text','Descrizione','ta'],['motto','Motto','in']]
};
function formHtml(t,it,i,n){
  var b='i|'+t.id+'|'+it.id+'|',q=it.id,h='';
  (FIELDS[t.kind]||FIELDS.cards).forEach(function(f){
    var k=f[0],id='f-'+k+'-'+q,v=it[k]==null?'':it[k];
    if(f[2]==='ta')h+='<div class="fld"><label for="'+id+'">'+f[1]+'</label><textarea id="'+id+'" rows="4" data-b="'+b+k+'">'+esc(v)+'</textarea></div>';
    else if(f[2]==='sel')h+='<div class="fld"><label for="'+id+'">'+f[1]+'</label><select id="'+id+'" data-b="'+b+k+'">'+Object.keys(LT).map(function(x){return '<option value="'+x+'"'+(x===it.type?' selected':'')+'>'+LT[x].label+'</option>'}).join('')+'</select></div>';
    else h+='<div class="fld"><label for="'+id+'">'+f[1]+'</label><input id="'+id+'" data-b="'+b+k+'" value="'+esc(v)+'"></div>';
  });
  var r=!!it.secretVis;
  h+='<div class="fld sec"><label for="f-sec-'+q+'">Segreto rivelabile · '+(r?'rivelato ai PG':'solo per te')+'</label><textarea id="f-sec-'+q+'" rows="3" data-b="'+b+'secret" placeholder="Una verità che i PG possono scoprire più avanti">'+esc(it.secret)+'</textarea>'+
     '<div class="ctl" style="margin-top:4px"><button class="btn small'+(r?'':' pri')+'" data-act="svis" data-t="'+t.id+'" data-id="'+it.id+'">'+(r?'Nascondi il segreto':'Rivela il segreto')+'</button></div></div>';
  h+='<div class="fld mn"><label for="f-not-'+q+'">Note del Master · mai visibili ai PG</label><textarea id="f-not-'+q+'" rows="3" data-b="'+b+'notes" placeholder="Agganci, PNG, statistiche, trappole...">'+esc(it.notes)+'</textarea></div>';
  h+=photoField(t.id,it);
  if(t.kind==='map')h+='<p class="hint">Trascina il segnaposto sulla mappa per spostarlo.</p>';
  h+='<div class="ctl">'+(t.kind!=='map'?'<button class="btn small" data-act="mv" data-t="'+t.id+'" data-id="'+it.id+'" data-d="-1"'+(i===0?' disabled':'')+'>Su</button><button class="btn small" data-act="mv" data-t="'+t.id+'" data-id="'+it.id+'" data-d="1"'+(i===n-1?' disabled':'')+'>Giù</button>':'')+
     '<button class="btn small danger" data-act="del" data-t="'+t.id+'" data-id="'+it.id+'">'+(armed==='i:'+it.id?'Conferma eliminazione':'Elimina')+'</button></div>';
  return h;
}
function addBtn(t,label){return canEdit()?'<p style="margin-top:16px"><button class="btn" data-act="add" data-t="'+t.id+'">'+label+'</button> <span class="hint">Le nuove voci nascono nascoste ai PG.</span></p>':''}

/* ---------- tipi di scheda ---------- */
function mapView(t,items){
  var s=null;
  for(var i=0;i<items.length;i++)if(items[i].id===sel[t.id])s=items[i];
  if(!s&&items.length)s=items[0];
  var src=photoSrc(t.map);
  var pins=items.map(function(it){
    var T=LT[it.type]||LT.governo,on=s&&s.id===it.id;
    return '<button class="cpin'+(on?' on':'')+(own()&&it.vis===false?' hid':'')+(filter&&filter!==it.type?' dim':'')+'" data-act="sel" data-t="'+t.id+'" data-id="'+it.id+'" style="left:'+(+it.x||50)+'%;top:'+(+it.y||50)+'%;color:var('+T.c+')" aria-label="'+esc(it.name)+'" title="'+esc(it.name)+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+(IC[it.type]||IC.governo)+'</svg>'+(on?'<span class="plab">'+esc(it.name)+'</span>':'')+'</button>';
  }).join('');
  var fig='<figure class="cmap'+(canEdit()?' editing':'')+'"><div class="cmi" id="cmi" data-t="'+t.id+'">'+(src?'<img src="'+esc(src)+'" alt="Mappa: '+esc(t.name)+'" draggable="false">':'<div class="cmap-empty">'+(canEdit()?'Carica la mappa con il pulsante qui sotto.':'Nessuna mappa caricata.')+'</div>')+pins+'</div></figure>';
  if(canEdit()&&ASSETS)fig+='<div class="ctl"><button class="btn small" data-act="mapimg" data-t="'+t.id+'"'+(uploading?' disabled':'')+'>'+(src?'Cambia immagine della mappa':'Carica immagine della mappa')+'</button></div>';
  var legend='<div class="legend">'+Object.keys(LT).filter(function(k){return items.some(function(x){return x.type===k})}).map(function(k){
    var c=items.filter(function(x){return x.type===k}).length;
    return '<button class="lg" data-act="filter" data-id="'+k+'" aria-pressed="'+(filter===k)+'">'+icon(k,16)+esc(LT[k].label)+' <span class="n">'+c+'</span></button>';
  }).join('')+'</div>';
  var det;
  if(!s)det='<article class="parch"><p class="tx">Nessun luogo registrato.</p></article>';
  else if(canEdit())det='<article class="parch'+hidCls(s)+'">'+visCtl(t.id,s)+'<p class="hk">Modifica luogo</p>'+formHtml(t,s,items.indexOf(s),items.length)+'</article>';
  else{
    var T=LT[s.type]||LT.governo;
    det='<article class="parch'+hidCls(s)+'">'+visCtl(t.id,s)+photoImg(s)+'<p class="hk">'+esc(T.label)+(s.sub?' · '+esc(s.sub):'')+'</p><h2>'+esc(s.name)+'</h2>'+(s.text?'<p class="tx">'+esc(s.text)+'</p>':'')+secretHtml(t.id,s)+notesHtml(s)+'</article>';
  }
  var list='<ul class="plist">'+items.map(function(it){
    return '<li><button class="'+(s&&s.id===it.id?'on':'')+(own()&&it.vis===false?' hid':'')+'" data-act="sel" data-t="'+t.id+'" data-id="'+it.id+'">'+icon(it.type,15)+esc(it.name)+'</button></li>';
  }).join('')+'</ul>';
  return '<div class="mapgrid"><div>'+fig+legend+list+addBtn(t,'Aggiungi un luogo')+'</div><aside class="side">'+det+'</aside></div>';
}
function cardView(t,it,i,n){
  if(canEdit())return '<div class="card'+hidCls(it)+'">'+visCtl(t.id,it)+formHtml(t,it,i,n)+'</div>';
  return '<div class="card'+hidCls(it)+'">'+visCtl(t.id,it)+photoImg(it)+(it.sub?'<p class="hk">'+esc(it.sub)+'</p>':'')+'<h3>'+esc(it.name)+'</h3>'+(it.text?'<p class="tx">'+esc(it.text)+'</p>':'')+secretHtml(t.id,it)+notesHtml(it)+'</div>';
}
function ladderView(t,items){
  return (items.length?'<ol class="ladder">'+items.map(function(it,i){return '<li class="tier">'+cardView(t,it,i,items.length)+'</li>'}).join('')+'</ol>':emptyList())+addBtn(t,'Aggiungi un gradino');
}
function cardsView(t,items){
  return (items.length?'<ul class="grid">'+items.map(function(it,i){return '<li>'+cardView(t,it,i,items.length)+'</li>'}).join('')+'</ul>':emptyList())+addBtn(t,'Aggiungi una scheda');
}
function peopleView(t,items){
  var h=items.map(function(it,i){
    if(canEdit())return '<li><div class="card'+hidCls(it)+'">'+visCtl(t.id,it)+formHtml(t,it,i,items.length)+'</div></li>';
    var img=photoImg(it,'pt')||'<div class="pt empty" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor">'+IC.sacro+'</svg></div>';
    var meta=[it.role,it.age?it.age+' anni':''].filter(Boolean).join(' · ');
    return '<li><article class="house'+hidCls(it)+'">'+img+'<div>'+visCtl(t.id,it)+(it.sub?'<p class="hk">'+esc(it.sub)+'</p>':'')+'<h3>'+esc(it.name)+'</h3>'+(meta?'<p class="hr">'+esc(meta)+'</p>':'')+
      (it.domain?'<p class="dom"><span>Dominio</span>'+esc(it.domain)+'</p>':'')+(it.text?'<p class="tx">'+esc(it.text)+'</p>':'')+(it.motto?'<p class="motto">«'+esc(it.motto)+'»</p>':'')+secretHtml(t.id,it)+notesHtml(it)+'</div></article></li>';
  }).join('');
  return (items.length?'<ul class="people">'+h+'</ul>':emptyList())+addBtn(t,'Aggiungi un personaggio');
}
function emptyList(){return '<p class="empty-msg">'+(canEdit()?'Ancora vuota: aggiungi la prima voce.':own()?'Ancora vuota. Premi Modifica per aggiungere contenuti.':'Non c\'è ancora nulla da vedere qui.')+'</p>'}

function tabHead(t,idx,n){
  var h='';
  if(own()){
    var on=t.vis!==false;
    h+='<div class="tabvis"><span class="badge '+(on?'on':'off')+'">'+(on?EYE+'Scheda visibile ai PG':EYE_OFF+'Scheda nascosta ai PG')+'</span><span class="t">'+(on?'I PG vedono questa scheda e le voci segnate come visibili.':'I PG non vedono questa scheda, né nulla al suo interno.')+'</span><button class="btn small'+(on?'':' pri')+'" data-act="tvis" data-id="'+t.id+'">'+(on?'Nascondi la scheda':'Rivela la scheda')+'</button></div>';
  }
  if(canEdit()){
    h+='<div class="tabadmin"><div class="fld" style="flex:1;min-width:200px"><label for="tn">Nome della scheda</label><input id="tn" data-b="t|'+t.id+'|name" value="'+esc(t.name)+'"></div>'+
      '<button class="btn small" data-act="mvtab" data-id="'+t.id+'" data-d="-1"'+(idx===0?' disabled':'')+'>Sposta a sinistra</button><button class="btn small" data-act="mvtab" data-id="'+t.id+'" data-d="1"'+(idx===n-1?' disabled':'')+'>Sposta a destra</button>'+
      '<button class="btn small danger" data-act="deltab" data-id="'+t.id+'">'+(armed==='t:'+t.id?'Conferma: elimina scheda e contenuti':'Elimina scheda')+'</button></div>'+
      '<div class="fld" style="max-width:760px"><label for="ti">Introduzione</label><textarea id="ti" rows="3" data-b="t|'+t.id+'|intro">'+esc(t.intro)+'</textarea></div>';
  }else{
    h+='<h2 class="sech">'+esc(t.name)+'</h2>'+(t.intro?'<p class="lead">'+esc(t.intro)+'</p>':'');
  }
  return h;
}

/* ---------- struttura ---------- */
function headerHtml(m){
  if(canEdit())return '<header class="hdr"><div class="stack fld" style="margin:0"><input aria-label="Titolo" data-b="m||title" value="'+esc(m.title)+'" style="font-family:var(--f-display);font-size:1.7rem;color:var(--brass);font-weight:700"><input aria-label="Sottotitolo" data-b="m||subtitle" value="'+esc(m.subtitle)+'"><textarea aria-label="Frase di apertura" rows="2" data-b="m||tagline">'+esc(m.tagline)+'</textarea></div>'+
    '<div class="stack fld" style="margin:0"><input aria-label="Nome della città" data-b="m||city" value="'+esc(m.city)+'"><textarea aria-label="Descrizione breve" rows="3" data-b="m||cityText">'+esc(m.cityText)+'</textarea></div></header>';
  return '<header class="hdr"><div><h1>'+esc(m.title)+'</h1>'+(m.subtitle?'<div class="sub">'+esc(m.subtitle)+'</div>':'')+(m.tagline?'<p class="tag">'+esc(m.tagline)+'</p>':'')+'</div>'+(m.city||m.cityText?'<div class="city"><h2>'+esc(m.city)+'</h2><p>'+esc(m.cityText)+'</p></div>':'')+'</header>';
}
function tabsHtml(tabs){
  var h='<nav class="tabs" role="tablist" aria-label="Sezioni">'+tabs.map(function(t){
    var hid=own()&&t.vis===false;
    return '<button class="tab'+(hid?' hid':'')+'" role="tab" aria-selected="'+(tab===t.id)+'" data-act="tab" data-id="'+t.id+'"'+(hid?' title="Nascosta ai PG"':'')+'>'+(hid?EYE_OFF:'')+esc(t.name||'Senza nome')+'</button>';
  }).join('')+'<span class="sp"></span>';
  if(ISOWNER){
    if(!preview)h+='<button class="btn'+(edit?' on':'')+'" data-act="edit" aria-pressed="'+edit+'">'+(edit?'Fine modifica':'Modifica')+'</button>';
    h+='<button class="btn'+(preview?' on':'')+'" data-act="preview" aria-pressed="'+preview+'">'+(preview?'Torna alla vista Master':'Vista giocatori')+'</button>';
    h+='<a class="btn" href="/zhar-khazad/" target="_blank" rel="noopener" style="text-decoration:none">Pagina dei PG ↗</a>';
  }
  return h+'</nav>';
}
function newTabHtml(){
  if(!canEdit())return '';
  return '<div class="tabadmin"><div class="fld"><label for="nk">Nuova scheda di tipo</label><select id="nk" data-nk="1">'+Object.keys(KINDS).map(function(k){return '<option value="'+k+'"'+(k===newKind?' selected':'')+'>'+KINDS[k]+'</option>'}).join('')+'</select></div><button class="btn" data-act="addtab">Aggiungi scheda</button><span class="hint">Le nuove schede nascono nascoste ai PG.</span></div>';
}
function centerHtml(){
  var h='<div class="center"><h1>Zhar-Khazad</h1>';
  if(!loaded)h+='<p>'+esc(loadErr||'Caricamento della città...')+'</p>';
  else if(loadErr)h+='<p>'+esc(loadErr)+'</p>';
  else h+='<p>Il Master non ha ancora rivelato nulla di questa città.</p>';
  return h+'</div>';
}
function render(){
  var y=window.scrollY,v=V();
  if(!v.meta){app.innerHTML=centerHtml()+'<div class="bar" id="bar" hidden></div>';renderBar();return}
  var tabs=v.meta.tabs,idx=-1;
  tabs.forEach(function(t,i){if(t.id===tab)idx=i});
  if(idx<0){var h=location.hash.slice(1);tabs.forEach(function(t,i){if(t.id===h)idx=i});if(idx<0&&tabs.length)idx=0;tab=idx>=0?tabs[idx].id:null}
  var t=idx>=0?tabs[idx]:null,body='';
  if(t){
    var items=v.data[t.id]||[];
    body=tabHead(t,idx,tabs.length)+(t.kind==='map'?mapView(t,items):t.kind==='ladder'?ladderView(t,items):t.kind==='people'?peopleView(t,items):cardsView(t,items));
  }else body='<p class="empty-msg">'+(own()?'Nessuna scheda. Premi Modifica per crearne una.':'Il Master non ha ancora rivelato nulla di questa città.')+'</p>';
  var ban=ISOWNER&&preview?'<div class="banner"><p><b>Vista giocatori.</b> Stai vedendo esattamente ciò che vedono i PG: schede, voci e segreti nascosti non compaiono.</p><button class="btn small" data-act="preview">Torna alla vista Master</button></div>':'';
  app.innerHTML='<div class="wrap">'+headerHtml(v.meta)+tabsHtml(tabs)+ban+newTabHtml()+'<main role="tabpanel">'+body+'</main>'+
    '<footer class="foot">'+(canEdit()?'<div class="fld" style="max-width:420px;margin:0 auto"><label for="mt">Motto</label><input id="mt" data-b="m||motto" value="'+esc(v.meta.motto)+'"></div>':'<p>'+esc(v.meta.motto)+'</p>')+'</footer></div><div class="bar" id="bar" hidden></div>';
  renderBar();
  window.scrollTo(0,y);
}
function renderBar(){
  var b=$('#bar');if(!b)return;
  if(!(canEdit()||(ISOWNER&&stErr))){b.hidden=true;return}
  b.hidden=false;
  b.innerHTML='<div class="in"><span class="st'+(stErr?' err':'')+'" role="status">'+esc(stMsg||'Le modifiche si salvano da sole nel cloud.')+'</span><button class="btn" data-act="edit">Fine modifica</button></div>';
}

/* ---------- azioni ---------- */
function act(el){
  var a=el.getAttribute('data-act'),id=el.getAttribute('data-id'),tid=el.getAttribute('data-t');
  if(a==='tab'){tab=id;filter=null;armed=null;try{history.replaceState(null,'','#'+id)}catch(e){location.hash=id}render();window.scrollTo(0,0);return}
  if(a==='sel'){sel[tid]=id;lsSet('zk-sel',JSON.stringify(sel));render();return}
  if(a==='filter'){filter=filter===id?null:id;render();return}
  if(a==='edit'){edit=!edit;armed=null;render();return}
  if(a==='preview'){preview=!preview;edit=false;armed=null;render();return}
  if(!ISOWNER||preview)return;
  if(a==='tvis'){var tb=mTab(id);if(!tb)return;tb.vis=tb.vis===false;saveMeta(true);saveTab(id,true);render();return}
  if(a==='vis'){var it=mItem(tid,id);if(!it)return;it.vis=it.vis===false;saveTab(tid,true);render();return}
  if(a==='svis'){var si=mItem(tid,id);if(!si)return;si.secretVis=!si.secretVis;saveTab(tid,true);render();return}
  if(!edit)return;
  if(a==='photo'){if(uploading||!ASSETS)return;photoTarget={tid:tid,id:id};fin.value='';fin.click();return}
  if(a==='mapimg'){if(uploading||!ASSETS)return;photoTarget={tid:tid,map:true};fin.value='';fin.click();return}
  if(a==='rmphoto'){var pi=mItem(tid,id);if(pi){pi.photo=null;saveTab(tid,true);render()}return}
  if(a==='add'){
    var t=mTab(tid);if(!t)return;
    var n={id:uid('v'),name:'Nuova voce',sub:'',text:'',secret:'',secretVis:false,notes:'',photo:null,vis:false};
    if(t.kind==='map'){n.name='Nuovo luogo';n.type='governo';n.x=50;n.y=50;sel[tid]=n.id}
    if(t.kind==='people'){n.name='Nuovo personaggio';n.role='';n.age='';n.domain='';n.motto=''}
    S.data[tid].push(n);saveTab(tid,true);render();
    var f=$('#f-name-'+n.id);if(f){f.focus();f.select()}return;
  }
  if(a==='del'){
    if(armed==='i:'+id){S.data[tid]=S.data[tid].filter(function(x){return x.id!==id});armed=null;saveTab(tid,true);render();return}
    armed='i:'+id;render();setTimeout(function(){if(armed==='i:'+id){armed=null;render()}},4000);return;
  }
  if(a==='mv'){
    var arr=S.data[tid],d=+el.getAttribute('data-d'),i=-1;
    arr.forEach(function(x,k){if(x.id===id)i=k});
    var j=i+d;if(i<0||j<0||j>=arr.length)return;
    var tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;saveTab(tid,true);render();return;
  }
  if(a==='addtab'){
    var nt={id:uid('s'),name:'Nuova scheda',kind:newKind,vis:false,intro:'',map:null};
    S.meta.tabs.push(nt);S.data[nt.id]=[];saveMeta(true);saveTab(nt.id,true);tab=nt.id;render();
    var tn=$('#tn');if(tn){tn.focus();tn.select()}return;
  }
  if(a==='deltab'){
    if(armed==='t:'+id){S.meta.tabs=S.meta.tabs.filter(function(x){return x.id!==id});delete S.data[id];armed=null;tab=null;saveMeta(true);dropTab(id);render();return}
    armed='t:'+id;render();setTimeout(function(){if(armed==='t:'+id){armed=null;render()}},4000);return;
  }
  if(a==='mvtab'){
    var ts=S.meta.tabs,dd=+el.getAttribute('data-d'),ii=-1;
    ts.forEach(function(x,k){if(x.id===id)ii=k});
    var jj=ii+dd;if(ii<0||jj<0||jj>=ts.length)return;
    var tt=ts[ii];ts[ii]=ts[jj];ts[jj]=tt;saveMeta(true);render();return;
  }
}
app.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');
  if(!el||!app.contains(el)||el.disabled)return;
  if(drag&&drag.moved)return;
  act(el);
});
app.addEventListener('input',function(e){
  var t=e.target;
  if(t.getAttribute&&t.getAttribute('data-nk')){newKind=t.value;return}
  var b=t.getAttribute&&t.getAttribute('data-b');
  if(!b||!canEdit())return;
  var p=b.split('|'),v=t.value;
  if(p[0]==='m'){S.meta[p[2]]=v;saveMeta();return}
  if(p[0]==='t'){var tb=mTab(p[1]);if(tb){tb[p[2]]=v;saveMeta()}return}
  if(p[0]==='i'){var it=mItem(p[1],p[2]);if(!it)return;it[p[3]]=v;saveTab(p[1]);if(p[3]==='type')render()}
});

/* trascinamento dei segnaposto */
app.addEventListener('pointerdown',function(e){
  if(!canEdit())return;
  var p=e.target.closest('.cpin');if(!p)return;
  var tid=p.getAttribute('data-t'),it=mItem(tid,p.getAttribute('data-id'));if(!it)return;
  drag={tid:tid,it:it,el:p,moved:false,sx:e.clientX,sy:e.clientY};
  try{p.setPointerCapture(e.pointerId)}catch(x){}
});
app.addEventListener('pointermove',function(e){
  if(!drag)return;
  if(!drag.moved&&Math.abs(e.clientX-drag.sx)+Math.abs(e.clientY-drag.sy)<5)return;
  drag.moved=true;
  var box=$('#cmi');if(!box)return;
  var r=box.getBoundingClientRect();
  drag.it.x=Math.round(clamp((e.clientX-r.left)/r.width*100,1,99)*10)/10;
  drag.it.y=Math.round(clamp((e.clientY-r.top)/r.height*100,1,99)*10)/10;
  drag.el.style.left=drag.it.x+'%';drag.el.style.top=drag.it.y+'%';
});
function endDrag(){
  if(!drag)return;
  var d=drag;
  if(d.moved){sel[d.tid]=d.it.id;saveTab(d.tid,true);setTimeout(function(){drag=null;render()},0)}
  else drag=null;
}
app.addEventListener('pointerup',endDrag);
app.addEventListener('pointercancel',endDrag);
window.addEventListener('hashchange',function(){var h=location.hash.slice(1);if(h&&h!==tab){tab=h;render()}});

render();init();
})();
