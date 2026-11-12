/* Santuario degli Antenati: pagina giocatori (/santuario/) e pagina Master (/santuario/master). */
(function(){
"use strict";
var MODE = window.SA_MODE==="master" ? "master" : "player";
var DEFAULT_MAP = "/santuario/mappa.jpg";
var KINDS = {
  read:"Testo da leggere", text:"Descrizione", combat:"Incontro", trap:"Trappola / Prova",
  spirit:"Spiriti / Magia", secret:"Segreto", loot:"Tesoro", note:"Note"
};
var D = { meta:{ title:"Santuario degli Antenati", subtitle:"", notes:"", masterNotes:"", map:null }, rooms:[] };
var ST = { master:false, preview:false, edit:false, showAll:false, selected:null, loaded:false, loadErr:"" };
var $ = function(id){ return document.getElementById(id); };
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function clone(o){ return o==null?o:JSON.parse(JSON.stringify(o)); }
function uid(p){ return (p||"x")+Math.random().toString(36).slice(2,10); }
function sGet(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function sSet(k,v){ try{ if(v==null) sessionStorage.removeItem(k); else sessionStorage.setItem(k,v); }catch(e){} }

/* ---------- mini markdown ---------- */
function inline(s){ return s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/`(.+?)`/g,"<code>$1</code>"); }
function md(t){
  var lines=esc(t).split(/\r?\n/), out="", list=false, para=[];
  function fp(){ if(para.length){ out+="<p>"+inline(para.join("<br>"))+"</p>"; para=[]; } }
  function fl(){ if(list){ out+="</ul>"; list=false; } }
  lines.forEach(function(ln){
    if(/^\s*[-•]\s+/.test(ln)){ fp(); if(!list){ out+="<ul>"; list=true; } out+="<li>"+inline(ln.replace(/^\s*[-•]\s+/,""))+"</li>"; }
    else if(/^##\s+/.test(ln)){ fp(); fl(); out+="<h4>"+inline(ln.replace(/^##\s+/,""))+"</h4>"; }
    else if(!ln.trim()){ fp(); fl(); }
    else { fl(); para.push(ln); }
  });
  fp(); fl(); return out;
}

/* ---------- vista giocatori (anche per l'anteprima del Master) ---------- */
function project(S){
  var P={ meta:{ title:S.meta.title||"", subtitle:S.meta.subtitle||"", notes:S.meta.notes||"", map:S.meta.map||null }, rooms:[] };
  (S.rooms||[]).forEach(function(r){
    if(!r.revealed) return;
    P.rooms.push({ id:r.id, num:r.num, name:r.name, subtitle:r.subtitle, order:r.order, geo:r.geo, revealed:true,
      images:(r.images||[]).filter(function(i){return i.vis!==false;}),
      sections:(r.sections||[]).filter(function(s){return s.vis!==false;}) });
  });
  return P;
}
function own(){ return ST.master && !ST.preview; }
function editing(){ return own() && ST.edit; }
function V(){ return (ST.master && ST.preview) ? project(D) : D; }
function rooms(){ return V().rooms.slice().sort(function(a,b){ return (a.order==null?999:a.order)-(b.order==null?999:b.order) || String(a.num).localeCompare(String(b.num),undefined,{numeric:true}); }); }
function room(id){ var a=V().rooms; for(var i=0;i<a.length;i++) if(a[i].id===id) return a[i]; return null; }
function mRoom(id){ for(var i=0;i<D.rooms.length;i++) if(D.rooms[i].id===id) return D.rooms[i]; return null; }
function norm(S){
  S.meta=S.meta||{}; S.rooms=Array.isArray(S.rooms)?S.rooms:[];
  S.rooms.forEach(function(r){ r.sections=r.sections||[]; r.images=r.images||[]; r.master=r.master||[]; r.geo=r.geo||{x:42,y:42,w:16,h:12}; });
  return S;
}

/* ---------- salvataggio (solo Master, con password) ---------- */
var KEY = sGet("sa-key") || sGet("zk-key") || "";
var timer=null, saving=false, again=false, stMsg="", stErr=false;
function api(path,opt){ opt=opt||{}; opt.headers=Object.assign({"x-master-key-enc":encodeURIComponent(String(KEY).trim())},opt.headers||{}); opt.cache="no-store"; return fetch(path,opt); }
function status(t,err){ stMsg=t; stErr=!!err; renderStatus(); }
function renderStatus(){
  var el=$("status"); if(!el) return;
  var tx=$("statusTxt");
  el.className="status"+(stErr?" err":saving?" saving":timer?" dirty":ST.loaded?" ok":"");
  tx.textContent=stMsg;
}
function save(now){
  if(!ST.master) return;
  clearTimeout(timer);
  if(!now){ timer=setTimeout(function(){ timer=null; save(true); },800); stErr=false; status("Modifiche in attesa…"); return; }
  timer=null;
  if(saving){ again=true; return; }
  saving=true; status("Salvataggio…");
  api("/sa-api/master/data",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(D)}).then(function(r){
    if(r.status===401){ sSet("sa-key",null); throw {code:"auth"}; }
    if(r.status===413) throw {code:"big"};
    if(!r.ok) throw {code:"http"};
    saving=false;
    if(again){ again=false; save(true); return; }
    if(!timer) status("Salvato sul sito");
  }).catch(function(e){
    saving=false; again=false;
    status(e&&e.code==="auth"?"Sessione scaduta: ricarica e rientra con la password.":e&&e.code==="big"?"Troppi contenuti: riduci immagini o testi.":"Salvataggio non riuscito: riprova (la prossima modifica ritenta).",true);
  });
}
window.addEventListener("beforeunload",function(e){ if(timer||saving){ e.preventDefault(); e.returnValue=""; } });

/* ---------- scheletro pagina ---------- */
var app=$("app");
function shell(){
  app.innerHTML =
  '<header><div class="titles"><h1 id="hTitle"></h1><div class="sub" id="hSub"></div></div>'+
  '<div class="hdrbtns">'+
   (MODE==="master"?'<div class="status" id="status"><span class="dot"></span><span id="statusTxt"></span></div>'+
     '<a class="btn small" href="/santuario/" target="_blank" rel="noopener" title="Apri la pagina dei giocatori">Pagina PG ↗</a>'+
     '<button class="btn" id="prevBtn" title="Guarda la pagina come la vedono i giocatori"></button>'+
     '<button class="btn" id="editBtn"></button>':'')+
  '</div></header>'+
  '<div class="banner" id="banner"></div>'+
  '<main><section class="mapcol"><div class="mapsticky">'+
   '<div class="mapwrap" id="mapwrap"></div>'+
   '<div class="maptools"><button class="btn small" id="toggleAreas">Mostra aree</button><button class="btn small" id="infoBtn">ⓘ Info generali</button>'+
   '<span id="editTools" style="display:none;gap:8px;align-items:center"><button class="btn small primary" id="addRoom">+ Nuova stanza</button><span class="hint">Trascina le aree per spostarle, angolo arancione per ridimensionarle.</span></span></div>'+
   '<div class="chips" id="chips"></div>'+
  '</div></section><section class="panel" id="panel"></section></main>'+
  '<div class="modal" id="modal"><div class="box"><p id="modalTxt"></p><div class="row" style="justify-content:flex-end"><button class="btn" id="modalNo">Annulla</button><button class="btn danger" id="modalYes">Conferma</button></div></div></div>'+
  '<div class="lightbox" id="lightbox"><img id="lightImg" alt=""></div>';
  $("toggleAreas").onclick=function(){ ST.showAll=!ST.showAll; this.classList.toggle("on",ST.showAll); renderMap(); };
  $("infoBtn").onclick=function(){ ST.selected=null; renderMap(); renderChips(); renderPanel(); };
  $("modalNo").onclick=function(){ $("modal").classList.remove("show"); modalCb=null; };
  $("modalYes").onclick=function(){ $("modal").classList.remove("show"); var cb=modalCb; modalCb=null; if(cb) cb(); };
  $("lightbox").onclick=function(){ this.classList.remove("show"); };
  if(MODE==="master"){
    $("prevBtn").onclick=function(){ ST.preview=!ST.preview; if(ST.preview) ST.edit=false; renderAll(); };
    $("editBtn").onclick=function(){ ST.edit=!ST.edit; renderAll(); };
    $("addRoom").onclick=addRoom;
  }
}
var modalCb=null;
function ask(t,cb){ $("modalTxt").textContent=t; modalCb=cb; $("modal").classList.add("show"); }
function banner(t){ var b=$("banner"); if(!b) return; if(t){ b.textContent=t; b.classList.add("show"); } else b.classList.remove("show"); }

function renderHeader(){
  var m=V().meta;
  $("hTitle").textContent=m.title||"Santuario degli Antenati";
  $("hSub").textContent=m.subtitle||"";
  document.title=(m.title||"Santuario degli Antenati")+(MODE==="master"?" · Master":"");
  if(MODE==="master"){
    $("prevBtn").classList.toggle("on",ST.preview);
    $("prevBtn").textContent=ST.preview?"✕ Esci da vista giocatori":"👁 Vista giocatori";
    $("editBtn").style.display=ST.preview?"none":"";
    $("editBtn").classList.toggle("on",ST.edit);
    $("editBtn").textContent=ST.edit?"✓ Fine modifica":"✎ Modifica";
    $("editTools").style.display=editing()?"inline-flex":"none";
  }
}

/* ---------- mappa con nebbia ---------- */
var mapSrc=null;
function renderMap(){
  var wrap=$("mapwrap"), m=V().meta;
  var src=(m.map&&m.map.url)||DEFAULT_MAP;
  if(src!==mapSrc){ mapSrc=src; wrap.innerHTML='<img alt="Mappa" src="'+esc(src)+'">'; }
  Array.prototype.slice.call(wrap.querySelectorAll(".hs,.fog,.darkmsg")).forEach(function(n){ n.remove(); });
  wrap.classList.toggle("edit",editing());
  wrap.classList.toggle("showall",ST.showAll);
  var list=rooms(), revealed=list.filter(function(r){ return r.revealed && r.geo; });
  var holes=revealed.map(function(r){ var g=r.geo; return '<rect x="'+g.x+'" y="'+g.y+'" width="'+g.w+'" height="'+g.h+'" rx="1.2" fill="#000"/>'; }).join("");
  var fog=document.createElementNS("http://www.w3.org/2000/svg","svg");
  fog.setAttribute("class","fog"); fog.setAttribute("viewBox","0 0 100 100"); fog.setAttribute("preserveAspectRatio","none");
  fog.innerHTML='<defs><filter id="fb" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.7"/></filter><mask id="fm"><rect x="0" y="0" width="100" height="100" fill="#fff"/><g filter="url(#fb)">'+holes+'</g></mask></defs><rect x="0" y="0" width="100" height="100" fill="#090706" mask="url(#fm)"/>';
  fog.style.opacity = own() ? (ST.edit?"0.35":"0.6") : "1";
  wrap.appendChild(fog);
  if(!own() && !revealed.length && ST.loaded){ var dm=document.createElement("div"); dm.className="darkmsg"; dm.textContent="Il santuario è avvolto nell'oscurità…"; wrap.appendChild(dm); }
  list.forEach(function(r){
    if(!r.geo) return;
    var hidden=!r.revealed, g=r.geo, d=document.createElement("div");
    d.className="hs"+(ST.selected===r.id?" sel":"")+(hidden?" locked":"");
    d.style.left=g.x+"%"; d.style.top=g.y+"%"; d.style.width=g.w+"%"; d.style.height=g.h+"%";
    d.title=(r.num?r.num+". ":"")+(r.name||"")+(hidden?" (nascosta ai giocatori)":"");
    d.innerHTML='<span class="tag">'+(hidden?"🔒 ":"")+esc(r.num||"")+" "+esc(r.name||"")+'</span><span class="rh"></span>';
    bindHotspot(d,r.id);
    wrap.appendChild(d);
  });
}
function bindHotspot(el,id){
  var st=null;
  el.addEventListener("pointerdown",function(e){
    if(!editing()) return;
    e.preventDefault();
    var g=mRoom(id).geo;
    st={mode:e.target.classList.contains("rh")?"resize":"move",x:e.clientX,y:e.clientY,rect:$("mapwrap").getBoundingClientRect(),g0:clone(g),moved:false};
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove",function(e){
    if(!st) return;
    var dx=(e.clientX-st.x)/st.rect.width*100, dy=(e.clientY-st.y)/st.rect.height*100;
    if(Math.abs(dx)+Math.abs(dy)>0.3) st.moved=true;
    var g=mRoom(id).geo, c=function(v,a,b){ return Math.max(a,Math.min(b,v)); };
    if(st.mode==="move"){ g.x=+c(st.g0.x+dx,0,100-g.w).toFixed(2); g.y=+c(st.g0.y+dy,0,100-g.h).toFixed(2); }
    else { g.w=+c(st.g0.w+dx,2,100-g.x).toFixed(2); g.h=+c(st.g0.h+dy,2,100-g.y).toFixed(2); }
    el.style.left=g.x+"%"; el.style.top=g.y+"%"; el.style.width=g.w+"%"; el.style.height=g.h+"%";
  });
  el.addEventListener("pointerup",function(){
    if(!st) return; var moved=st.moved; st=null;
    if(moved){ save(); renderMap(); } else select(id);
  });
  el.addEventListener("pointercancel",function(){ st=null; });
  el.addEventListener("click",function(){ if(!editing()) select(id); });
}
function renderChips(){
  var c=$("chips"); c.innerHTML="";
  rooms().forEach(function(r){
    var b=document.createElement("button"), hidden=!r.revealed;
    b.className="chip"+(ST.selected===r.id?" sel":"")+(hidden?" locked":"");
    b.innerHTML="<b>"+esc(r.num||"•")+"</b>"+(hidden?"🔒 ":"")+esc(r.name||"Senza nome");
    b.onclick=function(){ select(r.id); };
    c.appendChild(b);
  });
}
function select(id){
  ST.selected=id; renderMap(); renderChips(); renderPanel();
  if(window.innerWidth<980) $("panel").scrollIntoView({behavior:"smooth",block:"start"});
}

/* ---------- pannello stanza ---------- */
function secHtml(s,showVis){
  var hid = showVis && s.vis===false;
  return '<div class="sec k-'+esc(s.kind||"text")+(hid?" pghidden":"")+'"><h3>'+esc(s.title||KINDS[s.kind]||"")+(hid?'<span class="lock-badge">🔒 nascosta ai PG</span>':'')+'</h3><div class="body">'+md(s.body)+'</div></div>';
}
function imgSrc(im){ return im.url || ""; }
function renderPanel(){
  var p=$("panel"), list=rooms(), ids=list.map(function(r){return r.id;});
  if(!ST.selected || ids.indexOf(ST.selected)<0){ ST.selected=null; return renderInfo(p); }
  var id=ST.selected, r=room(id), i=ids.indexOf(id), prev=list[i-1], next=list[i+1];
  var h='<div class="nav"><button class="btn small" '+(prev?"":"disabled")+' id="pv">◂ '+(prev?esc(prev.name):"")+'</button><button class="btn small" '+(next?"":"disabled")+' id="nx">'+(next?esc(next.name):"")+' ▸</button></div>';
  if(own()){
    h+='<div class="revealbar"><span class="pill '+(r.revealed?"vis":"hid")+'">'+(r.revealed?"👁 Visibile ai giocatori":"🔒 Nascosta ai giocatori")+'</span><button class="btn small '+(r.revealed?"":"primary")+'" id="revBtn">'+(r.revealed?"Nascondi di nuovo":"Rivela ai giocatori")+'</button></div>';
  }
  if(!editing()){
    h+='<div class="rhead"><div class="badge">'+esc(r.num||"•")+'</div><div><h2>'+esc(r.name||"Senza nome")+'</h2>'+(r.subtitle?'<div class="rsub">'+esc(r.subtitle)+'</div>':'')+'</div></div>';
    if(r.images&&r.images.length) h+='<div class="gallery">'+r.images.map(function(im){ return '<figure><img src="'+esc(imgSrc(im))+'" alt="" data-zoom="1">'+(im.caption?'<figcaption>'+esc(im.caption)+(own()&&im.vis===false?' · 🔒':'')+'</figcaption>':(own()&&im.vis===false?'<figcaption>🔒 nascosta ai PG</figcaption>':''))+'</figure>'; }).join("")+'</div>';
    var secs=(r.sections||[]).filter(function(s){ return (s.body||"").trim() || own(); });
    secs.forEach(function(s){ h+=secHtml(s,own()); });
    if(!secs.length) h+='<p class="muted">Nessun contenuto.</p>';
    if(own()){
      var mr=mRoom(id);
      h+='<div class="mbox"><div class="mt">🔒 Solo Master</div>';
      h+= mr.master.length ? mr.master.map(function(s){ return secHtml(s,false); }).join("") : '<p class="muted" style="margin:4px 0">Nessuna nota segreta. Premi “Modifica” per scriverne.</p>';
      h+='</div>';
    }
    p.innerHTML=h;
  } else {
    var R=mRoom(id);
    h+='<div class="row"><div style="width:90px"><label class="f">N°</label><input class="t" data-f="num" value="'+esc(R.num)+'"></div><div style="flex:1"><label class="f">Nome stanza</label><input class="t" data-f="name" value="'+esc(R.name)+'"></div></div>'+
      '<label class="f">Sottotitolo</label><input class="t" data-f="subtitle" value="'+esc(R.subtitle)+'">'+
      '<label class="f">Ordine nella lista</label><input class="t" type="number" data-f="order" value="'+esc(R.order==null?"":R.order)+'" style="width:120px">'+
      '<label class="f">Immagini</label><div class="gallery" id="egal"></div>'+
      '<span class="filebtn btn small">＋ Carica immagine<input type="file" accept="image/*" id="upImg" multiple></span>'+
      '<div class="sep"></div><label class="f">Sezioni (togli la spunta “PG” per nasconderne una ai giocatori)</label><div id="esecs"></div>'+
      '<button class="btn small primary" id="addSec">+ Aggiungi sezione</button>'+
      '<div class="mbox"><div class="mt">🔒 Solo Master</div><p class="hint" style="margin:0 0 6px">Queste sezioni non escono mai dal server: i giocatori non possono vederle.</p><div id="emsecs"></div><button class="btn small" id="addMSec">+ Aggiungi sezione segreta</button></div>'+
      '<div class="sep"></div><div class="row" style="justify-content:space-between"><span class="hint">Le modifiche si salvano da sole sul sito.</span><button class="btn danger small" id="delRoom">Elimina stanza</button></div>';
    p.innerHTML=h;
    Array.prototype.forEach.call(p.querySelectorAll("[data-f]"),function(inp){
      inp.addEventListener("input",function(){ var f=inp.dataset.f; R[f]= f==="order" ? (inp.value===""?null:+inp.value) : inp.value; save(); renderChips(); renderMap(); });
    });
    renderEditGallery(R);
    editSections($("esecs"),R,"sections",true);
    editSections($("emsecs"),R,"master",false);
    $("addSec").onclick=function(){ R.sections.push({id:uid("s"),kind:"text",title:"Nuova sezione",body:"",vis:true}); save(); editSections($("esecs"),R,"sections",true); };
    $("addMSec").onclick=function(){ R.master.push({id:uid("m"),kind:"secret",title:"Nota segreta",body:""}); save(); editSections($("emsecs"),R,"master",false); };
    $("delRoom").onclick=function(){ ask("Eliminare la stanza “"+(R.name||"senza nome")+"”? Non si può annullare.",function(){ D.rooms=D.rooms.filter(function(x){ return x.id!==id; }); ST.selected=null; save(true); renderAll(); }); };
    $("upImg").onchange=function(){
      var files=Array.prototype.slice.call(this.files); this.value="";
      var chain=Promise.resolve();
      files.forEach(function(f){ chain=chain.then(function(){ return upload(f).then(function(a){ R.images.push({id:a.id,url:a.url,caption:"",vis:true}); save(true); renderEditGallery(R); }); }); });
      chain.catch(function(){ status("Caricamento immagine non riuscito.",true); });
    };
  }
  if(prev) $("pv").onclick=function(){ select(prev.id); };
  if(next) $("nx").onclick=function(){ select(next.id); };
  var rb=$("revBtn"); if(rb) rb.onclick=function(){ var R=mRoom(id); R.revealed=!R.revealed; save(true); renderAll(); };
  Array.prototype.forEach.call(p.querySelectorAll("img[data-zoom]"),function(im){ im.onclick=function(){ $("lightImg").src=im.src; $("lightbox").classList.add("show"); }; });
}
function renderEditGallery(R){
  var g=$("egal"); if(!g) return; g.innerHTML="";
  R.images.forEach(function(im,i){
    var f=document.createElement("figure");
    f.innerHTML='<img src="'+esc(imgSrc(im))+'" alt=""><div style="padding:4px"><input class="t" placeholder="Didascalia" value="'+esc(im.caption)+'" style="font-size:14px;padding:3px 6px"><label class="vischk"><input type="checkbox" '+(im.vis!==false?"checked":"")+'> PG</label><button class="btn danger small" style="margin-top:4px;width:100%">Rimuovi</button></div>';
    f.querySelector("input.t").oninput=function(e){ im.caption=e.target.value; save(); };
    f.querySelector("input[type=checkbox]").onchange=function(e){ im.vis=e.target.checked; save(); };
    f.querySelector("button").onclick=function(){ R.images.splice(i,1); save(true); renderEditGallery(R); };
    g.appendChild(f);
  });
  if(!R.images.length) g.innerHTML='<span class="hint">Nessuna immagine.</span>';
}
function autoGrow(t){ t.style.height="auto"; t.style.height=Math.min(700,t.scrollHeight+4)+"px"; }
function editSections(box,R,key,withVis){
  if(!box) return;
  var list=R[key]; box.innerHTML="";
  function redo(){ editSections(box,R,key,withVis); }
  list.forEach(function(s,i){
    var d=document.createElement("div"); d.className="esec";
    d.innerHTML='<div class="row"><input class="t" value="'+esc(s.title)+'" placeholder="Titolo sezione">'+
      '<select class="t">'+Object.keys(KINDS).map(function(k){ return '<option value="'+k+'" '+(s.kind===k?"selected":"")+'>'+KINDS[k]+'</option>'; }).join("")+'</select>'+
      (withVis?'<label class="vischk" title="Visibile ai giocatori"><input type="checkbox" '+(s.vis!==false?"checked":"")+'> PG</label>':'')+
      '<button class="btn small" data-a="up" title="Su">▲</button><button class="btn small" data-a="dn" title="Giù">▼</button><button class="btn small danger" data-a="x" title="Elimina">✕</button></div>'+
      '<textarea class="t" style="margin-top:6px" placeholder="Testo… (**grassetto**, *corsivo*, righe con - per elenchi, ## per sottotitoli)">'+esc(s.body)+'</textarea>';
    var ti=d.querySelector("input.t"), sel=d.querySelector("select"), ta=d.querySelector("textarea"), vc=d.querySelector("input[type=checkbox]");
    ti.oninput=function(){ s.title=ti.value; save(); };
    sel.onchange=function(){ s.kind=sel.value; save(); };
    if(vc) vc.onchange=function(){ s.vis=vc.checked; save(); };
    ta.oninput=function(){ s.body=ta.value; autoGrow(ta); save(); };
    d.querySelector('[data-a="up"]').onclick=function(){ if(i>0){ var t=list[i-1]; list[i-1]=list[i]; list[i]=t; save(); redo(); } };
    d.querySelector('[data-a="dn"]').onclick=function(){ if(i<list.length-1){ var t=list[i+1]; list[i+1]=list[i]; list[i]=t; save(); redo(); } };
    d.querySelector('[data-a="x"]').onclick=function(){ ask("Eliminare la sezione “"+(s.title||"senza titolo")+"”?",function(){ list.splice(i,1); save(true); redo(); }); };
    box.appendChild(d); requestAnimationFrame(function(){ autoGrow(ta); });
  });
  if(!list.length) box.innerHTML='<p class="hint">Nessuna sezione.</p>';
}

function renderInfo(p){
  var m=V().meta, h;
  if(!editing()){
    h='<div class="rhead"><div class="badge">ⓘ</div><div><h2>'+esc(m.title||"")+'</h2><div class="rsub">'+esc(m.subtitle||"")+'</div></div></div>';
    if(m.notes) h+='<div class="sec k-note"><h3>Informazioni generali</h3><div class="body">'+md(m.notes)+'</div></div>';
    if(ST.loadErr) h+='<p class="muted">'+esc(ST.loadErr)+'</p>';
    else if(!ST.loaded) h+='<p class="muted">Caricamento…</p>';
    else if(rooms().length) h+='<p class="muted">Clicca una stanza sulla mappa o nell\'elenco per aprirne la scheda.</p>';
    else h+='<p class="muted">Nessuna stanza ancora scoperta. Attendete il vostro Master…</p>';
    if(own()){
      if(D.meta.masterNotes) h+='<div class="mbox"><div class="mt">🔒 Note generali del Master</div><div class="sec k-note"><div class="body">'+md(D.meta.masterNotes)+'</div></div></div>';
      h+='<p class="hint">Vedi tutte le stanze: quelle con 🔒 sono nascoste ai giocatori. Aprine una e premi “Rivela ai giocatori”. Con “👁 Vista giocatori” vedi esattamente cosa vedono loro.</p>';
    }
    p.innerHTML=h; return;
  }
  var M=D.meta;
  p.innerHTML='<div class="rhead"><div class="badge">ⓘ</div><div><h2>Info generali</h2><div class="rsub">Titolo, mappa e note</div></div></div>'+
    '<label class="f">Titolo</label><input class="t" id="mT" value="'+esc(M.title)+'">'+
    '<label class="f">Sottotitolo</label><input class="t" id="mS" value="'+esc(M.subtitle)+'">'+
    '<label class="f">Note generali (le vedono anche i giocatori)</label><textarea class="t" id="mN">'+esc(M.notes)+'</textarea>'+
    '<div class="mbox"><div class="mt">🔒 Note generali del Master</div><textarea class="t" id="mM">'+esc(M.masterNotes)+'</textarea></div>'+
    '<label class="f">Immagine della mappa</label><span class="filebtn btn small">Sostituisci mappa…<input type="file" accept="image/*" id="mapUp"></span> '+
    (M.map?'<button class="btn small" id="mapReset">Torna alla mappa originale</button>':'')+
    '<p class="hint">Se cambi mappa, le aree delle stanze restano dove sono: riposizionale trascinandole.</p>';
  $("mT").oninput=function(e){ M.title=e.target.value; renderHeader(); save(); };
  $("mS").oninput=function(e){ M.subtitle=e.target.value; renderHeader(); save(); };
  ["mN","mM"].forEach(function(k){ var ta=$(k); ta.oninput=function(){ M[k==="mN"?"notes":"masterNotes"]=ta.value; autoGrow(ta); save(); }; requestAnimationFrame(function(){ autoGrow(ta); }); });
  $("mapUp").onchange=function(e){ var f=e.target.files[0]; e.target.value=""; if(!f) return; upload(f,true).then(function(a){ M.map={id:a.id,url:a.url}; save(true); renderMap(); renderPanel(); }).catch(function(){ status("Caricamento mappa non riuscito.",true); }); };
  if($("mapReset")) $("mapReset").onclick=function(){ M.map=null; save(true); renderMap(); renderPanel(); };
}

function addRoom(){
  var nums=D.rooms.map(function(r){ return parseInt(r.num)||0; }), n=(nums.length?Math.max.apply(null,nums):0)+1;
  var r={id:uid("r"),num:String(n),name:"Nuova stanza",subtitle:"",order:n,geo:{x:42,y:42,w:16,h:12},revealed:false,images:[],
    sections:[{id:uid("s"),kind:"read",title:"Testo da leggere",body:"",vis:true},{id:uid("s"),kind:"text",title:"Descrizione",body:"",vis:true}],master:[]};
  D.rooms.push(r); save(true); select(r.id);
}

/* ---------- immagini ---------- */
function prep(file,big){
  if(!window.createImageBitmap) return Promise.resolve(file);
  return createImageBitmap(file).then(function(bmp){
    var max=big?2600:1800, k=Math.min(1,max/Math.max(bmp.width,bmp.height)), c=document.createElement("canvas");
    c.width=Math.max(1,Math.round(bmp.width*k)); c.height=Math.max(1,Math.round(bmp.height*k));
    var g=c.getContext("2d"); g.fillStyle="#14100c"; g.fillRect(0,0,c.width,c.height); g.drawImage(bmp,0,0,c.width,c.height);
    return new Promise(function(res){ c.toBlob(function(b){ res(b||file); },"image/jpeg",0.88); });
  }).catch(function(){ return file; });
}
function upload(f,big){
  status("Caricamento immagine…");
  return prep(f,big).then(function(b){
    return api("/sa-api/upload",{method:"POST",headers:{"content-type":b.type||"image/jpeg"},body:b});
  }).then(function(r){ if(!r.ok) throw new Error("http"); return r.json(); });
}

function renderAll(){ renderHeader(); renderMap(); renderChips(); renderPanel(); if(MODE==="master") renderStatus(); }

/* ---------- avvio ---------- */
function showLogin(text){
  app.innerHTML='<div class="center"><h1>Santuario degli Antenati</h1><p>Area riservata al Master. La password è la stessa del Master di Karak-Dûran.</p>'+
    '<form id="lg" style="text-align:left;max-width:340px;margin:24px auto 0"><label class="f" for="pw">Password</label><input class="t" id="pw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required>'+
    '<label class="vischk" style="margin-top:8px"><input type="checkbox" id="pwshow"> Mostra la password</label>'+
    '<p id="lgmsg" style="color:#ffb08a;margin:6px 0 0">'+esc(text||"")+'</p><p style="margin-top:12px"><button class="btn primary" type="submit">Entra</button></p></form></div>';
  $("pwshow").onchange=function(){ $("pw").type=this.checked?"text":"password"; };
  $("lg").onsubmit=function(e){ e.preventDefault(); KEY=$("pw").value.trim(); sSet("sa-key",KEY); $("lgmsg").textContent="Verifica in corso…"; init(); };
  fetch("/sa-api/stato",{cache:"no-store"}).then(function(r){ return r.ok?r.json():null; }).then(function(d){
    var mm=$("lgmsg"); if(!mm||mm.textContent) return;
    if(!d) mm.textContent="Il server non risponde: forse il sito non ha ancora finito di aggiornarsi su Netlify.";
    else if(!d.password) mm.textContent="Sul sito manca la variabile MASTER_PASSWORD (Netlify → Site configuration → Environment variables).";
  }).catch(function(){});
  $("pw").focus();
}
function init(){
  if(MODE==="master"){
    if(!KEY){ showLogin(""); return; }
    api("/sa-api/master/data").then(function(r){
      if(r.status===401){ sSet("sa-key",null); KEY=""; showLogin("Password errata. Spunta “Mostra la password” per controllare cosa hai scritto."); return null; }
      if(r.status===404){ showLogin("Il server non risponde: forse il sito non ha ancora finito di aggiornarsi su Netlify."); return null; }
      if(r.status===503){ showLogin("Sul sito manca la variabile MASTER_PASSWORD (Netlify → Site configuration → Environment variables)."); return null; }
      if(!r.ok) throw new Error("http");
      return r.json();
    }).then(function(d){
      if(!d) return;
      ST.master=true; ST.loaded=true; D=norm(d);
      shell(); stMsg="Salvato sul sito"; renderAll();
    }).catch(function(){ shell(); ST.loaded=true; ST.loadErr="Non riesco a contattare il server. Riprova tra poco."; renderAll(); });
    return;
  }
  shell(); renderAll();
  var last="";
  function pull(){
    return fetch("/sa-api/public",{cache:"no-store"}).then(function(r){ if(!r.ok) throw new Error("http"); return r.text(); }).then(function(t){
      ST.loaded=true; ST.loadErr=""; banner("");
      if(t===last) return; last=t;
      D=norm(JSON.parse(t)); renderAll();
    });
  }
  pull().catch(function(){ ST.loaded=true; ST.loadErr="Non riesco a contattare il server. Riprova tra poco."; renderAll(); });
  setInterval(function(){ if(!document.hidden) pull().catch(function(){ banner("Connessione persa: riprovo…"); }); },10000);
}
init();
})();
