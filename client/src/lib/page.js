import { useEffect, useRef } from 'react';

/** Sets the document title and moves focus to the page's h1 on arrival. */
export function usePage(title) {
  const h1 = useRef(null);
  useEffect(() => {
    document.title = title;
    h1.current?.focus({ preventScroll: true });
  }, [title]);
  return h1;
}
