
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var CL='<'+'/';
var HEAD='<title>Karak-Dûran'+CL+'title><meta name="claude:viewport-fit-sides" content="cover"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,500;0,700;1,400&family=Alegreya+Sans+SC:wght@500;700&family=Cinzel:wght@500;700&display=swap">';
var RESET=':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
var TABS=['mappa','societa','consiglio','gilde','brace','cittadella'];
var TABNAME={mappa:'Mappa',societa:'Società',consiglio:'Consiglio',gilde:'Gilde',brace:'I Custodi della Brace',cittadella:'Cittadella Reale'};
var TYPES={
  building:{label:'Edificio principale',color:'--gold'},
  residential:{label:'Quartiere residenziale',color:'--stone-hi'},
  industrial:{label:'Struttura industriale',color:'--ember'},
  sacred:{label:'Luogo sacro',color:'--holy'},
  guild:{label:'Gilda / corporazione',color:'--gold'},
  gate:{label:'Ingresso / uscita',color:'--stone-hi'},
  well:{label:'Pozzo / sorgente',color:'--water'}
};
var ICON={
  building:'<path d="M6 20V8h3v2h2V8h2v2h2V8h3v12zM10 20v-4h4v4z" fill="currentColor" fill-rule="evenodd"/>',
  residential:'<path d="M12 4 3 12h3v8h4.5v-5h3v5H18v-8h3z" fill="currentColor"/>',
  industrial:'<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="3.2 2.6"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/>',
  sacred:'<path d="M12 3 3 8v2h18V8zM5 11h2v7H5zM9 11h2v7H9zM13 11h2v7h-2zM17 11h2v7h-2zM3 19h18v2H3z" fill="currentColor"/>',
  guild:'<path d="M12 3 4 6v6c0 4.5 3.2 7.7 8 9 4.8-1.3 8-4.5 8-9V6z" fill="currentColor"/>',
  gate:'<path d="M5 21V11a7 7 0 0 1 14 0v10h-4v-9a3 3 0 0 0-6 0v9z" fill="currentColor"/>',
  well:'<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z" fill="currentColor"/>'
};
function icon(type,px,col){
  var c=col?'style="color:var('+col+')"':'';
  return '<svg viewBox="0 0 24 24" width="'+px+'" height="'+px+'" aria-hidden="true" '+c+'>'+(ICON[type]||ICON.building)+'</svg>';
}
function store(k,v){try{if(v==null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){}}
function load(k){try{return sessionStorage.getItem(k)}catch(e){return null}}

var S={levels:[],locations:[],society:[],guilds:[],council:[],custodi:[]};
var app=$('#app');
var NCOLL=['locations','society','guilds','council'];
var ISOWNER=(window.KD_MODE==='master'),KEY=load('kd-key')||'',loaded=false,lastSig='';
var ART=null,ASSETS=null,uploading=false,photoTarget=null,edit=false,dirty=false,filter=null,armed=null,msg='',msgErr=false,saving=false,draft=null,drag=null;
function tabVisible(t){return t!=='brace'||ISOWNER||S.custodi.length>0}
function tabFromHash(){var h=location.hash.slice(1);return TABS.indexOf(h)>=0&&tabVisible(h)?h:'mappa'}
var tab=tabFromHash();
var sel=(function(){try{var v=JSON.parse(load('kd-sel'));if(v&&v.k&&v.id)return v}catch(e){}return {k:'loc',id:'afgoria'}})();


/* geometria della montagna */
function hw(y){return y<=400?20+(y-24)*0.718:290-(y-400)*(140/145)}
function levelOf(y){
  var L=S.levels;
  for(var i=0;i<L.length;i++){if(y>=L[i].y0&&y<L[i].y1)return L[i]}
  return y<L[0].y0?L[0]:L[L.length-1];
}
function locsIn(lv){return S.locations.filter(function(l){return levelOf(l.y).id===lv.id}).sort(function(a,b){return a.y-b.y||a.x-b.x})}
function byId(coll,id){return S[coll].filter(function(x){return x.id===id})[0]}
function uid(p){return p+Math.random().toString(36).slice(2,8)}
function ensureSel(){
  if(sel.k==='loc'&&!byId('locations',sel.id))sel=S.locations.length?{k:'loc',id:S.locations[0].id}:{k:'zone',id:S.levels[0].id};
  if(sel.k==='zone'&&!byId('levels',sel.id))sel={k:'zone',id:S.levels[0].id};
}

/* mappa */
function mapHtml(){
  var ys=[24,70,110,150,190,235,285,335,385,400,450,500,552];
  var jr=[0,7,-5,9,-6,6,-9,7,-4,0,-6,5,0],jl=[0,-6,8,-4,7,-8,5,-7,6,0,5,-6,0];
  var right=ys.map(function(y,i){return [450+hw(y)+jr[i],y]});
  var left=ys.map(function(y,i){return [450-hw(y)+jl[i],y]}).reverse();
  var pts=right.concat(left).map(function(p){return p[0].toFixed(0)+','+p[1]}).join(' ');
  var L=S.levels,h='';
  h+='<svg id="map" class="'+(edit?'editing':'')+'" viewBox="0 0 760 560" role="group" aria-label="Sezione della montagna di Karak-Dûran">';
  h+='<defs><clipPath id="mtn"><polygon points="'+pts+'"/></clipPath>';
  h+='<linearGradient id="gMtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--rock-a)"/><stop offset=".55" style="stop-color:var(--rock-b)"/><stop offset="1" style="stop-color:var(--rock-c)"/></linearGradient>';
  h+='<radialGradient id="gForge" cx=".5" cy=".5" r=".5"><stop offset="0" style="stop-color:var(--ember)" stop-opacity=".95"/><stop offset=".55" style="stop-color:var(--ember-deep)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--ember-deep)" stop-opacity="0"/></radialGradient>';
  h+='<linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--water)" stop-opacity=".05"/><stop offset="1" style="stop-color:var(--water)" stop-opacity=".6"/></linearGradient>';
  h+='<pattern id="brick" width="26" height="13" patternUnits="userSpaceOnUse"><path d="M0 .5H26M0 6.5H26M.5 0V6.5M13.5 6.5V13" fill="none" stroke="#0d1420" stroke-opacity=".35" stroke-width="1"/></pattern></defs>';
  h+='<polygon points="'+pts+'" fill="url(#gMtn)" stroke="var(--stone-hi)" stroke-opacity=".5" stroke-width="2" stroke-linejoin="round"/>';
  h+='<g clip-path="url(#mtn)">';
  h+='<rect x="0" y="0" width="760" height="560" fill="url(#brick)"/>';
  var lv4=L[3]||L[0],lv6=L[L.length-1];
  h+='<rect x="0" y="'+lv6.y0+'" width="760" height="'+(560-lv6.y0)+'" fill="url(#gWater)"/>';
  [486,506,526].forEach(function(y,i){h+='<path d="M'+(180+i*14)+' '+y+' q15 -7 30 0'+' t30 0'.repeat(16)+'" fill="none" stroke="var(--water)" stroke-opacity="'+(.5-i*.1)+'" stroke-width="1.5"/>'});
  h+='<ellipse class="glow" cx="450" cy="'+((lv4.y0+lv4.y1)/2)+'" rx="230" ry="64" fill="url(#gForge)"/>';
  h+='<ellipse cx="450" cy="'+((lv4.y0+lv4.y1)/2+4)+'" rx="74" ry="17" fill="#ffd9a0" fill-opacity=".45"/>';
  L.forEach(function(lv,i){
    if(i>0)h+='<line x1="0" x2="760" y1="'+lv.y0+'" y2="'+lv.y0+'" stroke="var(--stone-hi)" stroke-opacity=".35" stroke-dasharray="6 5"/>';
  });
  L.forEach(function(lv){
    h+='<rect class="band'+(sel.k==='zone'&&sel.id===lv.id?' on':'')+'" data-act="selz" data-id="'+lv.id+'" x="0" y="'+lv.y0+'" width="760" height="'+(lv.y1-lv.y0)+'"><title>'+esc(lv.name)+'</title></rect>';
  });
  h+='</g>';
  /* cascata sul fianco destro */
  var wf='';for(var y=140;y<=480;y+=40){wf+=(wf?' L':'M')+(450+hw(y)-12).toFixed(0)+' '+y}
  h+='<path d="'+wf+'" fill="none" stroke="var(--holy)" stroke-opacity=".6" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>';
  /* righello dei livelli */
  L.forEach(function(lv){
    var mid=(lv.y0+lv.y1)/2,parts=lv.name.split(' ('),on=sel.k==='zone'&&sel.id===lv.id;
    h+='<line x1="152" x2="'+(450-hw(mid)-6)+'" y1="'+mid+'" y2="'+mid+'" stroke="var(--line)" stroke-dasharray="2 4"/>';
    h+='<text class="rl'+(on?' on':'')+'" data-act="selz" data-id="'+lv.id+'" x="146" y="'+(parts[1]?mid-2:mid+4)+'" text-anchor="end">'+esc(parts[0].toUpperCase())+'</text>';
    if(parts[1])h+='<text class="rl sm" data-act="selz" data-id="'+lv.id+'" x="146" y="'+(mid+13)+'" text-anchor="end">('+esc(parts[1])+'</text>';
  });
  /* segnaposto */
  var selLoc=null;
  S.locations.forEach(function(l){
    var T=TYPES[l.type]||TYPES.building,on=sel.k==='loc'&&sel.id===l.id;
    if(on)selLoc=l;
    h+='<g class="pin'+(on?' on':'')+(filter&&filter!==l.type?' dim':'')+'" data-act="sel" data-id="'+l.id+'" tabindex="0" role="button" aria-label="'+esc(l.name)+'" transform="translate('+l.x+' '+l.y+')" style="color:var('+T.color+')">';
    h+='<circle r="22" fill="rgba(0,0,0,0)"/>';
    if(l.secret)h+='<circle class="sec" r="21"/>';
    h+='<circle class="ring" r="19"/><circle class="pbase" r="15"/>';
    h+='<g transform="translate(-9 -9) scale(.75)">'+(ICON[l.type]||ICON.building)+'</g>';
    h+='<title>'+esc(l.name)+'</title></g>';
  });
  if(selLoc){
    var w=Math.round(selLoc.name.length*7.6+20),lx=Math.max(6,Math.min(selLoc.x-w/2,754-w)),ly=selLoc.y-48;
    if(ly<4)ly=selLoc.y+26;
    h+='<g class="plabel" pointer-events="none"><rect x="'+lx+'" y="'+ly+'" width="'+w+'" height="24" rx="2"/><text x="'+(lx+w/2)+'" y="'+(ly+16)+'">'+esc(selLoc.name)+'</text></g>';
  }
  /* scala */
  h+='<g class="scale" transform="translate(16 540)">';
  for(var i=0;i<5;i++)h+='<rect x="'+(i*24)+'" y="0" width="24" height="4" fill="'+(i%2?'var(--ink-1)':'var(--muted)')+'" stroke="var(--muted)" stroke-width=".5"/>';
  h+='<text x="0" y="-4">0</text><text x="120" y="-4" text-anchor="end">500 m</text></g>';
  h+='</svg>';
  return h;
}
function legendHtml(){
  return Object.keys(TYPES).map(function(k){
    var n=S.locations.filter(function(l){return l.type===k}).length;
    return '<button class="lg" data-act="filter" data-id="'+k+'" aria-pressed="'+(filter===k)+'">'+icon(k,16,TYPES[k].color)+TYPES[k].label+' <span class="n">'+n+'</span></button>';
  }).join('');
}
function listHtml(){
  return S.levels.map(function(lv){
    var ls=locsIn(lv),on=sel.k==='zone'&&sel.id===lv.id;
    return '<div class="lv"><button class="'+(on?'on':'')+'" data-act="selz" data-id="'+lv.id+'">'+esc(lv.name)+'</button>'+
      (ls.length?'<ul>'+ls.map(function(l){
        var T=TYPES[l.type]||TYPES.building;
        return '<li><button class="'+(sel.k==='loc'&&sel.id===l.id?'on':'')+'" data-act="sel" data-id="'+l.id+'">'+icon(l.type,15,T.color)+esc(l.name)+'</button></li>';
      }).join('')+'</ul>':'<span class="none">Nessun luogo in questo livello</span>')+'</div>';
  }).join('');
}
function detailHtml(){
  ensureSel();
  var l=sel.k==='loc'?byId('locations',sel.id):null,z=sel.k==='zone'?byId('levels',sel.id):null,h='';
  if(l){
    var lv=levelOf(l.y),T=TYPES[l.type]||TYPES.building;
    if(!edit){
      h='<article class="parch">'+hidBar('locations',l)+photoImg(l)+'<p class="kick"><span class="tchip">'+icon(l.type,16,T.color)+'</span>'+esc(T.label)+' · '+esc(lv.name)+'</p><h2>'+esc(l.name)+'</h2>'+
        (l.secret?'<span class="secret">Segreto ben custodito</span>':'')+
        '<p class="desc">'+esc(l.desc)+'</p>'+
        (l.notes?'<div class="mnote"><h3>Note del Master</h3><p>'+esc(l.notes)+'</p></div>':'')+'</article>';
    }else{
      var opts=Object.keys(TYPES).map(function(k){return '<option value="'+k+'"'+(k===l.type?' selected':'')+'>'+TYPES[k].label+'</option>'}).join('');
      h='<article class="parch">'+hidBar('locations',l)+'<p class="kick">Modifica luogo · livello: '+esc(lv.name)+'</p>'+
        '<div class="fld"><label for="f-name">Nome</label><input id="f-name" data-b="locations|'+l.id+'|name" value="'+esc(l.name)+'"></div>'+
        '<div class="row2"><div class="fld"><label for="f-type">Tipo</label><select id="f-type" data-b="locations|'+l.id+'|type">'+opts+'</select></div>'+
        '<label class="chk" for="f-sec"><input type="checkbox" id="f-sec" data-b="locations|'+l.id+'|secret"'+(l.secret?' checked':'')+'> Segreto</label></div>'+
        '<div class="fld"><label for="f-desc">Descrizione</label><textarea id="f-desc" rows="5" data-b="locations|'+l.id+'|desc">'+esc(l.desc)+'</textarea></div>'+
        (ISOWNER?'<div class="fld"><label for="f-notes">Note del Master</label><textarea id="f-notes" rows="3" data-b="locations|'+l.id+'|notes" placeholder="Agganci, PNG, segreti, trappole...">'+esc(l.notes)+'</textarea></div>':'')+
        photoField('locations',l)+'<p class="hint">Trascina il segnaposto sulla mappa per spostarlo. Il livello cambia con la posizione.</p>'+
        '<button class="btn danger small" data-act="delloc" data-id="'+l.id+'">'+(armed==='loc:'+l.id?'Conferma eliminazione':'Elimina luogo')+'</button></article>';
    }
  }else if(z){
    var ls=locsIn(z);
    if(!edit){
      h='<article class="parch"><p class="kick">Livello della montagna</p><h2>'+esc(z.name)+'</h2>'+
        (ls.length?'<ul class="zl">'+ls.map(function(x){return '<li><button data-act="sel" data-id="'+x.id+'">'+esc(x.name)+'</button></li>'}).join('')+'</ul>':'<p class="desc">Nessun luogo in questo livello.</p>')+'</article>';
    }else{
      h='<article class="parch"><p class="kick">Modifica livello</p><div class="fld"><label for="f-zname">Nome del livello</label><input id="f-zname" data-b="levels|'+z.id+'|name" value="'+esc(z.name)+'"></div>'+
        '<p class="hint">Per assegnare un luogo a questo livello, trascina il suo segnaposto dentro la fascia.</p></article>';
    }
  }
  return h;
}
function mapView(){
  return '<div class="mapgrid"><div><div class="mapcard" id="mapbox">'+mapHtml()+'</div><div class="legend" id="legend">'+legendHtml()+'</div></div><aside class="side" id="detail">'+detailHtml()+'</aside></div>'+
    '<section><h2 class="sech">Tutti i luoghi</h2><div id="locs">'+listHtml()+'</div>'+(edit?'<p style="margin-top:14px"><button class="btn" data-act="addloc">Aggiungi un luogo</button></p>':'')+'</section>';
}

/* società e gilde */
function ctl(coll,id,i,n){
  if(!edit)return '';
  var key=coll+':'+id;
  return '<div class="ctl"><button class="btn small" data-act="mv" data-coll="'+coll+'" data-id="'+id+'" data-d="-1" aria-label="Sposta su"'+(i===0?' disabled':'')+'>Su</button>'+
    '<button class="btn small" data-act="mv" data-coll="'+coll+'" data-id="'+id+'" data-d="1" aria-label="Sposta giù"'+(i===n-1?' disabled':'')+'>Giù</button>'+
    '<button class="btn small danger" data-act="delitem" data-coll="'+coll+'" data-id="'+id+'">'+(armed===key?'Conferma eliminazione':'Elimina')+'</button></div>';
}
function itemHtml(coll,it,i,n){
  if(!edit){
    return '<div class="card">'+hidBar(coll,it)+photoImg(it)+'<h3>'+esc(it.name)+'</h3><p>'+esc(it.text)+'</p>'+(coll==='society'&&it.id==='s2'&&S.council.length?'<p><button class="btn small" data-act="tab" data-id="consiglio">Vedi i membri del Consiglio</button></p>':'')+(it.notes?'<div class="mnote"><h4>Note del Master</h4><p>'+esc(it.notes)+'</p></div>':'')+'</div>';
  }
  var b=coll+'|'+it.id+'|';
  return '<div class="card dark">'+hidBar(coll,it)+'<div class="fld"><label for="n-'+it.id+'">Nome</label><input id="n-'+it.id+'" data-b="'+b+'name" value="'+esc(it.name)+'"></div>'+
    '<div class="fld"><label for="t-'+it.id+'">Descrizione</label><textarea id="t-'+it.id+'" rows="3" data-b="'+b+'text">'+esc(it.text)+'</textarea></div>'+
    (ISOWNER?'<div class="fld"><label for="m-'+it.id+'">Note del Master</label><textarea id="m-'+it.id+'" rows="2" data-b="'+b+'notes" placeholder="Agganci, PNG, segreti...">'+esc(it.notes)+'</textarea></div>':'')+photoField(coll,it)+ctl(coll,it.id,i,n)+'</div>';
}
function societyView(){
  var n=S.society.length;
  return '<div class="cols"><section><h2 class="sech" style="margin-top:0">La società nanica</h2>'+
    (edit?'<div class="fld dark" style="margin-bottom:20px"><label for="si">Introduzione</label><textarea id="si" rows="4" data-b="|root|societyIntro" style="width:100%;padding:8px 10px;background:var(--ink-2);border:1px solid var(--line);color:var(--fg)">'+esc(S.societyIntro)+'</textarea></div>':'<p class="lead">'+esc(S.societyIntro)+'</p>')+
    '<ol class="ladder">'+S.society.map(function(it,i){return '<li class="tier">'+itemHtml('society',it,i,n)+'</li>'}).join('')+'</ol>'+
    (edit?'<button class="btn" data-act="additem" data-coll="society">Aggiungi un grado</button>':'')+'</section>'+
    '<aside><div class="parch life"><p class="kick">Tradizione</p><h2>La vita a Karak-Dûran</h2>'+
    (edit?'<div class="fld" style="margin-top:12px"><label for="lf">Testo</label><textarea id="lf" rows="6" data-b="|root|life">'+esc(S.life)+'</textarea></div>':'<p>'+esc(S.life)+'</p>')+'</div></aside></div>';
}
function guildView(){
  var n=S.guilds.length;
  return '<h2 class="sech" style="margin-top:0">Le gilde principali</h2><ul class="guilds">'+S.guilds.map(function(it,i){return '<li>'+itemHtml('guilds',it,i,n)+'</li>'}).join('')+'</ul>'+
    (edit?'<p style="margin-top:16px"><button class="btn" data-act="additem" data-coll="guilds">Aggiungi una gilda</button></p>':'');
}

/* foto */
function photoSrc(p){return p?(p.url||(p.id?'/_blob/'+p.id:'')):''}
function photoImg(it,cls){var s=photoSrc(it.photo);return s?'<img class="'+(cls||'ph')+'" src="'+esc(s)+'" alt="'+esc(it.name||it.house||'')+'" loading="lazy">':''}
function photoCtl(coll,it){
  if(!edit||!ASSETS)return '';
  var has=!!photoSrc(it.photo);
  return '<div class="ctl"><button class="btn small" data-act="photo" data-coll="'+coll+'" data-id="'+it.id+'"'+(uploading?' disabled':'')+'>'+(uploading?'Caricamento...':(has?'Cambia foto':'Aggiungi foto'))+'</button>'+
    (has?'<button class="btn small danger" data-act="rmphoto" data-coll="'+coll+'" data-id="'+it.id+'">Rimuovi foto</button>':'')+'</div>';
}
function photoField(coll,it){
  if(!edit||(!ASSETS&&!photoSrc(it.photo)))return '';
  return '<div class="fld"><span class="fl">Foto</span>'+photoImg(it)+photoCtl(coll,it)+'</div>';
}
function prep(file){
  return createImageBitmap(file).then(function(bmp){
    var k=Math.min(1,1400/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(bmp.width*k));c.height=Math.max(1,Math.round(bmp.height*k));
    var g=c.getContext('2d');g.fillStyle='#142033';g.fillRect(0,0,c.width,c.height);g.drawImage(bmp,0,0,c.width,c.height);
    return new Promise(function(res){c.toBlob(function(b){res(b||file)},'image/jpeg',0.88)});
  }).catch(function(){return file});
}
var fin=document.createElement('input');
fin.type='file';fin.accept='image/*';fin.hidden=true;fin.id='photo-in';fin.setAttribute('aria-label','Scegli una foto');
document.body.appendChild(fin);
fin.addEventListener('change',function(){
  var f=fin.files&&fin.files[0],t=photoTarget;
  if(!f||!t||!ASSETS)return;
  if(!/^image\//.test(f.type)){msg='Scegli un file immagine.';msgErr=true;renderBar();return}
  uploading=true;msg='Caricamento della foto...';msgErr=false;render();
  prep(f).then(function(b){return ASSETS.upload(b)}).then(function(r){
    var it=byId(t.coll,t.id);
    uploading=false;
    if(it){it.photo={id:r.id,url:r.url};if(t.coll==='custodi')wMember(it,true);else if(it.hid)wHid(t.coll,it,true);else setDirty()}
    msg='Foto caricata. Premi Salva per tenerla.';msgErr=false;render();
  }).catch(function(e){
    uploading=false;msgErr=true;
    msg='Caricamento non riuscito'+(e&&e.code==='rate_limited'?': troppe richieste, riprova tra poco.':'. Controlla che il file sia un\'immagine e riprova.');
    render();
  });
});

/* consiglio delle pietre */
function houseHtml(it,i,n){
  if(!edit){
    var img=photoImg(it,'pt')||'<div class="pt empty" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor">'+ICON.guild+'</svg></div>';
    return '<article class="house">'+img+'<div class="hb"><p class="hk">'+esc(it.house)+'</p><h3>'+esc(it.name)+'</h3><p class="hr">'+esc(it.role)+(it.age?' · '+esc(it.age)+' anni':'')+'</p>'+
      (it.domain?'<p class="dom"><span>Dominio</span>'+esc(it.domain)+'</p>':'')+
      '<p class="ht">'+esc(it.text)+'</p>'+(it.motto?'<p class="motto">«'+esc(it.motto)+'»</p>':'')+
      (it.notes?'<div class="mnote"><h4>Note del Master</h4><p>'+esc(it.notes)+'</p></div>':'')+'</div></article>';
  }
  var b='council|'+it.id+'|',q=it.id;
  return '<div class="card dark">'+
    '<div class="fld"><label for="n-'+q+'">Casata</label><input id="n-'+q+'" data-b="'+b+'house" value="'+esc(it.house)+'"></div>'+
    '<div class="row2"><div class="fld"><label for="cn-'+q+'">Nome del capocasata</label><input id="cn-'+q+'" data-b="'+b+'name" value="'+esc(it.name)+'"></div>'+
    '<div class="fld"><label for="ca-'+q+'">Età</label><input id="ca-'+q+'" inputmode="numeric" style="width:6em" data-b="'+b+'age" value="'+esc(it.age)+'"></div></div>'+
    '<div class="fld"><label for="cr-'+q+'">Ruolo</label><input id="cr-'+q+'" data-b="'+b+'role" value="'+esc(it.role)+'"></div>'+
    '<div class="fld"><label for="cd-'+q+'">Dominio</label><input id="cd-'+q+'" data-b="'+b+'domain" value="'+esc(it.domain)+'"></div>'+
    '<div class="fld"><label for="ct-'+q+'">Descrizione</label><textarea id="ct-'+q+'" rows="4" data-b="'+b+'text">'+esc(it.text)+'</textarea></div>'+
    '<div class="fld"><label for="cm-'+q+'">Motto</label><input id="cm-'+q+'" data-b="'+b+'motto" value="'+esc(it.motto)+'"></div>'+
    (ISOWNER?'<div class="fld"><label for="cx-'+q+'">Note del Master</label><textarea id="cx-'+q+'" rows="2" data-b="'+b+'notes" placeholder="Alleanze, rivalità, segreti...">'+esc(it.notes)+'</textarea></div>':'')+
    photoField('council',it)+ctl('council',it.id,i,n)+'</div>';
}
function councilView(){
  var n=S.council.length;
  return '<h2 class="sech" style="margin-top:0">Il Consiglio delle Pietre</h2>'+
    (edit?'<div class="fld dark" style="max-width:720px;margin-bottom:20px"><label for="ci">Introduzione</label><textarea id="ci" rows="3" data-b="|root|councilIntro" style="width:100%;padding:8px 10px;background:var(--ink-2);border:1px solid var(--line);color:var(--fg)">'+esc(S.councilIntro)+'</textarea></div>':(S.councilIntro?'<p class="lead">'+esc(S.councilIntro)+'</p>':''))+
    (n?'<ul class="council">'+S.council.map(function(it,i){return '<li>'+houseHtml(it,i,n)+'</li>'}).join('')+'</ul>':'<p class="lead">Nessuna casata registrata.'+(edit?'':' Entra in modalità modifica per aggiungerne una.')+'</p>')+
    (edit?'<p style="margin-top:16px"><button class="btn" data-act="additem" data-coll="council">Aggiungi una casata</button></p>':'');
}

/* custodi della brace nera */
var FLAME='<path d="M12 2c.8 3.4 5.2 6.1 5.2 11.1a5.2 5.2 0 0 1-10.4 0c0-2.2 1-3.8 2.2-5 .1 1.6.7 2.7 1.8 3.3C10.3 8.6 10.8 5 12 2z"/>';
function revBar(it){
  if(!ISOWNER)return '';
  return '<div class="ctl" style="margin:0 0 12px;align-items:center"><span class="secret" style="margin:0'+(it.revealed?';background:#2f6b3a':'')+'">'+(it.revealed?'Rivelato ai giocatori':'Nascosto ai giocatori')+'</span><button class="btn small'+(it.revealed?' danger':' pri')+'" data-act="reveal" data-id="'+it.id+'">'+(it.revealed?'Nascondi di nuovo':'Rivela ai giocatori')+'</button></div>';
}
function memberHtml(it,i,n){
  if(!(edit&&ISOWNER)){
    var img=photoImg(it,'pt')||'<div class="pt empty" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor">'+FLAME+'</svg></div>';
    var meta=[it.race,it.age?it.age+' anni':''].filter(Boolean).join(' · ');
    return '<article class="house">'+img+'<div class="hb">'+revBar(it)+(it.title?'<p class="hk">'+esc(it.title)+'</p>':'')+'<h3>'+esc(it.name)+'</h3>'+(meta?'<p class="hr">'+esc(meta)+'</p>':'')+
      '<p class="ht">'+esc(it.text)+'</p>'+
      (it.notes?'<div class="mnote"><h4>Note del Master</h4><p>'+esc(it.notes)+'</p></div>':'')+'</div></article>';
  }
  var b='custodi|'+it.id+'|',q=it.id;
  return '<div class="card dark">'+revBar(it)+
    '<div class="fld"><label for="n-'+q+'">Nome</label><input id="n-'+q+'" data-b="'+b+'name" value="'+esc(it.name)+'"></div>'+
    '<div class="fld"><label for="kt-'+q+'">Titolo e ruolo</label><input id="kt-'+q+'" data-b="'+b+'title" value="'+esc(it.title)+'"></div>'+
    '<div class="row2"><div class="fld"><label for="kr-'+q+'">Stirpe</label><input id="kr-'+q+'" data-b="'+b+'race" value="'+esc(it.race)+'"></div>'+
    '<div class="fld"><label for="ka-'+q+'">Età</label><input id="ka-'+q+'" inputmode="numeric" style="width:6em" data-b="'+b+'age" value="'+esc(it.age)+'"></div></div>'+
    '<div class="fld"><label for="kx-'+q+'">Descrizione</label><textarea id="kx-'+q+'" rows="6" data-b="'+b+'text">'+esc(it.text)+'</textarea></div>'+
    '<div class="fld"><label for="km-'+q+'">Note del Master</label><textarea id="km-'+q+'" rows="2" data-b="'+b+'notes" placeholder="Segreti, obiettivi, reazioni ai PG...">'+esc(it.notes)+'</textarea></div>'+
    photoField('custodi',it)+ctl('custodi',it.id,i,n)+'</div>';
}
function braceView(){
  var n=S.custodi.length,ed=edit&&ISOWNER;
  var head=ed?
    '<div class="dark" style="max-width:720px;margin-bottom:20px"><div class="fld"><label for="bt">Titolo</label><input id="bt" data-b="|root|custodiTitle" value="'+esc(S.custodiTitle)+'"></div>'+
    '<div class="fld"><label for="bi">Introduzione</label><textarea id="bi" rows="4" data-b="|root|custodiIntro">'+esc(S.custodiIntro)+'</textarea></div></div>':
    '<h2 class="sech" style="margin-top:0">'+esc(S.custodiTitle)+'</h2>'+(S.custodiIntro?'<p class="lead">'+esc(S.custodiIntro)+'</p>':'');
  if(ISOWNER)head='<p class="hint" style="max-width:720px;margin:0 0 16px;color:var(--gold)">Scheda segreta: la vedi solo tu. I giocatori la vedono solo quando riveli almeno un custode. <span id="bst" role="status">'+''+'</span></p>'+head;
  return head+
    (n?'<ul class="council">'+S.custodi.map(function(it,i){return '<li>'+memberHtml(it,i,n)+'</li>'}).join('')+'</ul>':'<p class="lead">Nessun custode registrato.'+(ed?'':(ISOWNER?' Entra in modalità modifica per aggiungerne uno.':''))+'</p>')+
    (ed?'<p style="margin-top:16px"><button class="btn" data-act="additem" data-coll="custodi">Aggiungi un custode</button></p>':'');
}

/* cittadella reale */
var csel=null,cdrag=null;
function lines(t){return String(t||'').split('\n').map(function(x){return x.trim()}).filter(Boolean)}
function citEnsure(){if(!csel||!byId('citAreas',csel))csel=S.citAreas.length?S.citAreas[0].id:null}
function citMapHtml(){
  var m=S.citmap[0],src=photoSrc(m.photo);
  var pins=S.citAreas.map(function(a,i){return '<button class="cpin'+(a.id===csel?' on':'')+'" data-act="csel" data-id="'+a.id+'" style="left:'+a.x+'%;top:'+a.y+'%" aria-label="'+esc(a.name)+'" title="'+esc(a.name)+'">'+(i+1)+'</button>'}).join('');
  return '<figure class="cmap'+(edit?' editing':'')+'"><div class="cmi" id="cmi">'+(src?'<img src="'+esc(src)+'" alt="Pianta della Cittadella Reale">':'<div class="cmap-empty">'+(edit?'Carica la pianta con il pulsante qui sotto.':'Nessuna pianta caricata.')+'</div>')+pins+'</div></figure>';
}
function citListHtml(){
  return S.citAreas.map(function(a,i){
    return '<li><button class="ai'+(a.id===csel?' on':'')+'" data-act="csel" data-id="'+a.id+'"><span class="num">'+(i+1)+'</span><span><b>'+esc(a.name)+'</b>'+(a.text?'<span class="t">'+esc(a.text)+'</span>':'')+'</span></button></li>';
  }).join('');
}
function citDetail(){
  var a=byId('citAreas',csel);
  if(!a)return '<article class="parch"><p class="desc">Nessuna area registrata.'+(edit?'':' Entra in modalità modifica per aggiungerne una.')+'</p></article>';
  var i=S.citAreas.indexOf(a),n=S.citAreas.length;
  if(!edit)return '<article class="parch">'+photoImg(a)+'<p class="kick">Area '+(i+1)+' di '+n+'</p><h2>'+esc(a.name)+'</h2><p class="desc">'+esc(a.text)+'</p></article>';
  var b='citAreas|'+a.id+'|';
  return '<article class="parch"><p class="kick">Modifica area '+(i+1)+' di '+n+'</p>'+
    '<div class="fld"><label for="ca-n">Nome</label><input id="ca-n" data-b="'+b+'name" value="'+esc(a.name)+'"></div>'+
    '<div class="fld"><label for="ca-t">Descrizione</label><textarea id="ca-t" rows="3" data-b="'+b+'text">'+esc(a.text)+'</textarea></div>'+
    photoField('citAreas',a)+'<p class="hint">Trascina il numero sulla pianta per spostarlo.</p>'+ctl('citAreas',a.id,i,n)+'</article>';
}
function citRefresh(){var l=$('#alist');if(l)l.innerHTML=citListHtml()}
function bullets(t){var ls=lines(t);return ls.length?'<ul class="dia">'+ls.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>':'<p class="none" style="color:var(--muted);font-style:italic">Nessun elemento.</p>'}
function citView(){
  citEnsure();
  var head=edit?
    '<div class="dark" style="max-width:720px;margin-bottom:20px"><div class="fld"><label for="ct-h">Titolo</label><input id="ct-h" data-b="|root|citTitle" value="'+esc(S.citTitle)+'"></div>'+
    '<div class="fld"><label for="ct-i">Introduzione</label><textarea id="ct-i" rows="4" data-b="|root|citIntro">'+esc(S.citIntro)+'</textarea></div></div>':
    '<h2 class="sech" style="margin-top:0">'+esc(S.citTitle)+'</h2>'+(S.citIntro?'<p class="lead">'+esc(S.citIntro)+'</p>':'');
  var left='<div class="side">'+citMapHtml()+(edit?'<div class="dark" style="margin-top:12px">'+photoCtl('citmap',S.citmap[0])+'</div>':'')+'</div>';
  var right='<div><div id="cdetail">'+citDetail()+'</div><ol class="alist" id="alist">'+citListHtml()+'</ol>'+(edit?'<p style="margin-top:12px"><button class="btn" data-act="additem" data-coll="citAreas">Aggiungi area</button></p>':'')+'</div>';
  var low=edit?
    '<div class="cit2"><div class="card dark"><div class="fld"><label for="ct-f">Caratteristiche principali (una per riga)</label><textarea id="ct-f" rows="5" data-b="|root|citFeatures">'+esc(S.citFeatures)+'</textarea></div></div>'+
    '<div class="card dark"><div class="fld"><label for="ct-a">Atmosfera e dettagli (una per riga)</label><textarea id="ct-a" rows="5" data-b="|root|citAtmos">'+esc(S.citAtmos)+'</textarea></div></div></div>':
    '<div class="cit2"><div class="card"><h3>Caratteristiche principali</h3>'+bullets(S.citFeatures)+'</div><div class="card"><h3>Atmosfera e dettagli</h3>'+bullets(S.citAtmos)+'</div></div>';
  return head+'<div class="cit">'+left+right+'</div>'+low;
}
app.addEventListener('pointerdown',function(e){
  if(!edit||tab!=='cittadella')return;
  var p=e.target.closest('.cpin');if(!p)return;
  var a=byId('citAreas',p.getAttribute('data-id'));if(!a)return;
  cdrag={a:a,el:p,moved:false,sx:e.clientX,sy:e.clientY};
  try{p.setPointerCapture(e.pointerId)}catch(x){}
});
app.addEventListener('pointermove',function(e){
  if(!cdrag)return;
  if(!cdrag.moved&&Math.abs(e.clientX-cdrag.sx)+Math.abs(e.clientY-cdrag.sy)<5)return;
  cdrag.moved=true;
  var r=$('#cmi').getBoundingClientRect(),a=cdrag.a;
  a.x=Math.round(clamp((e.clientX-r.left)/r.width*100,2,98)*10)/10;
  a.y=Math.round(clamp((e.clientY-r.top)/r.height*100,2,98)*10)/10;
  cdrag.el.style.left=a.x+'%';cdrag.el.style.top=a.y+'%';
});
function endCdrag(){if(!cdrag)return;var m=cdrag.moved,id=cdrag.a.id;cdrag=null;if(m){csel=id;setDirty();render()}}
app.addEventListener('pointerup',endCdrag);
app.addEventListener('pointercancel',endCdrag);

/* struttura */
function headerHtml(){
  if(edit){
    return '<header class="hdr"><div class="stack dark"><input class="in-h1" id="h-t" data-b="|root|title" value="'+esc(S.title)+'" aria-label="Titolo"><input id="h-s" data-b="|root|subtitle" value="'+esc(S.subtitle)+'" aria-label="Sottotitolo"><textarea id="h-g" rows="2" data-b="|root|tagline" aria-label="Frase di apertura">'+esc(S.tagline)+'</textarea></div>'+
      '<div class="stack dark"><input id="h-c" data-b="|root|city" value="'+esc(S.city)+'" aria-label="Nome della città"><textarea id="h-ct" rows="3" data-b="|root|cityText" aria-label="Descrizione breve">'+esc(S.cityText)+'</textarea></div></header>';
  }
  return '<header class="hdr"><div><h1>'+esc(S.title)+'</h1><div class="sub">'+esc(S.subtitle)+'</div><p class="tag">'+esc(S.tagline)+'</p></div><div class="city"><h2>'+esc(S.city)+'</h2><p>'+esc(S.cityText)+'</p></div></header>';
}
function tabsHtml(){
  return '<nav class="tabs" role="tablist" aria-label="Sezioni">'+TABS.filter(tabVisible).map(function(t){
    return '<button class="tab" role="tab" id="tab-'+t+'" aria-selected="'+(tab===t)+'" data-act="tab" data-id="'+t+'">'+TABNAME[t]+'</button>';
  }).join('')+'<span class="sp"></span>'+(ISOWNER?'<button class="btn" data-act="import">Importa dati</button> <button class="btn'+(edit?' on':'')+'" data-act="edit" aria-pressed="'+edit+'">'+(edit?'Esci dalla modifica':'Modifica')+'</button>':'')+'</nav>';
}
function footHtml(){
  return '<footer style="margin-top:40px;padding-top:18px;border-top:1px solid var(--line);text-align:center"><p style="font-family:var(--f-display);letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin:0;font-size:.95rem">'+(edit?'':esc(S.motto))+'</p>'+
    (edit?'<div class="fld dark" style="max-width:420px;margin:0 auto"><label for="mt">Motto</label><input id="mt" data-b="|root|motto" value="'+esc(S.motto)+'" style="width:100%;padding:8px 10px;background:var(--ink-2);border:1px solid var(--line);color:var(--fg)"></div>':'')+'</footer>';
}
function render(){
  if(!loaded)return;
  var y=window.scrollY;
  ensureSel();
  var v=tab==='societa'?societyView():tab==='consiglio'?councilView():tab==='gilde'?guildView():tab==='brace'?braceView():tab==='cittadella'?citView():mapView();
  app.innerHTML='<div class="wrap">'+headerHtml()+tabsHtml()+'<main role="tabpanel" aria-labelledby="tab-'+tab+'">'+v+'</main>'+footHtml()+'</div><div class="bar" id="bar" hidden></div>';
  renderBar();
  window.scrollTo(0,y);
}
function refreshMap(){
  var m=$('#mapbox');if(!m)return;
  m.innerHTML=mapHtml();
  var lg=$('#legend');if(lg)lg.innerHTML=legendHtml();
  var ls=$('#locs');if(ls)ls.innerHTML=listHtml();
}
function renderBar(){
  var b=$('#bar');if(!b)return;
  if(!(edit||dirty||draft)){b.hidden=true;b.innerHTML='';return}
  var h='<div class="in">';
  if(draft&&!dirty){
    h+='<span class="st">Hai una bozza non salvata di prima, interrotta da un salvataggio concorrente.</span><button class="btn pri" data-act="restore">Riprendi la bozza</button><button class="btn" data-act="dropdraft">Scarta</button>';
  }else{
    h+='<span class="st'+(msgErr?' err':'')+'" role="status">'+esc(msg||(dirty?'Modifiche non salvate.':'Nessuna modifica da salvare.'))+'</span>';
    h+='<button class="btn pri" data-act="save"'+(saving||!dirty?' disabled':'')+'>'+(saving?'Salvataggio...':'Salva nel cloud')+'</button>';
    h+='<button class="btn" data-act="revert"'+(dirty?'':' disabled')+'>Annulla modifiche</button>';
  }
  h+='</div>';
  b.hidden=false;b.innerHTML=h;
}
function setDirty(){dirty=true;msg='';msgErr=false;renderBar()}

/* salvataggio */
function api(path,opt){opt=opt||{};opt.headers=Object.assign({'x-master-key':KEY},opt.headers||{});return fetch(path,opt)}
function save(){
  if(saving||!dirty)return;
  saving=true;msg='';msgErr=false;renderBar();
  store('kd-sel',JSON.stringify(sel));
  api('/api/master/data',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(S)}).then(function(r){
    if(r.status===401){store('kd-key',null);KEY='';throw {code:'auth'}}
    if(!r.ok)throw {code:'http'};
    dirty=false;saving=false;msg='Salvato.';renderBar();
  }).catch(function(e){
    saving=false;msgErr=true;
    msg=e&&e.code==='auth'?'Sessione scaduta: ricarica la pagina e rientra con la password.':'Salvataggio non riuscito. Riprova tra poco.';
    renderBar();
  });
}

/* azioni */
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function act(el,e){
  var a=el.getAttribute('data-act'),id=el.getAttribute('data-id'),coll=el.getAttribute('data-coll');
  if(a==='tab'){location.hash=id;return}
  if(a==='sel'){sel={k:'loc',id:id};store('kd-sel',JSON.stringify(sel));render();return}
  if(a==='selz'){sel={k:'zone',id:id};store('kd-sel',JSON.stringify(sel));render();return}
  if(a==='filter'){filter=filter===id?null:id;refreshMap();return}
  if(a==='edit'){edit=!edit;armed=null;msg='';render();return}
  if(a==='csel'){csel=id;render();return}
  if(a==='photo'){if(uploading||!ASSETS)return;photoTarget={coll:coll,id:id};fin.value='';fin.click();return}
  if(a==='rmphoto'){var pit=byId(coll,id);if(pit){pit.photo=null;if(coll==='custodi')wMember(pit,true);else if(pit.hid)wHid(coll,pit,true);else setDirty();render()}return}
  if(a==='revealh'){var hit=byId(coll,id);if(!hit||!ISOWNER||!hit.hid)return;hit.revealed=!hit.revealed;setDirty();render();save();return}
  if(a==='reveal'){var rit=byId('custodi',id);if(!rit||!ISOWNER)return;rit.revealed=!rit.revealed;setDirty();render();save();return}
  if(a==='save'){save();return}
  if(a==='revert'){armed=null;fetchState().then(function(d){if(d&&!d.empty){S=d;norm();dirty=false;msg='';tab=tabFromHash();render()}});return}
  if(a==='addloc'){
    var nl={id:uid('l'),name:'Nuovo luogo',type:'building',x:450,y:250,desc:'',notes:'',secret:false};
    S.locations.push(nl);sel={k:'loc',id:nl.id};setDirty();render();return;
  }
  if(a==='delloc'){
    if(armed==='loc:'+id){var dl=byId('locations',id);S.locations=S.locations.filter(function(l){return l.id!==id});armed=null;if(dl&&dl.hid)wHidDelete('locations',id);else{setDirty();wNotes()}render();return}
    armed='loc:'+id;render();setTimeout(function(){if(armed==='loc:'+id){armed=null;render()}},3500);return;
  }
  if(a==='additem'){
    var it=coll==='citAreas'?{id:uid('a'),name:'Nuova area',text:'',x:50,y:50,photo:null}:coll==='custodi'?{id:uid('k'),name:'Nuovo custode',title:'',race:'Nano',age:'',text:'',notes:'',photo:null}:coll==='council'?{id:uid('c'),house:'Nuova casata',name:'',role:'Capocasata',age:'',domain:'',text:'',motto:'',notes:'',photo:null}:{id:uid(coll==='guilds'?'g':'s'),name:coll==='guilds'?'Nuova gilda':'Nuovo grado',text:'',notes:''};
    S[coll].push(it);if(coll==='citAreas')csel=it.id;if(coll==='custodi')wMember(it,true);else setDirty();render();
    var f=$('#n-'+it.id);if(f)f.focus();return;
  }
  if(a==='delitem'){
    var key=coll+':'+id;
    if(armed===key){var di=byId(coll,id);S[coll]=S[coll].filter(function(x){return x.id!==id});armed=null;if(coll==='custodi')wDelete(id);else if(di&&di.hid)wHidDelete(coll,id);else{setDirty();wNotes()}render();return}
    armed=key;render();setTimeout(function(){if(armed===key){armed=null;render()}},3500);return;
  }
  if(a==='mv'){
    var d=parseInt(el.getAttribute('data-d'),10),arr=S[coll],i=arr.map(function(x){return x.id}).indexOf(id),j=i+d;
    if(i<0||j<0||j>=arr.length)return;
    var t=arr[i];arr[i]=arr[j];arr[j]=t;if(coll==='custodi')wOrder();else{setDirty();wHidOrder(coll)}render();
    return;
  }
}
app.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');
  if(!el||!app.contains(el))return;
  if(drag&&drag.moved){drag=null;return}
  act(el,e);
});
app.addEventListener('keydown',function(e){
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('pin')){e.preventDefault();act(e.target,e)}
});
app.addEventListener('input',function(e){
  var t=e.target,b=t.getAttribute&&t.getAttribute('data-b');
  if(!b)return;
  var p=b.split('|'),c=p[0],id=p[1],f=p[2],v=t.type==='checkbox'?t.checked:t.value;
  if(!c){S[f]=v}else{var it=byId(c,id);if(!it)return;it[f]=v}
  if(it&&it.hid&&NCOLL.indexOf(c)>=0){if(ISOWNER)wHid(c,it);return}
  if(f==='notes'&&NCOLL.indexOf(c)>=0){if(ISOWNER)wNotes();return}
  if(c==='custodi'){if(ISOWNER)wMember(it);return}
  if(!c&&(f==='custodiTitle'||f==='custodiIntro')){if(ISOWNER)wMeta();return}
  setDirty();
  if(c==='locations'||c==='levels')refreshMap();
  if(c==='citAreas')citRefresh();
});

