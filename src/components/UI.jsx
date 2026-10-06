import { useEffect, useRef } from 'react';

/**
 * Animated circular ring component
 * @param {number} score - 0 to 100
 * @param {string} color - stroke color
 * @param {number} size - SVG size in px
 * @param {number} strokeWidth
 * @param {React.ReactNode} children - center content
 */
export function ScoreRing({ score, color, size = 160, strokeWidth = 14, children, className = '' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`score-ring-container ${className}`} style={{ width: size, height: size }}>
      <svg
        className="score-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="score-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="score-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-label">{children}</div>
    </div>
  );
}

/**
 * Triple concentric rings (strain, recovery, sleep)
 */
export function TripleRing({ strain, recovery, sleep, size = 200 }) {
  const rings = [
    { value: strain, color: 'var(--accent-strain)', stroke: 14, label: 'Strain' },
    { value: recovery, color: 'var(--accent-recovery)', stroke: 14, label: 'Recovery' },
    { value: sleep, color: 'var(--accent-sleep)', stroke: 14, label: 'Sleep' },
  ];

  const gap = 20;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {rings.map((ring, i) => {
        const ringSize = size - i * gap * 2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * gap,
              left: i * gap,
            }}
          >
            <ScoreRing
              score={ring.value}
              color={ring.color}
              size={ringSize}
              strokeWidth={ring.stroke}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Simple metric card
 */
export function MetricCard({ icon, label, value, unit, color, change, changeLabel, style }) {
  return (
    <div className="metric-card" style={style}>
      <div
        className="metric-icon-badge"
        style={{ background: `${color}20` }}
      >
        <span style={{ color, fontSize: '1rem' }}>{icon}</span>
      </div>
      <div>
        <span className="metric-value" style={{ color }}>
          {value}
        </span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      <div className="metric-label">{label}</div>
      {change !== undefined && (
        <div className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)} {changeLabel}
        </div>
      )}
    </div>
  );
}

/**
 * Progress bar
 */
export function ProgressBar({ value, max = 100, color = 'var(--accent-recovery)' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar-track">
      <div
        className="progress-bar-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

/**
 * Sleep Stages visual bar
 */
export function SleepStagesBar({ stages = [] }) {
  const totalDur = stages.reduce((s, seg) => s + (seg.dur || 0), 0);
  if (totalDur === 0) return null;

  const stageColors = {
    1: 'rgba(255,255,255,0.15)', // awake
    2: 'rgba(78, 205, 196, 0.4)', // sleep (generic)
    3: 'rgba(255,255,255,0.05)', // out of bed
    4: '#4ecdc4', // light
    5: '#7c6af5', // deep
    6: '#4d8eff', // REM
  };

  return (
    <div className="sleep-stages">
      {stages.map((seg, i) => (
        <div
          key={i}
          className="sleep-stage-block"
          style={{
            width: `${(seg.dur / totalDur) * 100}%`,
            background: stageColors[seg.stage] || 'rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Section wrapper with header
 */
export function Section({ title, action, onAction, children, className = '' }) {
  return (
    <div className={`section ${className}`}>
      {title && (
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {action && (
            <button className="section-action" onClick={onAction}>
              {action}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * AI Insight card
 */
export function InsightCard({ title, body, icon = '✦' }) {
  return (
    <div className="insight-card">
      <div className="insight-icon">
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {body}
      </div>
    </div>
  );
}

/**
 * Mini bar (for weekly chart)
 */
export function MiniBar({ value, max, color, label, isToday }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div
        style={{
          width: '100%',
          height: 80,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${pct}%`,
            background: isToday ? color : `${color}60`,
            borderRadius: '6px 6px 0 0',
            transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      <span style={{ fontSize: '0.65rem', color: isToday ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: isToday ? 700 : 500 }}>
        {label}
      </span>
    </div>
  );
}

/**
 * Loading skeleton card
 */
export function SkeletonCard({ height = 120, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ height, borderRadius: 20, marginBottom: 12 }} />;
}
