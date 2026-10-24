// Outgoing email. In development, messages are written to server/outbox and
// the link is printed, so the team can verify accounts without a provider.
// Production needs a real provider (see COMPLIANCE.md); until one is set,
// sending fails loudly instead of pretending.
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isProd } from './auth.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outbox = path.join(here, 'outbox');

export async function sendMail({ to, subject, text }) {
  if (isProd && !process.env.MAIL_PROVIDER) {
    throw new Error('Email delivery is not configured. Set MAIL_PROVIDER and its credentials.');
  }
  mkdirSync(outbox, { recursive: true });
  const file = path.join(outbox, `${Date.now()}-${to.replace(/[^a-z0-9@.]/gi, '_')}.txt`);
  writeFileSync(file, `To: ${to}\nSubject: ${subject}\n\n${text}\n`);
  console.log(`[mail] ${subject} -> ${to}\n${text}\n`);
}

export function recentMail(limit = 20) {
  try {
    return readdirSync(outbox).sort().reverse().slice(0, limit).map((f) => readFileSync(path.join(outbox, f), 'utf8'));
  } catch {
    return [];
  }
}
