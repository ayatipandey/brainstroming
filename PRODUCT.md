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

- Predictive scoring with a "Why this offer" explanation. Rules baseline: start 0.5; minus 0.25 outside a category's usual hours, plus 0.15 inside; plus 0.15 favorite category; plus 0.10 special moment; plus 0.10 expiring points; clamp 0 to 0.99; send at 0.70 or higher. Category windows: coffee 7 to 16, food 11 to 14 and 17 to 21, books 9 to 17, groceries 10 to 20.
- A logistic regression trained on synthetic data, exported as model.json, scores on the server; the app falls back to on-device scoring after 2 seconds.
- Quiet by default: 70% threshold, daily limit of 1 to 3, quiet hours. Payment confirmations are always shown.
- Expiring points first, drawn as a 14-day clock. Three-step redeem.
- Favorite brands per category, always visible. Mock card linking (only bank name, last four digits, and spending categories are kept).
- Auto-apply (simulated, off by default): per-purchase limit and categories; sits on FIS Premium Payback in a real deployment. Simulated payment events with confirmation, reasons, and Undo.
- Saved-from-expiring total, five badges, daily perk reveal, calendar moments, accent-color themes, opt-in weekly challenge with anonymous demo totals, live demo control panel.
- Roadmap (not built): cross-program balance view, expiry forecast, merchant view, validation on real FIS data after a privacy review.

## Brand Commitments

Name: Perk Predict. FIS colors: green #4bcd3e (actions), dark teal #012834 (fields), teal #015b7e, blue #285bc5. Typeface: Atkinson Hyperlegible. Plain white page. Yellow is used only on the expiry clock.

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
