// Simulated card payments. In a real deployment this sits on FIS Premium
// Payback, which redeems rewards and points in real time. Here nothing is
// charged; it only changes demo state.
import { merchantById, rewardById, money2, POINTS_PER_DOLLAR } from './catalog.js';

/**
 * Pick the reward to apply to a purchase and work out the result.
 * available: rewards the person can use (unlocked, unused, unexpired)
 */
export function payWithCard({ merchantId, amount, available, autoApply }) {
  const merchant = merchantById(merchantId);
  const here = available.filter((r) => r.merchantId === merchantId);
  const eligible = here.filter((r) => amount >= r.minSpend);
  const best = eligible.sort((a, b) => Math.min(b.value, amount) - Math.min(a.value, amount))[0] || null;

  if (!best || !autoApply) {
    const earned = Math.round(amount * POINTS_PER_DOLLAR);
    return {
      merchant, amount, reward: null, discount: 0, paid: amount, earned,
      missed: !autoApply && best ? best : null,
      note: !best && here.length ? `Your reward here needs a ${money2(here[0].minSpend)} minimum spend.` : null,
    };
  }
  const discount = Math.round(Math.min(best.value, amount) * 100) / 100;
  const paid = Math.round((amount - discount) * 100) / 100;
  const earned = Math.round(paid * POINTS_PER_DOLLAR) + best.earn;
  return { merchant, amount, reward: best, discount, paid, earned, missed: null, note: null };
}

export function receiptText(p) {
  if (!p.reward) return `You paid ${money2(p.amount)} at ${p.merchant.name} and earned ${p.earned} points.`;
  return `${p.reward.title} was applied at ${p.merchant.name}. ${money2(p.amount)} became ${money2(p.paid)}, and you earned ${p.earned} points.`;
}

export { rewardById };
