import { getStore } from '@netlify/blobs';
import { handle } from '../core/zk-core.mjs';

function makeStore() {
  const s = getStore({ name: 'zhar-khazad', consistency: 'strong' });
  return {
    async getJSON(key) { return await s.get(key, { type: 'json' }); },
    async setJSON(key, val) { await s.setJSON(key, val); },
    async getBin(key) {
      const r = await s.getWithMetadata(key, { type: 'arrayBuffer' });
      return r ? { data: r.data, type: (r.metadata && r.metadata.type) || 'image/jpeg' } : null;
    },
    async setBin(key, buf, type) { await s.set(key, buf, { metadata: { type } }); }
  };
}

function env(k) {
  try { if (typeof Netlify !== 'undefined' && Netlify.env) return Netlify.env.get(k); } catch (e) {}
  return process.env[k];
}

export default async (req) => handle(req, makeStore(), env);

export const config = { path: '/zk-api/*' };
