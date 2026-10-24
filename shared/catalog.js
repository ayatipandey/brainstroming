// Demo catalog shared by the server, the app, and the site.
// Every merchant, bank, person, and reward here is fictional demo data.

export const CATEGORIES = {
  coffee: { label: 'Coffee', windows: [[7, 16]] },
  food: { label: 'Food', windows: [[11, 14], [17, 21]] },
  books: { label: 'Books', windows: [[9, 17]] },
  groceries: { label: 'Groceries', windows: [[10, 20]] },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES);

export const MERCHANTS = [
  { id: 'campus-coffee', name: 'Campus Coffee', category: 'coffee' },
  { id: 'northside-roasters', name: 'Northside Roasters', category: 'coffee' },
  { id: 'market-street-tacos', name: 'Market Street Tacos', category: 'food' },
  { id: 'green-bowl', name: 'Green Bowl', category: 'food' },
  { id: 'chapter-house', name: 'Chapter House Books', category: 'books' },
  { id: 'fresh-lane', name: 'Fresh Lane Market', category: 'groceries' },
];

// Tiers unlock with lifetime points. Points come from paying with a linked
// card (10 per dollar paid) and from using rewards.
export const TIERS = [
  { id: 'member', name: 'Member', min: 0 },
  { id: 'silver', name: 'Silver', min: 600 },
  { id: 'gold', name: 'Gold', min: 1250 },
  { id: 'platinum', name: 'Platinum', min: 2500 },
];
export const POINTS_PER_DOLLAR = 2;

export const tierFor = (points) => [...TIERS].reverse().find((t) => points >= t.min);
export const nextTier = (points) => TIERS.find((t) => t.min > points) || null;
export const tierRank = (id) => TIERS.findIndex((t) => t.id === id);

/**
 * Rewards. `value` is the most the reward takes off a purchase, in dollars.
 * `days` is how many days the reward stays valid from today.
 * `earn` is the bonus points for using it. `terms` are the extra conditions
 * specific to the reward; the standard ones are added by termsFor().
 */
export const REWARDS = [
  { id: 'cc-coffee', merchantId: 'campus-coffee', tier: 'member', title: 'Any coffee, on us', value: 5, minSpend: 0, days: 3, earn: 150, terms: ['Any size, any milk.', 'One drink per visit.'] },
  { id: 'nr-pastry', merchantId: 'northside-roasters', tier: 'member', title: 'A pastry with any drink', value: 4, minSpend: 3, days: 9, earn: 60, terms: ['Pastry of your choice while stocked.'] },
  { id: 'mst-tacos', merchantId: 'market-street-tacos', tier: 'member', title: 'Two tacos for $5', value: 4, minSpend: 5, days: 6, earn: 80, terms: ['Any two tacos from the main menu.', 'Dine in or takeaway.'] },
  { id: 'fl-delivery', merchantId: 'fresh-lane', tier: 'member', title: 'Free delivery this week', value: 6, minSpend: 25, days: 7, earn: 50, terms: ['Online orders only.', 'Delivery within the store’s usual area.'] },
  { id: 'ch-paperback', merchantId: 'chapter-house', tier: 'member', title: '$6 off any paperback', value: 6, minSpend: 10, days: 2, earn: 90, terms: ['Paperbacks only, new or used.'] },

  { id: 'gb-bowl', merchantId: 'green-bowl', tier: 'silver', title: '$4 off a grain bowl', value: 4, minSpend: 9, days: 12, earn: 80, terms: ['Any bowl on the main menu.'] },
  { id: 'fl-basket', merchantId: 'fresh-lane', tier: 'silver', title: '$8 off a $40 basket', value: 8, minSpend: 40, days: 5, earn: 120, terms: ['In store or online.', 'Alcohol and gift cards do not count toward the $40.'] },
  { id: 'ch-double', merchantId: 'chapter-house', tier: 'silver', title: '$5 off any hardcover', value: 5, minSpend: 15, days: 20, earn: 70, terms: ['Hardcovers only.'] },

  { id: 'cc-friday', merchantId: 'campus-coffee', tier: 'gold', title: 'A free drink and pastry', value: 9, minSpend: 0, days: 14, earn: 150, terms: ['One drink and one pastry together.'] },
  { id: 'mst-dinner', merchantId: 'market-street-tacos', tier: 'gold', title: '$15 off dinner for two', value: 15, minSpend: 35, days: 14, earn: 180, terms: ['After 5 pm.', 'Dine in only.'] },
  { id: 'ch-order', merchantId: 'chapter-house', tier: 'gold', title: '$20 off a $60 order', value: 20, minSpend: 60, days: 21, earn: 200, terms: ['Any books, in store or online.'] },
  { id: 'fl-month', merchantId: 'fresh-lane', tier: 'gold', title: '$12 off a $60 basket', value: 12, minSpend: 60, days: 10, earn: 160, terms: ['Alcohol and gift cards do not count toward the $60.'] },

  { id: 'nr-beans', merchantId: 'northside-roasters', tier: 'platinum', title: 'A free bag of house beans', value: 18, minSpend: 0, days: 30, earn: 250, terms: ['One 340 g bag, any roast.'] },
  { id: 'gb-table', merchantId: 'green-bowl', tier: 'platinum', title: '$30 off a group order', value: 30, minSpend: 80, days: 30, earn: 300, terms: ['Orders for four people or more.'] },
  { id: 'fl-big', merchantId: 'fresh-lane', tier: 'platinum', title: '$25 off a $100 basket', value: 25, minSpend: 100, days: 30, earn: 300, terms: ['Alcohol and gift cards do not count toward the $100.'] },
];

