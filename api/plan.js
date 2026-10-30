// One shared site plan for everyone who opens the page, kept in Vercel Blob.
import { put, head } from '@vercel/blob';

const PATH = 'yard/plan.json';
const MAX_BYTES = 3_000_000;

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    let meta;
    try { meta = await head(PATH); }
    catch (e) { return res.status(200).json(null); }   // nothing saved yet
    try {
      const r = await fetch(`${meta.url}?v=${Date.parse(meta.uploadedAt)}`, { cache: 'no-store' });
      return res.status(200).json(await r.json());
    } catch (e) {
      return res.status(502).json({ error: 'read failed' });
    }
  }
  if (req.method === 'PUT') {
    let plan;
    try { plan = await readBody(req); } catch (e) { return res.status(400).json({ error: 'bad json' }); }
    if (!plan || !Array.isArray(plan.buildings)) return res.status(400).json({ error: 'not a site plan' });
    const updatedAt = Date.now();
    const json = JSON.stringify({ buildings: plan.buildings, areas: plan.areas || [], strokes: plan.strokes || [], updatedAt });
    if (json.length > MAX_BYTES) return res.status(413).json({ error: 'plan too large' });
    await put(PATH, json, { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
    return res.status(200).json({ ok: true, updatedAt });
  }
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'method not allowed' });
}
