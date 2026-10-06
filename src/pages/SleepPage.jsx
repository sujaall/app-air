import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScoreRing, SleepStagesBar, MetricCard, InsightCard, ProgressBar, SkeletonCard } from '../components/UI';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

function computeSleepScore(totalHours, deepHours, remHours) {
  const durationScore = Math.min(totalHours / 8, 1) * 50;
  const qualityScore = Math.min((deepHours + remHours) / 3.5, 1) * 50;
  return Math.round(durationScore + qualityScore);
}

function getSleepLabel(score) {
  if (score < 40) return { label: 'Poor', color: 'var(--accent-heart)', emoji: '😴' };
  if (score < 70) return { label: 'Fair', color: 'var(--accent-steps)', emoji: '😐' };
  if (score < 85) return { label: 'Good', color: 'var(--accent-recovery)', emoji: '😊' };
  return { label: 'Excellent', color: 'var(--accent-sleep)', emoji: '⭐' };
}

// Generate week sleep trend
function generateSleepTrend(baseHours = 7.4) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    hours: parseFloat((baseHours + (Math.sin(i * 0.9) * 1.2) + (Math.random() * 0.6 - 0.3)).toFixed(1)),
    quality: Math.round(65 + Math.sin(i * 0.8) * 20 + Math.random() * 10),
  }));
}

const STAGE_INFO = [
  { key: 'remHours', label: 'REM', color: '#4d8eff', desc: 'Memory & learning. Target: 1.5–2h' },
  { key: 'deepHours', label: 'Deep', color: '#7c6af5', desc: 'Physical restoration. Target: 1.5–2h' },
  { key: 'lightHours', label: 'Light', color: '#4ecdc4', desc: 'Transition sleep. Natural baseline.' },
  { key: 'awakeHours', label: 'Awake', color: 'rgba(255,255,255,0.2)', desc: 'Brief wakings are normal.' },
];

export default function SleepPage() {
  const { healthData, dataLoading } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!healthData || dataLoading) {
    return (
      <div className="page-content">
        <div className="container" style={{ paddingTop: 16 }}>
          <SkeletonCard height={60} />
          <SkeletonCard height={220} />
          <SkeletonCard height={160} />
        </div>
      </div>
    );
  }

  const { sleep } = healthData;
  const { totalHours, deepHours, remHours, lightHours, awakeHours = 0, stages = [] } = sleep;
  const sleepScore = computeSleepScore(totalHours, deepHours, remHours);
  const { label: sleepLabel, color: sleepColor, emoji } = getSleepLabel(sleepScore);
  const trendData = generateSleepTrend(totalHours);

  const stagesWithData = STAGE_INFO.map(s => ({
    ...s,
    hours: sleep[s.key] ?? 0,
  })).filter(s => s.hours > 0);

  // Build simple sleep architecture data
  const sleepTimeline = [
    { time: '10pm', depth: 0 }, { time: '11pm', depth: 20 }, { time: '12am', depth: 60 },
    { time: '1am', depth: 90 }, { time: '2am', depth: 80 }, { time: '3am', depth: 40 },
    { time: '4am', depth: 70 }, { time: '5am', depth: 85 }, { time: '6am', depth: 50 },
    { time: '6:30am', depth: 10 }, { time: '7am', depth: 0 },
  ];

  return (
    <div className="page-content">
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(124,106,245,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div>
            <h1 className="page-title">Sleep</h1>
            <p className="page-subtitle">Last night's analysis</p>
          </div>
          <span className="badge badge-sleep">{sleepLabel}</span>
        </div>

        {/* Sleep Score Ring */}
        <div className={`card animate-fade-up`} style={{ marginBottom: 12, opacity: visible ? 1 : 0, borderColor: 'rgba(124,106,245,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ScoreRing score={sleepScore} color={sleepColor} size={130} strokeWidth={13}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: sleepColor, lineHeight: 1 }}>{sleepScore}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>score</div>
              </div>
            </ScoreRing>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: sleepColor, marginBottom: 4 }}>{sleepLabel}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {totalHours}
                <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>hours</span>
              </div>
            </div>
          </div>

          {/* Sleep stages bar */}
          {stages.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Sleep Stages
              </div>
              <SleepStagesBar stages={stages} />
            </div>
          )}
        </div>

        {/* Stage breakdown */}
        <div className={`metric-grid animate-fade-up animate-delay-1`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <MetricCard icon="🌀" label="REM" value={remHours} unit="h" color="#4d8eff" />
          <MetricCard icon="🌊" label="Deep" value={deepHours} unit="h" color="var(--accent-sleep)" />
          <MetricCard icon="💫" label="Light" value={lightHours} unit="h" color="var(--accent-recovery)" />
          <MetricCard icon="😴" label="Awake" value={awakeHours} unit="h" color="rgba(255,255,255,0.3)" />
        </div>

        {/* Sleep Stages detail */}
        <div className={`card animate-fade-up animate-delay-2`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 14 }}>Stage Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stagesWithData.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.label} Sleep</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>{s.desc}</span>
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: s.color }}>{s.hours}h</span>
                </div>
                <ProgressBar value={s.hours} max={totalHours} color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Sleep Architecture Chart */}
        <div className={`card animate-fade-up animate-delay-3`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Sleep Architecture</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Depth of sleep throughout the night</p>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepTimeline}>
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-sleep)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--accent-sleep)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.75rem' }}
                  formatter={(v) => [`${v}%`, 'Sleep Depth']}
                />
                <Area
                  type="monotone"
                  dataKey="depth"
                  stroke="var(--accent-sleep)"
                  strokeWidth={2}
                  fill="url(#sleepGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Sleep Trend */}
        <div className={`card animate-fade-up animate-delay-4`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 className="section-title">Weekly Trend</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>Sleep duration this week</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>7-day avg</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-sleep)' }}>
                {(trendData.reduce((s, d) => s + d.hours, 0) / trendData.length).toFixed(1)}h
              </div>
            </div>
          </div>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="sleepWeekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-sleep)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent-sleep)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.75rem' }}
                  formatter={(v) => [`${v}h`, 'Sleep']}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--accent-sleep)"
                  strokeWidth={2}
                  fill="url(#sleepWeekGrad)"
                  dot={{ r: 3, fill: 'var(--accent-sleep)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight */}
        <div className={`animate-fade-up animate-delay-5`} style={{ marginBottom: 20, opacity: visible ? 1 : 0 }}>
          <InsightCard
            icon="🌙"
            title="Sleep optimization tip"
            body={`You got ${remHours}h of REM sleep, which is ${remHours >= 1.5 ? 'great' : 'below optimal'}. Try maintaining a consistent bedtime to increase REM. Your deep sleep of ${deepHours}h ${deepHours >= 1.5 ? 'looks healthy' : 'could be improved with less screen time before bed'}.`}
          />
        </div>
      </div>
    </div>
  );
}
