# Perk Predict

A predictive loyalty prototype for the FIS Innovation Challenge ("Predictive Loyalty Engine").

People earn loyalty points and never use them. The FIS brief puts the lost value at $42B a year. Antavo's Global Customer Loyalty Report 2026 finds 26.2% of points go unspent, and 41.1% are frustrated by expiring points. We think this is a timing and relevance problem, not a generosity problem.

Perk Predict is a mobile-first decision layer on top of FIS products (Loyalty Engagement Solutions, Premium Payback, Transaction-Level Offers, Campaign Manager). It reads the moment, decides to send one offer or stay quiet, explains why, and lets the user redeem in three steps.

> Prototype. Every person, merchant, bank, balance and the model's training data is synthetic demo data. No real payments are made and no card numbers or passwords exist anywhere in the code.

## Run it

```bash
npm run install:all
npm run dev
```

- Web: http://localhost:5173 (landing page at `/`, app at `/app`, demo panel at `/app/demo`)
- API: http://localhost:3001

Retrain the model (Python 3, standard library only):

```bash
npm run train
```

## What is where

| Path | What it holds |
|---|---|
| `client/` | React 18 + Vite + React Router. Landing page, account page, app screens. GSAP + ScrollTrigger, Lenis, and three.js (lazy-loaded) for motion. |
| `server/` | Express. `POST /api/score`, `GET /api/model`, `GET /api/health`. Serves `client/dist` in production. |
| `shared/` | Code used by both sides: catalog, rules baseline, model scoring, auto-apply rules, and `model.json`. |
| `model/` | `generate_data.py` (synthetic moments) and `train.py` (logistic regression, metrics, ROC curves). |

## The engine

**Rules baseline** (as specified): start at 0.5; minus 0.25 outside a category's usual hours, plus 0.15 inside; plus 0.15 for a favorite category; plus 0.10 for a special moment; plus 0.10 when points expire within 14 days; clamp to 0 to 0.99; send at 0.70 or higher. Category windows: coffee 7 to 16, food 11 to 14 and 17 to 21, books 9 to 17, groceries 10 to 20.

**Model**: a logistic regression on seven features (inside usual hours, favorite, special moment, expiry urgency, near the merchant, late night, favorite × inside hours), trained with Newton's method on 84,000 synthetic moments and exported as `shared/model.json`. Held-out synthetic people:

| Measure | Trained model | Rules baseline |
|---|---|---|
| AUC | 0.819 | 0.781 |
| Precision at 1 (top moment per person-day was used) | 63.2% | 60.1% |
| Moments at or above 70% | 13.7% | 27.7% |

The data is synthetic, so these numbers show the pipeline works end to end. They say nothing about lift on real customers.

**Policy on top of the score**: daily limit of 1 to 3 nudges, quiet hours, and payment confirmations that are always shown.

### API

`POST /api/score`

```json
{ "place": "campus-coffee", "time": 14.78, "favorites": ["coffee", "books"],
  "daysUntilExpiry": 3, "specialMoment": "none",
  "policy": { "quietHours": { "on": true, "start": 22, "end": 7 }, "dailyLimit": 2, "sentToday": 0 } }
```

returns

```json
{ "send": true, "offerId": "cc-drip", "score": 0.93, "threshold": 0.7,
  "reasons": [{ "text": "Points expire in 3 days", "effect": "up", "amount": "raises" }],
  "method": "server-model", "held": null }
```

The app aborts the request after 2 seconds and scores on the device with the same bundled model. The demo panel's "Slow the server down" switch adds a 3 second delay so you can see the fallback.

## Auto-apply and payments (simulated)

A linked card can turn on "Apply my points automatically" (off by default), with a per-purchase limit and the categories it covers. In a real deployment this sits on FIS Premium Payback. "Simulate a payment" in the demo panel checks the rules (switch on, category allowed, within the limit, enough points), uses expiring points first, shows the amount before and after, sends a confirmation with "Why this was applied" and a 10-second Undo, logs the purchase to Activity, and raises the saved-from-expiring total. With auto-apply off, the app asks "Apply points now?" instead.

The demo run (demo panel, "Start the demo run") ends with a $4.20 payment at Campus Coffee: 300 points cover $3.00, so you pay $1.20.

## Privacy and accessibility

- Cards keep only the bank name, the last four digits and spending categories. The bank sign-in is a mock with no fields.
- Location is opt-in and only used while the app is open. No birthday data.
- Built to meet WCAG 2.1 AA (not certified): visible focus, keyboard and screen-reader support, 48px tap targets, focus moves to the new heading on each step, text at 16px or more. Live text size, high contrast and reduced motion settings. Every motion effect respects `prefers-reduced-motion` and the in-app setting.

## Roadmap (not built)

Cross-program balance view, expiry forecast, auto-apply on real checkouts, a merchant view, and validation on real FIS data after a privacy review.
