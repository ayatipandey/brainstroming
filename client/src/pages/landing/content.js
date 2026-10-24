export const COMPARE = {
  columns: ['Chase Ultimate Rewards', 'Starbucks Rewards', 'Discover it', 'Perk Predict'],
  rows: [
    {
      label: 'Timing',
      cells: ['When you visit the rewards portal', 'When you open the app or order', 'When you choose to redeem', 'At the moment it fits, or not at all'],
    },
    {
      label: 'Relevance',
      cells: ['A broad travel and gift catalog', 'One brand’s menu', 'Cash back, plus rotating categories you activate', 'Scored for your time, place and favorite brands'],
    },
    {
      label: 'Scope',
      cells: ['Chase cards', 'Starbucks stores', 'Discover cards', 'Any program on FIS loyalty products'],
    },
    {
      label: 'Expiry',
      cells: ['Points do not expire while the account is open', 'Stars expire after 6 months', 'Cash back does not expire', 'Expiring points first, on a 14-day clock'],
    },
    {
      label: 'Effort',
      cells: ['Log in, browse, choose', 'Pick a reward in the app', 'Log in and redeem', 'Three steps, or automatic within your limit'],
    },
    {
      label: 'Transparency',
      cells: ['Offers are not explained', 'Offers are not explained', 'Categories follow a set calendar', 'Every nudge says why'],
    },
    {
      label: 'Restraint',
      cells: ['Notifications on or off', 'Notifications on or off', 'Notifications on or off', 'A 70% bar, 1 to 3 a day, quiet hours'],
    },
  ],
};

export const DAY = [
  { time: '7:40 am', what: 'Reveals her daily perk', detail: 'Double points at Green Bowl until 9 pm. One tap, no nudge needed.' },
  { time: '12:15 pm', what: 'Lunch at her desk, nothing to score', detail: 'The engine only checks a moment when she comes near a place or a calendar moment begins.' },
  { time: '2:47 pm', what: 'One nudge, at Campus Coffee', detail: '300 points that expire in 3 days cover any coffee. She pays $4.20, auto-apply covers $3.00, and she pays $1.20.', sent: true },
  { time: '6:30 pm', what: 'Near Fresh Lane Market, no nudge', detail: 'Her expiring points are already used and groceries is not a favorite, so the score is 65. Nothing is sent.' },
  { time: '11:30 pm', what: 'Quiet hours, nothing', detail: 'Nothing is sent between 10 pm and 7 am.' },
];

export const FAQ = [
  {
    q: 'Do you store my card number?',
    a: [
      'No. You link a card on your bank’s own sign-in page. Perk Predict keeps the bank name, the last four digits, and the spending categories you choose. It never sees a card number or a password.',
      'In this prototype the bank sign-in is a mock, and nothing you do there leaves your browser.',
    ],
  },
  {
    q: 'How is a nudge decided?',
    a: [
      'The engine checks a moment when you come near a place, or when a calendar moment like payday begins. Each moment is scored from 0 to 99 using the time, where you are (only if you turn location on), your favorite categories, special moments like payday, and points about to expire. At 70 or above, one offer goes out with its reasons. Below that, nothing does.',
      'The server scores with a logistic regression trained on synthetic data. The published rules are the baseline, and the app scores on the device if the server takes more than 2 seconds.',
    ],
  },
  {
    q: 'How many nudges will I get?',
    a: [
      'One to three a day, your choice, and none during quiet hours. Payment confirmations are always shown, because they tell you what happened to your money.',
    ],
  },
  {
    q: 'Is this real data?',
    a: [
      'No. Every person, merchant, bank, balance and the model’s training data is synthetic demo data. It has not been tested with real customers, and we make no claims about real results.',
      'Validation on real FIS data would come after a privacy review.',
    ],
  },
  {
    q: 'Does it use my location?',
    a: [
      'Only if you turn it on, and only while the app is open. The app never asks for your birthday.',
    ],
  },
  {
    q: 'Is it accessible?',
    a: [
      'It is built to meet WCAG 2.1 AA: visible focus, full keyboard and screen reader support, 48 pixel tap targets, and text at 16 pixels or larger, plus text size, contrast and motion settings. It has not been certified.',
    ],
  },
  {
    q: 'What comes next?',
    a: [
      'A balance view across programs, a forecast of what will expire, auto-apply on real checkouts through FIS Premium Payback, a view for merchants, and validation on real FIS data after a privacy review. None of these are built yet.',
    ],
  },
];
