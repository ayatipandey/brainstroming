"""Generate a synthetic dataset of nudge moments and whether each was used.

Everything here is synthetic. The hidden "true" behaviour below is an
assumption made for the prototype, not a measurement of real customers, so
results trained on it say nothing about lift on real cardholders.

Output: model/data/synthetic.csv
"""

import csv
import math
import os
import random

SEED = 2026
USERS = 800
DAYS = 21
MOMENTS_PER_DAY = 5
HORIZON = 14

CATEGORIES = {
    "coffee": [(7, 16)],
    "food": [(11, 14), (17, 21)],
    "books": [(9, 17)],
    "groceries": [(10, 20)],
}
SPECIALS = ["payday", "halloween", "holidays"]
FEATURES = ["in_window", "favorite", "special", "urgency", "near", "late", "fav_x_window"]


def in_window(category, hour):
    return any(a <= hour < b for a, b in CATEGORIES[category])


def features(category, hour, favorite, special, days, near):
    """Must match shared/scoring.js featureVector()."""
    w = 1 if in_window(category, hour) else 0
    f = 1 if favorite else 0
    urgency = (HORIZON - max(0, days)) / HORIZON if days is not None and days <= HORIZON else 0.0
    late = 1 if hour >= 22 or hour < 6 else 0
    return [w, f, 1 if special else 0, urgency, 1 if near else 0, late, f * w]


def true_probability(x, user_bias, hour, category):
    """Hidden behaviour the model has to learn. Assumed, not measured."""
    w, f, s, u, n, late, fw = x
    # Habit strength peaks in the middle of a category's window, which a 0/1
    # window flag only approximates.
    peak = 0.0
    for a, b in CATEGORIES[category]:
        if a <= hour < b:
            mid = (a + b) / 2
            peak = 1 - abs(hour - mid) / ((b - a) / 2)
    z = (-2.6 + 1.1 * w + 0.6 * peak + 1.0 * f + 0.45 * s + 2.2 * u * u
         + 0.9 * n - 1.7 * late + 0.7 * fw + user_bias)
    return 1 / (1 + math.exp(-z))


def main():
    rng = random.Random(SEED)
    rows = []
    for user in range(USERS):
        favs = set(rng.sample(list(CATEGORIES), rng.choice([1, 2, 2, 3])))
        bias = rng.gauss(0, 0.5)
        for day in range(DAYS):
            special = rng.choice(SPECIALS) if rng.random() < 0.12 else None
            days_left = rng.choice([None, None, rng.randint(0, 30)])
            for _ in range(MOMENTS_PER_DAY):
                category = rng.choice(list(CATEGORIES))
                hour = round(rng.uniform(6, 25.5) % 24, 2)
                near = rng.random() < 0.45
                x = features(category, hour, category in favs, special, days_left, near)
                p = true_probability(x, bias, hour, category)
                used = 1 if rng.random() < p else 0
                rows.append({
                    "user": user, "day": day, "category": category, "hour": hour,
                    "favorite": int(category in favs), "special": special or "",
                    "days_until_expiry": "" if days_left is None else days_left,
                    "near": int(near), "used": used,
                })
    out = os.path.join(os.path.dirname(__file__), "data", "synthetic.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    rate = sum(r["used"] for r in rows) / len(rows)
    print(f"wrote {len(rows):,} synthetic moments to {out} (use rate {rate:.1%})")


if __name__ == "__main__":
    main()
