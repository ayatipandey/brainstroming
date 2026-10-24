# Perk Predict (working name)

A rewards app for the FIS Innovation Challenge. The name, tagline and business details live in `shared/brand.config.js`; the name is a placeholder until one is chosen.

Sign up, link a card, and pay as usual. Card payments earn points, the reward you are most likely to use sits on top, and your best reward applies itself when you pay with a linked card.

## Run it

```bash
npm run install:all
npm run dev
```

- Website and app: http://localhost:5173 (sign up at `/app/sign-up`)
- API: http://localhost:3001
- Email in development is written to `server/outbox/` and printed in the terminal, including the confirmation link.

Requires Node 22.5 or newer (uses the built-in `node:sqlite`). The database is `server/data/app.db`.

### Team tools (development only)

`/dev/simulator` is a team-only page for live presentations. It sends card transactions through the real ingestion path, confirms emails and grants admin. It is not linked from the app, it is compiled out of production builds, and the server turns `/api/dev` off in production. Set `ENABLE_DEV_TOOLS=1` to turn both on in a production build for a rehearsal.

Admins can review offers at `/app/admin`.

## Production

```bash
npm run build      # fails until business details are filled in shared/brand.config.js
NODE_ENV=production node server/index.js
```

| Variable | Purpose |
|---|---|
| `NODE_ENV=production` | Secure cookies, dev tools off, placeholder offers hidden |
| `APP_URL` | Public URL, used in email links and the same-origin check |
| `INGEST_API_KEY` | Required key for `POST /api/ingest/transactions` |
| `MAIL_PROVIDER` | Must be set (and wired to a provider) before sign-up works in production |
| `SHOW_PLACEHOLDER_OFFERS=1` | Show unconfirmed offers (pilots only) |
| `DB_FILE` | Database path |
| `ALLOW_MISSING_BUSINESS_DETAILS=1` | Internal preview builds only |

## Transaction ingestion

`POST /api/ingest/transactions` with header `x-ingest-key`:

```json
{ "externalId": "txn_123", "cardRef": "card_…", "merchantId": "campus-coffee", "amount": 4.20, "occurredAt": "2026-10-24T14:47:00Z" }
```

Idempotent on `externalId`: sending the same transaction again returns the first result and changes nothing. If auto-apply is on for the card and the customer has the points, the best eligible reward at that store is applied, and the soonest-expiring points are spent first.

## Ranking

A logistic regression trained on synthetic data (`model/`) ranks each person's rewards from the time of day, their favorites and how soon each reward ends, with plain-language reasons ("Why this offer"). On held-out synthetic data it beats a rules baseline; it has not been tested with real customers. Retrain with `npm run train`.

## Rename

1. Change `name` (and `tagline` if needed) in `shared/brand.config.js`.
2. Run `node scripts/brand-assets.mjs` to regenerate the icons and social image.

## Docs

- `COMPLIANCE.md`: what was checked, results, and who must act
- `CREDITS.md`: sources and licenses of everything shipped
- `PRODUCT.md`, `DESIGN.md`: product and design records
