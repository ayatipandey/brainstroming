import { useId, useMemo, useState } from 'react';
import model from '@shared/model.json';

// ROC curves for the trained model and the rules baseline, on held-out
// synthetic users. One axis pair, two series, direct labels plus a legend,
// a hover readout, and a table view.

const W = 520;
const H = 400;
const PAD = { l: 56, r: 20, t: 16, b: 52 };
const SERIES = [
  { key: 'model', label: 'Trained model', color: '#285bc5', dash: null },
  { key: 'rules', label: 'Rules baseline', color: '#b06a12', dash: '7 6' },
];

const x = (v) => PAD.l + v * (W - PAD.l - PAD.r);
const y = (v) => H - PAD.b - v * (H - PAD.t - PAD.b);
const path = (pts) => pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join(' ');

function tprAt(curve, fpr) {
  for (let i = 1; i < curve.length; i++) {
    const [a0, b0] = curve[i - 1];
    const [a1, b1] = curve[i];
    if (fpr <= a1) return a1 === a0 ? b1 : b0 + ((fpr - a0) / (a1 - a0)) * (b1 - b0);
  }
  return 1;
}

export default function ModelChart() {
  const id = useId();
  const [hover, setHover] = useState(null);
  const { metrics, roc, rows } = model;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const pct = (v) => `${Math.round(v * 100)}%`;

  const onMove = (e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const f = (p.x - PAD.l) / (W - PAD.l - PAD.r);
    setHover(f >= 0 && f <= 1 ? f : null);
  };

  const readout = useMemo(() => hover == null ? null : SERIES.map((s) => ({ ...s, tpr: tprAt(roc[s.key], hover) })), [hover, roc]);

  return (
    <figure className="chart" aria-labelledby={`${id}-cap`}>
      <div className="chart-legend" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.key} className="chart-key">
            <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke={s.color} strokeWidth="3" strokeDasharray={s.dash || undefined} /></svg>
            {s.label}, AUC {metrics[s.key].auc.toFixed(3)}
          </span>
        ))}
      </div>
      <div className="chart-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`ROC curves on synthetic test data. Trained model AUC ${metrics.model.auc}, rules baseline AUC ${metrics.rules.auc}.`}
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(0)} x2={x(1)} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={x(0) - 10} y={y(t) + 5} textAnchor="end" className="chart-tick">{pct(t)}</text>
              <text x={x(t)} y={H - PAD.b + 26} textAnchor="middle" className="chart-tick">{pct(t)}</text>
            </g>
          ))}
          <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} className="chart-chance" />
          <text x={x(0.8)} y={y(0.74)} className="chart-note" transform={`rotate(-37 ${x(0.8)} ${y(0.74)})`}>Chance</text>
          {SERIES.map((s) => (
            <path key={s.key} d={path(roc[s.key])} fill="none" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash || undefined} strokeLinejoin="round" />
          ))}
          <text x={x(0.16)} y={y(0.79)} className="chart-label">Model</text>
          <text x={x(0.33)} y={y(0.56)} className="chart-label">Rules</text>
          {readout && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={y(0)} y2={y(1)} className="chart-cross" />
              {readout.map((r) => (
                <circle key={r.key} cx={x(hover)} cy={y(r.tpr)} r="5" fill={r.color} stroke="#fff" strokeWidth="2" />
              ))}
            </g>
          )}
          <text x={(x(0) + x(1)) / 2} y={H - 8} textAnchor="middle" className="chart-axis">False positive rate</text>
          <text x={14} y={(y(0) + y(1)) / 2} textAnchor="middle" className="chart-axis" transform={`rotate(-90 14 ${(y(0) + y(1)) / 2})`}>True positive rate</text>
        </svg>
        <p className="chart-readout" aria-live="polite">
          {readout
            ? `At a ${pct(hover)} false positive rate: model finds ${pct(readout[0].tpr)} of used moments, rules find ${pct(readout[1].tpr)}.`
            : 'Point at the chart to compare the two curves.'}
        </p>
      </div>
      <figcaption id={`${id}-cap`} className="chart-cap">
        Held-out synthetic people: {rows.test.toLocaleString()} moments over {rows.testPersonDays.toLocaleString()} person-days. Synthetic data only. This shows the model learned the simulated behaviour, not that it lifts results for real customers.
      </figcaption>
      <details className="chart-table">
        <summary>Show the numbers as a table</summary>
        <table>
          <caption className="visually-hidden">Model and rules metrics on synthetic test data</caption>
          <thead>
            <tr><th scope="col">Measure</th><th scope="col">Trained model</th><th scope="col">Rules baseline</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">AUC</th><td>{metrics.model.auc.toFixed(3)}</td><td>{metrics.rules.auc.toFixed(3)}</td></tr>
            <tr><th scope="row">Precision at 1 (top moment per person-day was used)</th><td>{pct(metrics.model.precisionAt1)}</td><td>{pct(metrics.rules.precisionAt1)}</td></tr>
            <tr><th scope="row">Moments at or above 70%</th><td>{pct(metrics.model.sendRate)}</td><td>{pct(metrics.rules.sendRate)}</td></tr>
            <tr><th scope="row">Used when sent</th><td>{pct(metrics.model.useRateWhenSent)}</td><td>{pct(metrics.rules.useRateWhenSent)}</td></tr>
          </tbody>
        </table>
      </details>
    </figure>
  );
}
