import { Link, useParams } from 'react-router-dom';
import { BRAND, missingBusinessFields } from '@shared/brand.config.js';
import { POINTS_PER_DOLLAR, POINTS_EXPIRE_DAYS } from '@shared/catalog.js';
import { usePage } from '../lib/page.js';

// Draft legal documents. They are templates for review by a lawyer and by
// FIS compliance, filled from shared/brand.config.js. Missing business
// details are shown in place so nobody mistakes a draft for a final text.

const v = (k) => BRAND[k] || <mark className="missing">[missing: {k}]</mark>;

const DOCS = {
  privacy: {
    title: 'Privacy policy',
    body: () => (
      <>
        <h2>Who we are</h2>
        <p>{BRAND.name} is operated by {v('legalEntity')}, {v('address')}. {v('registration')}. Contact us about privacy at {v('contactEmail')}.</p>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account:</strong> your first name, email address, and a one-way hash of your password. We never store the password itself.</li>
          <li><strong>Linked cards:</strong> the bank name and the last four digits of each card you link. We never receive or store the full card number, its security code, or any bank password.</li>
          <li><strong>Purchases with linked cards:</strong> the store, the amount, and the time, sent to us by the card processor so we can add points and apply rewards.</li>
          <li><strong>Points, rewards, favorites and activity</strong> that result from using the app.</li>
          <li><strong>Your choices:</strong> each consent you give or withdraw, with the time and the policy version.</li>
        </ul>
        <h2>What we do not collect</h2>
        <p>We do not collect your location, your date of birth, contacts, or device advertising identifiers. We do not use analytics or advertising trackers.</p>
        <h2>How we use it</h2>
        <p>To run your account, add points, rank rewards for you, apply rewards when you pay with a linked card, send the emails you need (such as the email confirmation) and, only if you agree, news about new rewards. Rewards are ranked on our servers from the time of day, your favorites and how soon rewards end.</p>
        <h2>Sharing</h2>
        <p>We do not sell or rent your personal information and do not share it for cross-context behavioral advertising. We share it only with service providers that run the app for us under contract, with the card processor needed to receive your purchases, and where the law requires it.</p>
        <h2>How long we keep it</h2>
        <p>While your account is open. When you delete your account in Settings, we delete your account data. Records we must keep by law are kept only for as long as required.</p>
        <h2>Your rights</h2>
        <p>In Settings you can download all of your data, change your permissions, and delete your account. You can also email {v('contactEmail')} to access, correct or delete your information. Residents of some US states, including California, have additional rights; we honor them for everyone. We will not treat you differently for using them.</p>
        <h2>Children</h2>
        <p>{BRAND.name} is for adults aged 18 and over. We do not knowingly collect information from children.</p>
        <h2>Security</h2>
        <p>Passwords are hashed, sessions use secure cookies that page scripts cannot read, and card details are limited to the bank name and last four digits.</p>
        <h2>Changes</h2>
        <p>We will tell you about material changes before they take effect. Version {BRAND.policyVersion}.</p>
      </>
    ),
  },
  terms: {
    title: 'Terms and conditions',
    body: () => (
      <>
        <h2>The agreement</h2>
        <p>These terms are between you and {v('legalEntity')} ({v('address')}) for your use of {BRAND.name}. You must be 18 or over and live in the United States.</p>
        <h2>Your account</h2>
        <p>Keep your password private and tell us at {v('contactEmail')} if you think someone else has used your account.</p>
        <h2>Points</h2>
        <ul>
          <li>You earn {POINTS_PER_DOLLAR} points for each dollar you pay with a linked card, after any reward.</li>
          <li>Points expire {POINTS_EXPIRE_DAYS / 365 === 1 ? '12 months' : `${POINTS_EXPIRE_DAYS} days`} after you earn them. Rewards use the points that expire soonest first.</li>
          <li>Points have no cash value and cannot be sold, transferred or exchanged for money.</li>
        </ul>
        <h2>Rewards</h2>
        <p>Rewards are provided by the stores that offer them. Each reward shows its own terms in plain words: what you get, where, until when, how many times, minimum spend, and the points it uses. Rewards can change or end when a store changes its offer.</p>
        <h2>Automatic rewards</h2>
        <p>When auto-apply is on for a linked card and you pay at a store where you have a reward and enough points, we apply your best reward for that purchase. You can turn auto-apply off for each card in Cards.</p>
        <h2>Ending your account</h2>
        <p>You can delete your account in Settings at any time. Unused points end when the account is deleted.</p>
        <h2>Liability</h2>
        <p>To be completed after legal review.</p>
        <h2>Governing law</h2>
        <p>To be completed after legal review.</p>
        <p>Version {BRAND.policyVersion}.</p>
      </>
    ),
  },
  cookies: {
    title: 'Cookies policy',
    body: () => (
      <>
        <p>{BRAND.name} uses one cookie and three small items of browser storage. All are needed to provide the app you asked for or to remember a setting you chose. There are no analytics, advertising or third-party cookies, so we do not show a cookie banner.</p>
        <div className="table-wrap" role="region" aria-label="Storage we use" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">What it does</th><th scope="col">How long</th></tr></thead>
            <tbody>
              <tr><th scope="row">sid</th><td>Cookie, first party, httpOnly</td><td>Keeps you signed in.</td><td>30 days, or until you sign out</td></tr>
              <tr><th scope="row">pp-prefs</th><td>Local storage</td><td>Your text size, contrast and motion settings.</td><td>Until you clear it</td></tr>
              <tr><th scope="row">activity-view</th><td>Local storage</td><td>Whether Activity shows cards or a list.</td><td>Until you clear it</td></tr>
              <tr><th scope="row">last-seen-transaction</th><td>Local storage</td><td>Lets the app tell you about payments that arrived since your last visit.</td><td>Until you clear it</td></tr>
            </tbody>
          </table>
        </div>
        <p>Fonts and every other file are served from our own site; the app makes no requests to other companies.</p>
      </>
    ),
  },
  refunds: {
    title: 'Refund policy',
    body: () => (
      <>
        <p>{BRAND.name} is free. We do not charge you anything, so there is nothing for us to refund.</p>
        <h2>Purchases at stores</h2>
        <p>Refunds for things you buy are handled by the store and your card issuer under their own policies. A reward reduces what you pay; it is not a payment from us.</p>
        <h2>Points and rewards</h2>
        <p>Points and rewards have no cash value and cannot be refunded or exchanged for money. If a store refunds a purchase that used a reward, email {v('contactEmail')} and we will look at restoring the points.</p>
        <p>Version {BRAND.policyVersion}.</p>
      </>
    ),
  },
};

export default function Legal() {
  const { doc } = useParams();
  const d = DOCS[doc] || DOCS.privacy;
  const h1 = usePage(`${d.title}, ${BRAND.name}`);
  const missing = missingBusinessFields();
  return (
    <div className="page legal">
      <header className="page-head">
        <h1 ref={h1} tabIndex={-1} className="page-title legal-title">{d.title}</h1>
        <p className="draft-note glass" role="note">Draft for legal review. Not yet in effect{BRAND.policyEffectiveDate ? `; proposed effective date ${BRAND.policyEffectiveDate}` : ''}. Version {BRAND.policyVersion}.{missing.length ? ` Missing business details: ${missing.join(', ')}.` : ''}</p>
      </header>
      <section className="legal-body glass">{d.body()}</section>
      <nav className="legal-other" aria-label="Other policies">
        {Object.entries(DOCS).filter(([k]) => k !== doc).map(([k, x]) => <Link key={k} to={`/legal/${k}`}>{x.title}</Link>)}
      </nav>
    </div>
  );
}
