# Compliance and quality checklist

Prepared by the build team on 24 October 2026 for branch `product-hardening`. **This is not legal advice.** Every legal page in the app is a draft marked for review, and the rows marked "Lawyer" or "FIS compliance" need a qualified person to sign off.

Product name is still a placeholder (`shared/brand.config.js`).

| # | Item | What we checked | How | Result | Who must act |
|---|---|---|---|---|---|
| 1 | Colour contrast, all text and controls | Every page and state at 390, 768 and 1440 px, normal and high-contrast modes; text on glass and on the bare colour field | axe-core 4.10 on 19 pages/states × 3 widths; a contrast script for text over glass (72% white) and the bare field, using the brightest field colour (apricot) as worst case | **Pass.** axe: 0 violations. Worst computed pairs: secondary text 5.5:1, links 5.6:1, green text 5.6:1 on the bare field; 6.2:1 or better on glass. Found and fixed: link, secondary and green-text tokens failed on bare apricot (4.35:1, 3.85:1) and were darkened. axe cannot measure text over `backdrop-filter`; the script covers that case. | None |
| 2 | Alt text and decorative images | Every image, SVG and logo | axe (image-alt, svg-img-alt, role-img-alt); code review | **Pass.** Store marks are `role="img"` with the store name as label. Decorative SVGs, the 3D coin and the colour field are `aria-hidden`. Phone mock-ups on the site are one `role="img"` with a description; their contents are hidden from assistive tech. No photography is used. | None |
| 3 | Semantics, labels, focus, keyboard, live regions, tap targets, text scaling | All screens, the Activity card stack, forms, toggles | axe; Lighthouse accessibility; scripted keyboard-only walkthrough of 8 pages (every Tab stop checked for a visible focus ring and a 44 px target); arrow keys, Home and End on the card stack | **Pass.** Lighthouse accessibility 100 on 7 pages. Every Tab stop shows a focus ring. Found and fixed: duplicate "Legal" landmark on Settings; three footer links under 44 px. Notifications use a polite live region; focus moves to the new h1 on every screen and step. Text uses rem units, so it follows the system text size, and the app has its own Standard, Large and Largest setting. | None |
| 4 | Clear button labels | Every button and link | Code review of all `button` and `Link` text | **Pass.** Actions name what they do ("Link this card", "Download my data", "Delete my account and data", "Remove Harbor Bank card ending 4821"). Icon-only buttons have labels ("Open settings", "Search rewards"). | None |
| 5 | Privacy, Terms, Cookies and Refund pages | Pages exist, linked from the site footer, the app footer, and sign-up | Manual check of `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/refunds` | **Drafts in place.** Each says "Draft for legal review. Not yet in effect" and shows missing business details inline. The Refund policy states plainly that the app is free and charges nothing. Liability and governing-law sections are left blank on purpose. | **Lawyer** to review and complete all four; set `policyEffectiveDate` |
| 6 | Form consent | Sign-up, card linking, Settings | Code and API review; database check of the `consents` table | **Pass.** All boxes start unticked. Separate consents: Terms and Privacy (required to create an account), marketing email, browser notifications, and card linking (given per card at link time). Marketing and notifications can be withdrawn in Settings; card linking is withdrawn by removing the card. Every change is a new row with timestamp and policy version. Location: the app does not use location, so there is no location consent to give; Settings says so. | **Lawyer** to confirm the consent wording |
| 7 | Data minimisation | Every form field and API payload | Code review of forms and every endpoint | **Pass with notes.** Sign-up: first name, email, password (hashed with scrypt). Card: bank name, last four digits, consent; no full card number, CVV or bank password anywhere. Ingestion: external id, card reference, store, amount, time. Rewards ranking sends only the local hour, which is not stored. Removed from the earlier version: location, demo personas, browser-only state. Birthday is never collected. | **FIS compliance** to confirm that last four digits plus bank is the minimum needed to match transactions |
| 8 | Tracking and cookies | Cookies, localStorage, sessionStorage, third-party requests | Scripted session across 9 pages recording every request host and all storage; `Set-Cookie` header check in production mode | **Pass.** One cookie: `sid` (HttpOnly, Secure in production, SameSite=Lax, 30 days). localStorage: `pp-prefs`, `activity-view`, `last-seen-transaction`, all functional. No sessionStorage. Hosts contacted: our own origin only. No analytics or ad trackers, so no consent banner is needed; every item is listed in the Cookies policy. | **Lawyer** to confirm no banner is needed in each target state |
| 9 | Third-party embeds and APIs | Fonts, maps, weather, places, images, scripts | Network audit (row 8); dependency review | **Pass.** Fonts are self-hosted from npm (`@fontsource-variable/atkinson-hyperlegible-next`, OFL-1.1). No maps, weather, places, image CDNs or external scripts are used, so no OpenStreetMap or weather-tier terms apply. | None |
| 10 | Copyright and credits | Every image, logo, font, icon, dataset | Inventory in `CREDITS.md`; credits page at `/credits`; npm license scan (`scripts/license-check.mjs`) | **Pass with one note.** Logo, monogram, icons and store marks are original. No real brand logos are used, and the footer says no brand has endorsed the app. 115 production packages: 102 MIT, 9 ISC, 1 BSD-3-Clause, 1 OFL-1.1 (font), and GSAP under its "Standard no charge" license. GSAP allows free commercial use; its restriction covers no-code animation-builder tools that compete with Webflow, which this app is not ([GSAP license](https://gsap.com/community/standard-license/), [Webflow announcement](https://webflow.com/blog/gsap-becomes-free)). `vue` appears only as an uninstalled optional peer of Lenis. | **Lawyer** to confirm the GSAP reading |
| 11 | Fake reviews, invented statistics, unsupported claims | All copy on site and app | Text review; grep for demo, prototype, testimonial and certification wording | **Pass.** No reviews or testimonials. Statistics are only the three sourced figures (FIS brief $42B; Antavo 2026: 26.2% and 41.1%), each with its source. Model results are labelled as synthetic data with no claim of real-customer lift. Accessibility is described as "built to meet WCAG 2.1 AA, not certified", now supported by row 3. | None |
| 12 | Business details | Legal name, address, email, registration in footer and legal pages | `shared/brand.config.js`; build check | **Blocked on the team.** None are filled in, and none were invented. Production `npm run build` stops with the list of missing fields. Dev builds show a red banner, and legal pages show `[missing: …]` inline. | **Team** to supply legal entity, address, contact email, registration or ownership details, and the policy effective date |
| 13 | Applicable US laws | See below | Desk review | **Flags only** | **Lawyer** and **FIS compliance** |
| 14 | Data export and deletion | Settings | Live test: download, then delete with password | **Pass.** "Download my data" returns a JSON file of everything held. "Delete my account and data" needs the password and removes the user and all linked rows (cascading deletes). | None |
| 15 | Security basics | Auth and sessions | Code review; live tests | **Pass with notes.** scrypt password hashing; sessions stored only as SHA-256 hashes; same-origin check on writes; rate limits on sign-in and sign-up; `nosniff`, `DENY` framing and `same-origin` referrer headers. Email verification is required before linking a card. | **Team**: add a real email provider (`MAIL_PROVIDER`), a password reset flow, and an external security review before launch |
| 16 | Placeholder offers | Offers table and admin | Database and admin page | **Pass.** All 15 seeded offers are `placeholder`, with a note saying they are fictional pilot offers to replace or confirm. Production hides them unless `SHOW_PLACEHOLDER_OFFERS=1`. Admins see a status column and can mark an offer confirmed only after a confirmation prompt. | **Team** to get written confirmation from each merchant |

## Laws that may apply (US consumer app with financial data)

None of these have been reviewed by a lawyer.

| Law | Why it may apply | Flag |
|---|---|---|
| GLBA (Gramm-Leach-Bliley Act), Privacy Rule and Safeguards Rule | Card transaction data from a financial institution. If the app is offered by or for FIS or a bank, it is likely in scope as a service provider. | **FIS compliance**: privacy notice duties, safeguards program, vendor contract |
| CCPA / CPRA (California) and other state privacy laws (Virginia, Colorado, Connecticut, Utah, Texas, Oregon and others) | Personal and financial-transaction data of residents. GLBA-covered data may be exempt in part. | **Lawyer**: thresholds, notice at collection, rights handling (export and delete are built in) |
| CAN-SPAM | Marketing email (opt-in) and transactional email (verification) | **Lawyer**: unsubscribe link and physical address in marketing email; needs business details |
| TCPA | Only if text messages are added. None are sent today. | Flag before adding SMS |
| COPPA | Service is for adults; sign-up does not collect age. | **Lawyer**: decide whether to add an age confirmation |
| ADA Title III and state accessibility laws | Consumer-facing digital service | Built to meet WCAG 2.1 AA (row 3). Keep testing; not certified. |
| State money-transmission and unclaimed-property laws, gift-card and loyalty-program rules | Points with expiry and rewards with value | **Lawyer**: confirm points expiry and no-cash-value terms are lawful in each state |
| UDAP / UDAAP (FTC Act, CFPB) | Marketing claims and reward terms | Terms are shown in plain words on every reward. **Lawyer** to review |
| Electronic Fund Transfer Act / Regulation E | Probably not (no funds moved), but a real auto-apply at checkout through Premium Payback may touch card disputes | **FIS compliance** |

## How to re-run the checks

- Accessibility: axe-core on each page (script used: `axe.mjs`, run against the dev server with an account that has data).
- Lighthouse 12: `npx lighthouse <url> --only-categories=performance,accessibility,best-practices` against `npm run build` served by `NODE_ENV=production node server/index.js`.
- Licenses: `node scripts/license-check.mjs`.

## Lighthouse results (mobile emulation, production build)

| Page | Performance | Accessibility | Best practices |
|---|---|---|---|
| `/` | 96 | 100 | 100 |
| `/how-it-works` | 93 | 100 | 100 |
| `/app/sign-in` | 97 | 100 | 100 |
| `/app` | 97 | 100 | 100 |
| `/app/rewards` | 97 | 100 | 100 |
| `/app/activity` | 98 | 100 | 100 |
| `/app/settings` | 98 | 100 | 100 |

On a throttled connection (50 KB/s, 400 ms latency) the signed-in Home heading appears in 4.4 seconds and the site home in 5.4 seconds, with no third-party requests.
