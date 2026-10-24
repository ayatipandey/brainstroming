// Ranks the rewards a person can use right now, most likely to be used
// first, with the trained model from model.json.
import { CATEGORIES, merchantById, categoryOf } from './catalog.js';
import { modelScore } from './scoring.js';

/**
 * rewards: available rewards (unlocked, not used)
 * starred: Set of starred reward ids
 * hour: local hour, 0 to 24
 */
export function rankRewards(rewards, { starred, hour, model }) {
  const starredCats = new Set([...starred].map((id) => {
    const r = rewards.find((x) => x.id === id);
    return r && categoryOf(r);
  }).filter(Boolean));
  return rewards
    .map((r) => {
      const category = categoryOf(r);
      const favorite = starred.has(r.id) || starredCats.has(category);
      const { score, reasons } = modelScore({
        category, hour, favorite, special: null, daysUntilExpiry: r.days, near: false, merchantName: merchantById(r.merchantId).name,
      }, model);
      const why = [];
      if (r.days <= 3) why.push(`Ends in ${r.days} ${r.days === 1 ? 'day' : 'days'}`);
      if (starred.has(r.id)) why.push('One of your favorites');
      else if (favorite) why.push(`You star ${CATEGORIES[category].label.toLowerCase()} rewards`);
      if (reasons.some((x) => x.effect === 'up' && x.text.includes('inside'))) why.push(`${CATEGORIES[category].label} time`);
      return { reward: r, score, why };
    })
    .sort((a, b) => b.score - a.score || b.reward.value - a.reward.value);
}