/* trascinamento dei segnaposto in modifica */
app.addEventListener('pointerdown',function(e){
  if(!edit||tab!=='mappa')return;
  var pin=e.target.closest('.pin');if(!pin)return;
  var l=byId('locations',pin.getAttribute('data-id'));if(!l)return;
  drag={id:l.id,el:pin,moved:false,sx:e.clientX,sy:e.clientY};
  try{pin.setPointerCapture(e.pointerId)}catch(x){}
});
app.addEventListener('pointermove',function(e){
  if(!drag)return;
  if(!drag.moved&&Math.abs(e.clientX-drag.sx)+Math.abs(e.clientY-drag.sy)<5)return;
  drag.moved=true;
  var svg=$('#map'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
  var p=pt.matrixTransform(svg.getScreenCTM().inverse());
  var l=byId('locations',drag.id);
  var y=clamp(p.y,40,540),h=hw(y)-18;
  l.y=Math.round(y);l.x=Math.round(clamp(p.x,450-h,450+h));
  drag.el.setAttribute('transform','translate('+l.x+' '+l.y+')');
});
function endDrag(){
  if(!drag)return;
  var moved=drag.moved,id=drag.id;
  if(moved){sel={k:'loc',id:id};var dl2=byId('locations',id);if(dl2&&dl2.hid)wHid('locations',dl2,true);else setDirty();render();setTimeout(function(){drag=null},0)}
  else drag=null;
}
app.addEventListener('pointerup',endDrag);
app.addEventListener('pointercancel',endDrag);



/* in questa versione il salvataggio e' unico: ogni modifica segna la pagina come da salvare */
function hidBar(c,it){
  if(!ISOWNER||!it.hid)return '';
  return '<div class="ctl" style="margin:0 0 12px;align-items:center"><span class="secret" style="margin:0'+(it.revealed?';background:#2f6b3a':'')+'">'+(it.revealed?'Rivelato ai giocatori':'Nascosto ai giocatori')+'</span><button class="btn small'+(it.revealed?' danger':' pri')+'" data-act="revealh" data-coll="'+c+'" data-id="'+it.id+'">'+(it.revealed?'Nascondi di nuovo':'Rivela ai giocatori')+'</button></div>';
}
function wMember(){setDirty()}function wHid(){setDirty()}function wNotes(){setDirty()}function wMeta(){setDirty()}function wOrder(){setDirty()}function wDelete(){setDirty()}function wHidDelete(){setDirty()}function wHidOrder(){}
window.addEventListener('hashchange',function(){tab=tabFromHash();if(loaded)render()});

function norm(){
  S.council=S.council||[];S.councilIntro=S.councilIntro||'';S.custodi=S.custodi||[];S.custodiTitle=S.custodiTitle||'I Custodi della Brace';S.custodiIntro=S.custodiIntro||'';
  S.citTitle=S.citTitle||'La Cittadella Reale';S.citIntro=S.citIntro||'';S.citFeatures=S.citFeatures||'';S.citAtmos=S.citAtmos||'';S.citAreas=S.citAreas||[];
  S.citmap=(S.citmap&&S.citmap.length)?S.citmap:[{id:'m1',name:'Pianta della Cittadella Reale',photo:null}];
  S.society=S.society||[];S.guilds=S.guilds||[];S.locations=S.locations||[];
}
function note(t,err){
  var n=$('#note');if(!n){n=document.createElement('div');n.id='note';n.setAttribute('role','status');n.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:50;background:var(--ink-2);border:1px solid var(--gold);color:var(--fg);padding:10px 16px;max-width:90vw';document.body.appendChild(n)}
  n.style.borderColor=err?'var(--ember)':'var(--gold)';n.textContent=t;n.hidden=!t;
}
function fetchState(){
  if(ISOWNER){
    return api('/api/master/data',{cache:'no-store'}).then(function(r){
      if(r.status===401){store('kd-key',null);KEY='';showLogin(true);return null}
      if(r.status===503){showLogin(false,'Sul sito manca la variabile MASTER_PASSWORD (Netlify → Site configuration → Environment variables).');return null}
      return r.json();
    });
  }
  return fetch('/api/public',{cache:'no-store'}).then(function(r){return r.json()});
}
function showLogin(bad,text){
  app.innerHTML='<div class="wrap" style="max-width:420px;padding-top:12vh"><h1>Karak-Dûran</h1><p class="tag">Area riservata al Master.</p><form id="lg" class="fld dark" style="margin-top:20px"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required><p style="color:#ffb08a;margin:6px 0 0">'+esc(text||(bad?'Password errata.':''))+'</p><p style="margin-top:12px"><button class="btn pri" type="submit">Entra</button></p></form></div>';
  var f=$('#lg');f.addEventListener('submit',function(e){e.preventDefault();KEY=$('#pw').value;store('kd-key',KEY);boot()});
  var p=$('#pw');if(p)p.focus();
}
function renderEmpty(){
  app.innerHTML='<div class="wrap" style="max-width:560px;padding-top:12vh"><h1>Karak-Dûran</h1><p class="tag">'+(ISOWNER?'Il sito è vuoto. Usa il pulsante qui sotto per importare il file dei dati iniziali.':'Il sito non è ancora pronto. Riprova più tardi.')+'</p>'+(ISOWNER?'<p style="margin-top:20px"><button class="btn pri" data-act="import">Importa dati</button></p>':'')+'</div>';
}
function startUp(d){
  if(!d)return;
  if(d.empty){loaded=false;renderEmpty();return}
  S=d;norm();loaded=true;lastSig=JSON.stringify(d);tab=tabFromHash();
  if(ISOWNER){
    ASSETS={upload:function(b){return api('/api/upload',{method:'POST',headers:{'content-type':b.type||'image/jpeg'},body:b}).then(function(r){if(!r.ok)throw {code:r.status===401?'auth':'http'};return r.json()})}};
  }
  render();
}
function boot(){
  fetchState().then(startUp).catch(function(){app.innerHTML='<div class="wrap" style="padding-top:12vh"><p class="tag">Non riesco a contattare il server. Riprova tra poco.</p></div>'});
}

/* giocatori: la pagina si aggiorna da sola quando il Master rivela qualcosa */
if(!ISOWNER){
  setInterval(function(){
    if(document.hidden)return;
    fetch('/api/public',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
      var sig=JSON.stringify(d);if(sig===lastSig)return;
      lastSig=sig;
      if(d.empty){return}
      S=d;norm();var wasLoaded=loaded;loaded=true;tab=tabFromHash();render();
    }).catch(function(){});
  },window.KD_POLL||15000);
}

/* importazione dei dati iniziali (solo Master) */
var imp=document.createElement('input');imp.type='file';imp.accept='application/json,.json';imp.hidden=true;document.body.appendChild(imp);
function b64bytes(b){var bin=atob(b),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
imp.addEventListener('change',function(){
  var f=imp.files&&imp.files[0];if(!f)return;
  if(!confirm('Importare questi dati? Sostituiranno quelli attuali del sito.'))return;
  f.text().then(function(t){
    var d=JSON.parse(t);if(!d||!d.state)throw new Error('file non valido');
    var ids=Object.keys(d.images||{}),n=0;
    note('Importazione in corso...');
    return api('/api/master/data',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(d.state)}).then(function(r){
      if(!r.ok)throw new Error('dati rifiutati ('+r.status+')');
      var chain=Promise.resolve();
      ids.forEach(function(id){chain=chain.then(function(){
        return api('/api/img/'+id,{method:'PUT',headers:{'content-type':'image/jpeg'},body:b64bytes(d.images[id])}).then(function(r){if(!r.ok)throw new Error('foto rifiutata ('+r.status+')');n++;note('Foto caricate: '+n+' / '+ids.length)});
      })});
      return chain;
    }).then(function(){note('Importazione completata.');setTimeout(function(){location.reload()},900)});
  }).catch(function(e){note('Importazione non riuscita: '+(e&&e.message||e),true)});
  imp.value='';
});
app.addEventListener('click',function(e){var b=e.target.closest('[data-act=import]');if(b)imp.click()});

boot();
})();
