// Authored icon set: 24px grid, 1.75 stroke, round joins.
const PATHS = {
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5ZM16 13.5h.01',
  heart: 'M12 19s-7-4.4-7-9.5A3.9 3.9 0 0 1 12 7a3.9 3.9 0 0 1 7 2.5C19 14.6 12 19 12 19Z',
  card: 'M3.5 7A1.5 1.5 0 0 1 5 5.5h14A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7ZM3.5 9.5h17M7 15h4',
  activity: 'M5 6h14M5 12h14M5 18h9',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  demo: 'M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  check: 'M5 12.5 10 17l9-10',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M14.5 6 8.5 12l6 6',
  next: 'M9.5 6l6 6-6 6',
  info: 'M12 11v5M12 8h.01M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z',
  pin: 'M12 20.5s6-5.6 6-10.5a6 6 0 1 0-12 0c0 4.9 6 10.5 6 10.5ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  coffee: 'M5 9h11v4.5A4.5 4.5 0 0 1 11.5 18h-2A4.5 4.5 0 0 1 5 13.5V9ZM16 10.5h1a2 2 0 0 1 0 4h-1.3M8 3.5v2.5M11 3.5v2.5',
  food: 'M4 12h16a8 8 0 0 1-16 0ZM12 4v4M8.5 5.5 9.5 8M15.5 5.5 14.5 8',
  books: 'M5 5.5A1.5 1.5 0 0 1 6.5 4H11v15H6.5A1.5 1.5 0 0 0 5 20.5v-15ZM11 4h6.5A1.5 1.5 0 0 1 19 5.5v15a1.5 1.5 0 0 0-1.5-1.5H11',
  groceries: 'M4 6h2l2 10h10l2-7H7M10 20h.01M17 20h.01',
  undo: 'M8 6 4 10l4 4M4.5 10H14a5 5 0 0 1 0 10h-3',
  moon: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z',
  bank: 'M4 9.5 12 5l8 4.5M5.5 10v7M10 10v7M14 10v7M18.5 10v7M4 19.5h16',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Z',
  gift: 'M4.5 10h15v3h-15zM6 13h12v7H6zM12 10v10M12 10c-1.5-3.5-5-3.5-5-1.5S10 10 12 10Zm0 0c1.5-3.5 5-3.5 5-1.5S14 10 12 10Z',
  spark: 'M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2',
  calendar: 'M5 6.5h14V19H5zM5 10h14M9 4v4M15 4v4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  star: 'M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L12 3.8Z',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2h-2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0',
  rewards: 'M4.5 9h15v11h-15zM3.5 6h17v3h-17zM12 6v14M12 6c-1.6-3-5-3-5-1s3 1 5 1Zm0 0c1.6-3 5-3 5-1s-3 1-5 1Z',
};

export default function Icon({ name, size = 24, className = '', title, filled = false }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}

export const categoryIcon = { coffee: 'coffee', food: 'food', books: 'books', groceries: 'groceries' };
