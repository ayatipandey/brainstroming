import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { usePrefs } from './prefs.jsx';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling plus a page's scroll-linked motion. Nothing runs when
 * the reader asks for reduced motion; every element is visible by default,
 * and setup() only adds travel on top.
 */
export function usePageMotion(rootRef, setup, deps = []) {
  const { reduced } = usePrefs();
  useEffect(() => {
    if (reduced || !rootRef.current) return undefined;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    const ctx = gsap.context(() => setup(gsap, ScrollTrigger), rootRef);
    // Images and fonts can shift layout after first paint.
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      clearTimeout(refresh);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);
  return reduced;
}

/** Heading words rise out of their masks once, when they scroll in. */
export function riseHeadings(g, scope = 'section') {
  g.utils.toArray(`${scope} [data-split]`).forEach((h) => {
    g.from(h.querySelectorAll('.wi'), {
      yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  });
}
