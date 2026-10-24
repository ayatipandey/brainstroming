import { decide } from '@shared/scoring.js';
import model from '@shared/model.json';

export const API_TIMEOUT_MS = 2000;

/**
 * Score a moment on the server; if it has not answered within 2 seconds
 * (or fails), score on the device with the same bundled model.
 */
export async function scoreMoment(req, { demoDelay = 0 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(demoDelay ? { 'x-demo-delay': String(demoDelay) } : {}) },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`API answered ${res.status}`);
    const data = await res.json();
    return { ...data, source: 'server', ms: Math.round(performance.now() - started) };
  } catch (err) {
    const local = decide(req, { model, method: 'device-model' });
    const why = err.name === 'AbortError' ? 'The server took longer than 2 seconds' : 'The server could not be reached';
    return { ...local, source: 'device', fallbackReason: why, ms: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timer);
  }
}
