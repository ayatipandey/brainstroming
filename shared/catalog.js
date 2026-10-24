// Demo catalog shared by the server, the app, and the landing page.
// Every merchant, bank, and person here is fictional demo data.

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

export const OFFERS = [
  { id: 'cc-drip', merchantId: 'campus-coffee', title: 'Any coffee, on your points', points: 300, value: 3.0 },
  { id: 'nr-pastry', merchantId: 'northside-roasters', title: 'A pastry with any drink', points: 250, value: 2.5 },
  { id: 'mst-taco', merchantId: 'market-street-tacos', title: 'Two tacos for 400 points', points: 400, value: 4.0 },
  { id: 'gb-bowl', merchantId: 'green-bowl', title: '$5 off a grain bowl', points: 500, value: 5.0 },
  { id: 'ch-paperback', merchantId: 'chapter-house', title: '$6 off any paperback', points: 600, value: 6.0 },
  { id: 'fl-basket', merchantId: 'fresh-lane', title: '$8 off a $40 basket', points: 800, value: 8.0 },
];

export const MOMENTS = {
  none: { label: 'No special moment' },
  payday: { label: 'Payday' },
  halloween: { label: 'Halloween' },
  holidays: { label: 'Holidays' },
};

// Demo people for the control panel. Not real customers.
export const PEOPLE = [
  { id: 'maya', name: 'Maya', note: 'Coffee before shifts, reads on weekends', favorites: { coffee: 'campus-coffee', books: 'chapter-house' } },
  { id: 'jordan', name: 'Jordan', note: 'Cooks most nights, tacos on payday', favorites: { groceries: 'fresh-lane', food: 'market-street-tacos' } },
  { id: 'sam', name: 'Sam', note: 'Lunch out, groceries on Sundays', favorites: { food: 'green-bowl', groceries: 'fresh-lane' } },
];

export const BANKS = [
  { id: 'harbor', name: 'Harbor Bank' },
  { id: 'summit', name: 'Summit Credit Union' },
  { id: 'meridian', name: 'First Meridian' },
];

export const POINT_VALUE = 0.01; // dollars per point, demo rate

export const merchantById = (id) => MERCHANTS.find((m) => m.id === id);
export const offerById = (id) => OFFERS.find((o) => o.id === id);
export const offerForMerchant = (merchantId) => OFFERS.find((o) => o.merchantId === merchantId);

export function formatHour(hour) {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60) % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function describeWindows(category) {
  return CATEGORIES[category].windows
    .map(([a, b]) => `${formatHour(a)} to ${formatHour(b)}`)
    .join(' and ');
}

export const money = (n) => `$${n.toFixed(2)}`;
