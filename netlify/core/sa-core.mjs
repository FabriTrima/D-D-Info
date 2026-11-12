/* Santuario degli Antenati: API su /sa-api/*. Stessa password del Master di Karak-Duran (MASTER_PASSWORD). */
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import INIZIALE from './sa-iniziale.mjs';

const MAX_STATE = 2 * 1024 * 1024;
const MAX_IMG = 6 * 1024 * 1024;

/* Cio' che vedono i giocatori: solo stanze rivelate e sezioni visibili; mai le note del Master. */
export function publicView(S) {
  const m = S.meta || {};
  const P = { meta: { title: m.title || '', subtitle: m.subtitle || '', notes: m.notes || '', map: m.map || null }, rooms: [] };
  for (const r of (S.rooms || [])) {
    if (!r || !r.revealed) continue;
    P.rooms.push({
      id: r.id, num: r.num || '', name: r.name || '', subtitle: r.subtitle || '', order: r.order,
      geo: r.geo || null, revealed: true,
      images: (r.images || []).filter((im) => im && im.vis !== false).map((im) => ({ id: im.id, url: im.url, caption: im.caption || '' })),
      sections: (r.sections || []).filter((s) => s && s.vis !== false).map((s) => ({ id: s.id, kind: s.kind, title: s.title || '', body: s.body || '' }))
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
function same(a, b) { return timingSafeEqual(digest(a), digest(b)); }
function authed(req, env) {
  const pw = env('MASTER_PASSWORD');
  if (!pw) return 'noconfig';
  const cands = [];
  const enc = req.headers.get('x-master-key-enc');
  if (enc) { try { cands.push(decodeURIComponent(enc)); } catch (e) {} }
  const raw = req.headers.get('x-master-key');
  if (raw) cands.push(raw);
  const want = [String(pw), String(pw).trim()];
  for (const c of cands) for (const w of want) if (same(c, w) || same(c.trim(), w)) return 'ok';
  return 'bad';
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getState(store) {
  let S = await store.getJSON('state');
  if (!S) { S = JSON.parse(JSON.stringify(INIZIALE)); await store.setJSON('state', S); }
  return S;
}

export async function handle(req, store, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/sa-api\/?/, '').replace(/\/$/, '');
  const m = req.method;

  if (path === 'stato' && m === 'GET') return json({ ok: true, password: !!env('MASTER_PASSWORD') });

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
      if (!S || typeof S !== 'object' || !S.meta || typeof S.meta !== 'object' || !Array.isArray(S.rooms)) return json({ error: 'bad_state' }, 400);
      await store.setJSON('state', { meta: S.meta, rooms: S.rooms });
      return json({ ok: true });
    }
    if (path === 'upload' && m === 'POST') {
      const type = (req.headers.get('content-type') || '').split(';')[0];
      if (!/^image\//.test(type)) return json({ error: 'not_image' }, 400);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_IMG) return json({ error: 'too_large' }, 413);
      const id = randomUUID().replace(/-/g, '');
      await store.setBin('img:' + id, buf, type);
      return json({ id, url: '/sa-api/img/' + id });
    }
  }
  return json({ error: 'not_found' }, 404);
}
