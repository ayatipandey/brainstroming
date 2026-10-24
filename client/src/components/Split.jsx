import { Fragment } from 'react';

// Splits a heading into masked words for its entrance. The text stays real
// text for search and screen readers.
export default function Split({ children }) {
  return String(children).split(' ').map((w, i, a) => (
    <Fragment key={i}><span className="w"><span className="wi">{w}</span></span>{i < a.length - 1 ? ' ' : ''}</Fragment>
  ));
}
