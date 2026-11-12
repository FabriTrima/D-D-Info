/* Zhar-Khazad: API su /zk-api/*. Stessa password del Master di Karak-Duran (MASTER_PASSWORD). */
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import INIZIALE from './zk-iniziale.mjs';

const MAX_STATE = 2 * 1024 * 1024;
const MAX_IMG = 6 * 1024 * 1024;
const META_F = ['title', 'subtitle', 'tagline', 'city', 'cityText', 'motto'];

/* Cio' che vedono i giocatori: solo schede e voci visibili, niente note, segreti solo se rivelati. */
export function publicView(S) {
  const m = S.meta || {};
  const P = { meta: {}, data: {} };
  META_F.forEach((k) => { P.meta[k] = m[k] || ''; });
  P.meta.tabs = (m.tabs || []).filter((t) => t.vis !== false)
    .map((t) => ({ id: t.id, name: t.name || '', kind: t.kind, intro: t.intro || '', map: t.map || null }));
  for (const t of P.meta.tabs) {
    P.data[t.id] = ((S.data || {})[t.id] || []).filter((it) => it.vis !== false).map((it) => {
      const o = JSON.parse(JSON.stringify(it));
      delete o.notes; delete o.vis;
      if (!o.secretVis) delete o.secret;
      delete o.secretVis;
      return o;
    });
  }
  return P;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
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

async function getState(store) {
  let S = await store.getJSON('state');
  if (!S) { S = JSON.parse(JSON.stringify(INIZIALE)); await store.setJSON('state', S); }
  return S;
}

export async function handle(req, store, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/zk-api\/?/, '').replace(/\/$/, '');
  const m = req.method;

  if (path === 'public' && m === 'GET') return json(publicView(await getState(store)));

  if (path.startsWith('img/') && m === 'GET') {
    const id = path.slice(4);
    if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: 'not_found' }, 404);
    const b = await store.getBin('img:' + id);
    if (!b) return json({ error: 'not_found' }, 404);
    return new Response(b.data, { status: 200, headers: { 'content-type': b.type, 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  if (path.startsWith('master') || path === 'upload') {
    const a = authed(req, env);
    if (a === 'noconfig') return json({ error: 'no_password_configured' }, 503);
    if (a !== 'ok') { await sleep(500); return json({ error: 'unauthorized' }, 401); }

    if (path === 'master/data' && m === 'GET') return json(await getState(store));
    if (path === 'master/data' && m === 'PUT') {
      const txt = await req.text();
      if (txt.length > MAX_STATE) return json({ error: 'too_large' }, 413);
      let S;
      try { S = JSON.parse(txt); } catch (e) { return json({ error: 'bad_json' }, 400); }
      if (!S || typeof S !== 'object' || !S.meta || !Array.isArray(S.meta.tabs) || !S.data || typeof S.data !== 'object') return json({ error: 'bad_state' }, 400);
      await store.setJSON('state', { meta: S.meta, data: S.data });
      return json({ ok: true });
    }
    if (path === 'upload' && m === 'POST') {
      const type = (req.headers.get('content-type') || '').split(';')[0];
      if (!/^image\//.test(type)) return json({ error: 'not_image' }, 400);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_IMG) return json({ error: 'too_large' }, 413);
      const id = randomUUID().replace(/-/g, '');
      await store.setBin('img:' + id, buf, type);
      return json({ id, url: '/zk-api/img/' + id });
    }
  }
  return json({ error: 'not_found' }, 404);
}
