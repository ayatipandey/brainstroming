"""Train a logistic regression on the synthetic moments and compare it with
the rules baseline. Standard library only.

Reads model/data/synthetic.csv, writes shared/model.json (weights, metrics,
and ROC curves used by the chart).

Metrics are computed on held-out synthetic users. They show the model
learned the synthetic behaviour; they are not evidence of lift on real
customers.
"""

import csv
import json
import os
from collections import defaultdict
from datetime import date

from generate_data import FEATURES, HORIZON, features, in_window

HERE = os.path.dirname(__file__)
L2 = 1.0
THRESHOLD = 0.70


def rules_score(category, hour, favorite, special, days):
    """Must match shared/scoring.js rulesScore()."""
    s = 0.5
    s += 0.15 if in_window(category, hour) else -0.25
    if favorite:
        s += 0.15
    if special:
        s += 0.10
    if days is not None and days <= HORIZON:
        s += 0.10
    return min(0.99, max(0.0, s))


def sigmoid(z):
    import math
    if z < -40:
        return 0.0
    return 1 / (1 + math.exp(-z))


def solve(a, b):
    """Gaussian elimination with partial pivoting."""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for col in range(n):
        piv = max(range(col, n), key=lambda r: abs(m[r][col]))
        m[col], m[piv] = m[piv], m[col]
        for r in range(n):
            if r != col:
                f = m[r][col] / m[col][col]
                for c in range(col, n + 1):
                    m[r][c] -= f * m[col][c]
    return [m[i][n] / m[i][i] for i in range(n)]


def fit(xs, ys, iters=25):
    """Newton / IRLS on [1, x...] with an L2 penalty (bias not penalised)."""
    d = len(xs[0]) + 1
    beta = [0.0] * d
    for _ in range(iters):
        grad = [0.0] * d
        hess = [[0.0] * d for _ in range(d)]
        for x, y in zip(xs, ys):
            row = [1.0] + x
            p = sigmoid(sum(b * v for b, v in zip(beta, row)))
            w = p * (1 - p)
            for i in range(d):
                grad[i] += (y - p) * row[i]
                ri = w * row[i]
                for j in range(i, d):
                    hess[i][j] += ri * row[j]
        for i in range(d):
            for j in range(i):
                hess[i][j] = hess[j][i]
        for i in range(1, d):
            grad[i] -= L2 * beta[i]
            hess[i][i] += L2
        step = solve(hess, grad)
        beta = [b + s for b, s in zip(beta, step)]
        if max(abs(s) for s in step) < 1e-8:
            break
    return beta[0], beta[1:]


def auc(scores, ys):
    """Mann-Whitney AUC with average ranks for ties."""
    order = sorted(range(len(scores)), key=lambda i: scores[i])
    ranks = [0.0] * len(scores)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and scores[order[j + 1]] == scores[order[i]]:
            j += 1
        for k in range(i, j + 1):
            ranks[order[k]] = (i + j) / 2 + 1
        i = j + 1
    pos = sum(ys)
    neg = len(ys) - pos
    rank_sum = sum(r for r, y in zip(ranks, ys) if y)
    return (rank_sum - pos * (pos + 1) / 2) / (pos * neg)


def roc(scores, ys, points=40):
    pairs = sorted(zip(scores, ys), key=lambda t: -t[0])
    pos = sum(ys)
    neg = len(ys) - pos
    tp = fp = 0
    curve = [(0.0, 0.0)]
    i = 0
    while i < len(pairs):
        s = pairs[i][0]
        while i < len(pairs) and pairs[i][0] == s:
            if pairs[i][1]:
                tp += 1
            else:
                fp += 1
            i += 1
        curve.append((fp / neg, tp / pos))
    if len(curve) > points:
        step = len(curve) / points
        curve = [curve[int(k * step)] for k in range(points)] + [curve[-1]]
    return [[round(a, 4), round(b, 4)] for a, b in curve]


def precision_at_1(groups, scores, ys):
    """For each synthetic person-day, send only the top-scored moment; how
    often was that one used? Ties keep the first moment in data order."""
    hits = 0
    for idx in groups.values():
        best = max(idx, key=lambda i: scores[i])
        hits += ys[best]
    return hits / len(groups)


def load():
    rows = []
    with open(os.path.join(HERE, "data", "synthetic.csv")) as fh:
        for r in csv.DictReader(fh):
            days = int(r["days_until_expiry"]) if r["days_until_expiry"] != "" else None
            hour = float(r["hour"])
            fav = r["favorite"] == "1"
            special = r["special"] or None
            rows.append({
                "user": int(r["user"]), "day": int(r["day"]),
                "x": features(r["category"], hour, fav, special, days, r["near"] == "1"),
                "rules": rules_score(r["category"], hour, fav, special, days),
                "y": int(r["used"]),
            })
    return rows


def main():
    rows = load()
    train = [r for r in rows if r["user"] % 5 != 0]
    test = [r for r in rows if r["user"] % 5 == 0]
    bias, weights = fit([r["x"] for r in train], [r["y"] for r in train])

    ys = [r["y"] for r in test]
    model_scores = [sigmoid(bias + sum(w * v for w, v in zip(weights, r["x"]))) for r in test]
    rule_scores = [r["rules"] for r in test]
    groups = defaultdict(list)
    for i, r in enumerate(test):
        groups[(r["user"], r["day"])].append(i)

    def summary(scores):
        sent = [i for i, s in enumerate(scores) if s >= THRESHOLD]
        return {
            "auc": round(auc(scores, ys), 3),
            "precisionAt1": round(precision_at_1(groups, scores, ys), 3),
            "sendRate": round(len(sent) / len(scores), 3),
            "useRateWhenSent": round(sum(ys[i] for i in sent) / len(sent), 3) if sent else None,
        }

    out = {
        "version": 1,
        "kind": "logistic-regression",
        "data": "synthetic",
        "trainedAt": date.today().isoformat(),
        "features": FEATURES,
        "bias": round(bias, 4),
        "weights": [round(w, 4) for w in weights],
        "threshold": THRESHOLD,
        "rows": {"train": len(train), "test": len(test), "testPersonDays": len(groups)},
        "baseRate": round(sum(ys) / len(ys), 3),
        "metrics": {"model": summary(model_scores), "rules": summary(rule_scores)},
        "roc": {"model": roc(model_scores, ys), "rules": roc(rule_scores, ys)},
        "note": "Trained and evaluated on synthetic data only. Not evidence of lift on real customers.",
    }
    path = os.path.join(HERE, "..", "shared", "model.json")
    with open(path, "w") as fh:
        json.dump(out, fh, indent=2)
    m, r = out["metrics"]["model"], out["metrics"]["rules"]
    print("weights", dict(zip(FEATURES, out["weights"])), "bias", out["bias"])
    print(f"model  AUC {m['auc']}  P@1 {m['precisionAt1']}  send rate {m['sendRate']}")
    print(f"rules  AUC {r['auc']}  P@1 {r['precisionAt1']}  send rate {r['sendRate']}")
    print(f"wrote {os.path.normpath(path)}")


if __name__ == "__main__":
    main()