// Points each reward uses. Higher tiers get more value per point.
const RATE = { member: 100, silver: 90, gold: 80, platinum: 70 }; // points per dollar of value
for (const r of REWARDS) r.cost = Math.round(r.value * RATE[r.tier] / 10) * 10;

export const POINT_VALUE = 0.01; // dollars per point when shown as money
export const POINTS_EXPIRE_DAYS = 365;
export const EXPIRY_WINDOW_DAYS = 14;

// Kept for the scoring API, which picks an offer per merchant.
export const OFFERS = REWARDS.filter((r) => r.tier === 'member').map((r) => ({ ...r, points: r.earn }));

export const MOMENTS = {
  none: { label: 'No special moment' },
  payday: { label: 'Payday' },
  halloween: { label: 'Halloween' },
  holidays: { label: 'Holidays' },
};

export const PEOPLE = [
  { id: 'maya', name: 'Maya', favorites: { coffee: 'campus-coffee', books: 'chapter-house' } },
];

export const merchantById = (id) => MERCHANTS.find((m) => m.id === id);
export const rewardById = (id) => REWARDS.find((r) => r.id === id);
export const offerById = (id) => OFFERS.find((o) => o.id === id) || rewardById(id);
export const offerForMerchant = (merchantId) => OFFERS.find((o) => o.merchantId === merchantId) || REWARDS.find((r) => r.merchantId === merchantId);
export const categoryOf = (reward) => merchantById(reward.merchantId).category;

export function formatHour(hour) {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60) % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function describeWindows(category) {
  return CATEGORIES[category].windows.map(([a, b]) => `${formatHour(a)} to ${formatHour(b)}`).join(' and ');
}

export const money = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);
export const money2 = (n) => `$${n.toFixed(2)}`;

export function validUntil(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function where(r) {
  const t = r.terms.join(' ').toLowerCase();
  if (t.includes('online orders only')) return 'online only';
  if (t.includes('dine in only')) return 'dine in only';
  if (t.includes('online')) return 'in store or online';
  return 'in store';
}

/** The full, plain-language terms for a reward, in a fixed order. */
export function termsFor(r, { autoApply = true } = {}) {
  const m = merchantById(r.merchantId);
  return [
    { label: 'What you get', text: `${r.title}. Up to ${money(r.value)} off.` },
    { label: 'Where', text: `${m.name}, ${where(r)}.` },
    { label: 'Valid until', text: `${r.validUntil ? new Date(`${r.validUntil}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : validUntil(r.days)}, end of day.` },
    { label: 'How many times', text: 'Once.' },
    { label: 'Minimum spend', text: r.minSpend ? `${money(r.minSpend)} before the reward.` : 'None.' },
    { label: 'Points it uses', text: `${r.cost.toLocaleString()} points, taken from the points that expire soonest.` },
    { label: 'Points you earn', text: `${POINTS_PER_DOLLAR} points for every dollar you pay after the reward.` },
    { label: 'Paying with a linked card', text: autoApply ? 'Applied automatically when you pay with a linked card, if you have the points and it is your best reward at that store.' : 'Show the code at the counter. Auto-apply is off for your cards.' },
    { label: 'Also', text: [...r.terms, 'Cannot be combined with other rewards on the same purchase.', 'No cash value. Not exchangeable or transferable.'].join(' ') },
  ];
}
