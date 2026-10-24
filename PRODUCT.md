# Product

<!-- impeccable:product-schema 1 -->

> Written from the project brief without a separate interview. Every fact below comes from that brief; nothing here was invented.

## Platform

web

## Stack

React 18, Vite, React Router, Express. Motion: gsap (ScrollTrigger), lenis, three. Python (standard library only) for the synthetic data generator and model training. The repo runs with `npm run install:all` and `npm run dev`.

## Users

Everyday cardholders (general population, not only students) who earn loyalty points and rarely use them. Secondary audiences: banks, which lose engagement, and merchants, which fund offers nobody claims. Evaluators: FIS Innovation Challenge judges ("Predictive Loyalty Engine").

## Product Purpose

Perk Predict is a mobile-first decision layer on top of FIS products (Loyalty Engagement Solutions, Premium Payback, Transaction-Level Offers, Campaign Manager). It reads the moment (time, place, spending habits by category, favorite brands, special moments, points about to expire), decides to send one offer or stay quiet, explains why, and lets the user redeem in three steps.

## Positioning

Unused points are a timing and relevance problem, not a generosity problem. Typical programs (Chase Ultimate Rewards, Starbucks Rewards, Discover it) wait for the customer to come to them. Perk Predict comes to the customer at the right moment, and also knows when to stay quiet.

## Capabilities and Constraints

- Sign in, then one Rewards screen: tier and points, the most likely reward on top with its reasons, then all rewards ranked by likelihood. Search, category filter, and stars.
- Reward detail shows a QR code and a written code together, plus the same eight plain-language terms on every reward.
- A linked card (bank name and last four digits only) applies the best eligible reward automatically when you pay; the list, points and Activity update. Payments are simulated; a real deployment sits on FIS Premium Payback.
- Tiers: Member, Silver (600), Gold (1,250), Platinum (2,500) lifetime points. 10 points per dollar paid plus a bonus per reward used. Each tier unlocks better rewards.
- Ranking: logistic regression trained on synthetic data, compared with a rules baseline. No lift on real customers may be claimed.
- Roadmap (not built): cross-program balances, real card payments, a merchant view, validation on real FIS data after a privacy review.

## Brand Commitments

Name: Perk Predict. The FIS color theme is no longer used (user request). Typeface: Atkinson Hyperlegible (Next). Plain white page.

## Evidence on Hand

- FIS brief: $42B a year in lost loyalty value.
- Antavo, Global Customer Loyalty Report 2026: 26.2% of points go unspent; 41.1% are frustrated by expiring points.
- Quote each figure with its source and never merge them. There are no customers, testimonials, reviews, or real-world results. All model data is synthetic, and no lift on real customers may be claimed.

## Product Principles

1. Restraint is a feature: silence is a decision the engine explains.
2. Every nudge says why.
3. Expiring value first.
4. Keep the minimum data: no card numbers, passwords, or birthdays; location is opt-in and only used while the app is open.
5. Be honest about what is a prototype.

## Accessibility & Inclusion

Built to meet WCAG 2.1 AA (never "certified"): visible focus, keyboard and screen-reader support, 48px tap targets, focus moves to the new heading on each step, text at 16px or more in full ink. Live text-size, high-contrast, and reduced-motion controls.
