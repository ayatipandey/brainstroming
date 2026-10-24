# Perk Predict

A predictive loyalty prototype for the FIS Innovation Challenge ("Predictive Loyalty Engine").

People earn loyalty points and never use them. The FIS brief puts the lost value at $42B a year. Antavo's Global Customer Loyalty Report 2026 finds 26.2% of points go unspent, and 41.1% are frustrated by expiring points. We think this is a timing and relevance problem, not a generosity problem.

Perk Predict keeps it simple: one list of rewards with the one you are most likely to use on top. Tap a reward to show a QR code and a written code, or just pay with a linked card and the best reward applies itself. Using rewards earns points, and points unlock better rewards.

> Prototype. Every person, store, bank, balance and reward is demo data. No real payments are made and no card numbers or passwords exist anywhere in the code.

## Run it

```bash
npm run install:all
npm run dev
```

Open http://localhost:5173.

| Page | Path |
|---|---|
| Home | `/` |
| How it works | `/how-it-works` |
| Tiers and terms | `/tiers` |
| FAQ and accessibility settings | `/faq` |
| The app (sign in with any first name) | `/app` |

The API runs on http://localhost:3001. Retrain the model with `npm run train` (Python 3, standard library only).

## The app

- **Rewards**: your tier and points, the top pick ("Best for right now") with its reasons and an expiry clock, then every reward ranked by how likely you are to use it. Search by reward or store, filter by category, or show only starred rewards. Locked rewards for the next tier are listed below.
- **Reward**: a QR code and a written code together, buttons to mark it used or to pay with the linked card (demo), and the terms in plain words: what you get, where, valid until, how many times, minimum spend, points you earn, what happens with a linked card, and anything else.
- **Auto-apply**: paying with a linked card applies your best eligible reward at that store, marks it used, adds points, and updates the list and Activity. Turn it off in Account to use codes instead. Try it from a reward or from Account, "Try a card purchase".
- **Tiers**: Member, Silver (600 points), Gold (1,250) and Platinum (2,500). Paying earns 10 points per dollar and each reward adds a bonus. Reaching a tier unlocks its rewards and shows a notice.
- **Activity** and **Account** (card, auto-apply, text size, contrast, motion, sign out, reset demo data).

## Ranking

Rewards are ranked by a logistic regression trained on synthetic data (`model/`), using the time of day, the rewards and categories you star, and how soon each reward ends. On held-out synthetic people it beats the published rules baseline (AUC 0.819 against 0.781; precision at 1, 63% against 60%). The data is synthetic, so this shows the pipeline works, not that it lifts results for real customers.

`POST /api/score` still scores a single moment against the rules-plus-model engine; see `shared/scoring.js`.

## Code

| Path | What it holds |
|---|---|
| `client/src/site` | The four website pages |
| `client/src/app` | The app: store, screens, sign in |
| `client/src/components` | Parts shared by both, including the phone preview that renders the real app |
| `shared/` | Catalog, tiers and terms, ranking, card payments, model scoring, `model.json` |
| `server/` | Express API |
| `model/` | Synthetic data generator and training |

## Privacy and accessibility

- The card keeps only the bank name and the last four digits. No location, no birthday.
- Built to meet WCAG 2.1 AA (not certified): visible focus, keyboard and screen-reader support, 48px tap targets, focus moves to the new heading on each screen, text at 16px or more, live text size, high contrast and reduced motion settings. All 3D and scroll effects switch off under reduced motion.

## Roadmap (not built)

Cross-program balances, real card payments through FIS Premium Payback, a merchant view, and validation on real FIS data after a privacy review.
