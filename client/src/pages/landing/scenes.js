import { rulesScore, modelScore } from '@shared/scoring.js';
import model from '@shared/model.json';

// The four engine scenes. Scores are computed live from the shared rules
// and the trained model, so the page cannot drift from the product.

function score(ctx) {
  const rules = rulesScore(ctx);
  const learned = modelScore(ctx, model);
  return { rules, model: learned };
}

const coffee = { category: 'coffee', favorite: true, special: null, daysUntilExpiry: 3, near: true, merchantName: 'Campus Coffee' };

export const SCENES = [
  {
    id: 'afternoon',
    time: '2:47 pm',
    place: 'Near Campus Coffee',
    title: 'Sends, with reasons',
    body: 'Maya is two doors from her usual coffee, inside coffee hours, and 300 of her points expire in 3 days.',
    ctx: { ...coffee, hour: 14 + 47 / 60 },
    tone: '#f5f4f1',
    phone: 'nudge',
    nudge: { title: 'Your coffee is on your points', body: '300 points cover any coffee at Campus Coffee. They expire in 3 days.' },
  },
  {
    id: 'night',
    time: '11:30 pm',
    place: 'Same street, same points',
    title: 'Sends nothing, and says why',
    body: 'Outside coffee hours and inside quiet hours. The offer waits for a better moment instead of buzzing at midnight.',
    ctx: { ...coffee, hour: 23.5 },
    tone: '#012834',
    phone: 'quiet',
    held: 'Quiet hours are on from 10 pm to 7 am',
  },
  {
    id: 'payday',
    time: '6:10 pm, payday',
    place: 'Near Market Street Tacos',
    title: 'Payday tips it over',
    body: 'Food is not one of Maya’s favorites, so on a normal evening this scores 65 and stays quiet. Payday adds 10.',
    ctx: { category: 'food', favorite: false, special: 'payday', daysUntilExpiry: null, near: true, merchantName: 'Market Street Tacos', hour: 18 + 10 / 60 },
    tone: '#ecebe6',
    phone: 'nudge',
    nudge: { title: 'Payday tacos, two for 400 points', body: 'Market Street Tacos, a block away. Dinner hours run until 9 pm.' },
  },
  {
    id: 'expiring',
    time: '10:15 am',
    place: 'Near Chapter House Books',
    title: 'Expiring points go first',
    body: 'Sam rarely buys books, but 300 points expire in 2 days. The offer is paid with those points first, so nothing is lost.',
    ctx: { category: 'books', favorite: false, special: null, daysUntilExpiry: 2, near: true, merchantName: 'Chapter House Books', hour: 10.25 },
    tone: '#f5f4f1',
    phone: 'expiring',
    nudge: { title: '300 points expire in 2 days', body: 'Use them on $6 off any paperback at Chapter House Books, around the corner.' },
  },
].map((s) => ({ ...s, ...score(s.ctx) }));
