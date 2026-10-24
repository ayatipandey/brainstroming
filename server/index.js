import express from 'express';
import { BRAND } from '../shared/brand.config.js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decide } from '../shared/scoring.js';
import { CATEGORY_IDS, MOMENTS, MERCHANTS } from '../shared/catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(readFileSync(path.join(here, '../shared/model.json'), 'utf8'));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '16kb' }));

function validate(body) {
  const errors = [];
  const places = ['elsewhere', ...MERCHANTS.map((m) => m.id)];
  if (!places.includes(body.place)) errors.push(`place must be one of: ${places.join(', ')}`);
  if (typeof body.time !== 'number' || body.time < 0 || body.time >= 24) errors.push('time must be an hour from 0 to 23.99');
  const favs = Array.isArray(body.favorites) ? body.favorites : Object.keys(body.favorites || {});
  if (favs.some((f) => !CATEGORY_IDS.includes(f))) errors.push(`favorites must be categories: ${CATEGORY_IDS.join(', ')}`);
  if (body.daysUntilExpiry != null && (typeof body.daysUntilExpiry !== 'number' || body.daysUntilExpiry < 0)) errors.push('daysUntilExpiry must be a number of days, or null');
  if (body.specialMoment != null && !(body.specialMoment in MOMENTS)) errors.push(`specialMoment must be one of: ${Object.keys(MOMENTS).join(', ')}`);
  return errors;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, model: model.kind, data: model.data }));

app.get('/api/model', (_req, res) => {
  const { metrics, roc, rows, baseRate, features, weights, bias, threshold, note, trainedAt } = model;
  res.json({ metrics, roc, rows, baseRate, features, weights, bias, threshold, note, trainedAt });
});

// POST /api/score
// { place, time, favorites, daysUntilExpiry, specialMoment, policy? }
// -> { send, offerId, score, threshold, reasons, method, held }
app.post('/api/score', async (req, res) => {
  const errors = validate(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Invalid request', details: errors });
  // Demo hook: lets the control panel show the on-device fallback.
  const delay = Math.min(Number(req.get('x-demo-delay')) || 0, 5000);
  if (delay) await new Promise((r) => setTimeout(r, delay));
  res.json(decide(req.body, { model, method: 'server-model' }));
});

const dist = path.join(here, '../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`${BRAND.name} API on http://localhost:${PORT}`));
