import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';

const NCOLL = ['locations', 'society', 'guilds', 'council'];
const MAX_STATE = 1.5 * 1024 * 1024;
const MAX_IMG = 5 * 1024 * 1024;

/* Cio' che vedono i giocatori: niente note, niente elementi nascosti, solo i custodi rivelati. */
export function publicView(S) {
  const P = JSON.parse(JSON.stringify(S));
  for (const c of NCOLL) {
    P[c] = (P[c] || []).filter((it) => !(it.hid && !it.revealed)).filter((it) => c !== 'council' || it.revealed);
    P[c].forEach((it) => {
      delete it.notes; delete it.hid; delete it.revealed; delete it.notesRevealed;
      if ((c === 'guilds' || c === 'council') && !it.photoRevealed) delete it.photo;
      delete it.photoRevealed;
      if (c === 'guilds') it.members = (it.members || []).filter((m) => m.revealed).map((m) => ({ id: m.id, name: m.name, text: m.text, revealed: true, dead: !!m.dead }));
    });
  }
  P.custodi = (P.custodi || []).filter((m) => m.revealed);
  P.custodi.forEach((m) => { delete m.notes; delete m.revealed; });
  if (!P.custodi.length) { P.custodi = []; P.custodiTitle = ''; P.custodiIntro = ''; }
  return P;
}

const COLLS = ['locations', 'society', 'guilds', 'council', 'custodi', 'citAreas'];
const MAX_PN_TOTAL = 400 * 1024;

/* note condivise dei giocatori: tenute a parte, cosi' il salvataggio del Master non le sovrascrive */
function visibleKeys(P) {
  const ok = new Set();
  for (const c of COLLS) (P[c] || []).forEach((it) => ok.add(c + ':' + it.id));
  return ok;
}
function pnFor(P, pn) {
  const ok = visibleKeys(P), out = {};
  for (const k of Object.keys(pn || {})) {
    let v = pn[k];
    if (Array.isArray(v)) v = { text: v.map((e) => (e.by ? e.by + ': ' : '') + e.text).filter(Boolean).join('\n') };
    if (ok.has(k) && v && v.text) out[k] = v;
  }
  return out;
}

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra }
  });
}

function digest(s) { return createHash('sha256').update(String(s)).digest(); }

function authed(req, env) {
  const pw = env('MASTER_PASSWORD');
  if (!pw) return 'noconfig';
  const k = req.headers.get('x-master-key') || '';
  return timingSafeEqual(digest(k), digest(pw)) ? 'ok' : 'bad';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function handle(req, store, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const m = req.method;

  if (path === 'public' && m === 'GET') {
    const S = await store.getJSON('state');
    if (!S) return json({ empty: true });
    const P = publicView(S);
    P.pnotes = pnFor(P, (await store.getJSON('pnotes')) || {});
    return json(P);
  }

  if (path === 'pnote' && m === 'POST') {
    const txt = await req.text();
    if (txt.length > 8000) return json({ error: 'too_large' }, 413);
    let b; try { b = JSON.parse(txt); } catch (e) { return json({ error: 'bad_json' }, 400); }
    const key = String((b && b.key) || '');
    if (!/^(locations|society|guilds|council|custodi|citAreas):[A-Za-z0-9_-]{1,40}$/.test(key)) return json({ error: 'bad_key' }, 400);
    const S = await store.getJSON('state');
    if (!S) return json({ error: 'not_found' }, 404);
    const P = authed(req, env) === 'ok' ? S : publicView(S);
    if (!visibleKeys(P).has(key)) return json({ error: 'not_found' }, 404);
    const text = String(b.text == null ? '' : b.text).slice(0, 3000);
    const pn = (await store.getJSON('pnotes')) || {};
    if (text.trim()) pn[key] = { text, t: Date.now() }; else delete pn[key];
    if (JSON.stringify(pn).length > MAX_PN_TOTAL) return json({ error: 'too_large' }, 413);
    await store.setJSON('pnotes', pn);
    return json({ ok: true });
  }

  if (path.startsWith('img/') && m === 'GET') {
    const id = path.slice(4);
    if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: 'not_found' }, 404);
    const b = await store.getBin('img:' + id);
    if (!b) return json({ error: 'not_found' }, 404);
    return new Response(b.data, { status: 200, headers: { 'content-type': b.type, 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  if (path.startsWith('master') || path === 'upload' || (path.startsWith('img/') && m !== 'GET')) {
    const a = authed(req, env);
    if (a === 'noconfig') return json({ error: 'no_password_configured' }, 503);
    if (a !== 'ok') { await sleep(500); return json({ error: 'unauthorized' }, 401); }

    if (path === 'master/check' && m === 'GET') return json({ ok: true });

    if (path === 'master/data' && m === 'GET') {
      const S = await store.getJSON('state');
      if (!S) return json({ empty: true });
      S.pnotes = pnFor(S, (await store.getJSON('pnotes')) || {});
      return json(S);
    }
    if (path === 'master/pnotes' && m === 'GET') return json(pnFor((await store.getJSON('state')) || {}, (await store.getJSON('pnotes')) || {}));
    if (path === 'master/data' && m === 'PUT') {
      const txt = await req.text();
      if (txt.length > MAX_STATE) return json({ error: 'too_large' }, 413);
      let S;
      try { S = JSON.parse(txt); } catch (e) { return json({ error: 'bad_json' }, 400); }
      if (!S || typeof S !== 'object' || Array.isArray(S) || !Array.isArray(S.levels) || !Array.isArray(S.locations)) return json({ error: 'bad_state' }, 400);
      delete S.pnotes;
      await store.setJSON('state', S);
      return json({ ok: true });
    }
    if (path === 'upload' && m === 'POST') {
      const type = (req.headers.get('content-type') || '').split(';')[0];
      if (!/^image\//.test(type)) return json({ error: 'not_image' }, 400);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_IMG) return json({ error: 'too_large' }, 413);
      const id = randomUUID().replace(/-/g, '');
      await store.setBin('img:' + id, buf, type);
      return json({ id, url: '/api/img/' + id });
    }
    if (path.startsWith('img/') && m === 'PUT') {
      const id = path.slice(4);
      if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: 'bad_id' }, 400);
      const type = (req.headers.get('content-type') || '').split(';')[0];
      if (!/^image\//.test(type)) return json({ error: 'not_image' }, 400);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_IMG) return json({ error: 'too_large' }, 413);
      await store.setBin('img:' + id, buf, type);
      return json({ id, url: '/api/img/' + id });
    }
  }
  return json({ error: 'not_found' }, 404);
}
