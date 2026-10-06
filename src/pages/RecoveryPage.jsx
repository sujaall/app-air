import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScoreRing, MetricCard, InsightCard, ProgressBar, SkeletonCard } from '../components/UI';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';

function computeRecovery(hrAvg, sleepHours, hrv) {
  if (hrv) {
    return Math.round(Math.min(100, Math.min(hrv / 80, 1) * 40 + Math.min(sleepHours / 8, 1) * 40 + Math.max(0, (80 - hrAvg) / 30) * 20));
  }
  return Math.round(Math.min(100, Math.min(sleepHours / 8, 1) * 60 + Math.max(0, (80 - hrAvg) / 50) * 40));
}

function getRecoveryLabel(r) {
  if (r < 33) return { label: 'Low', color: 'var(--accent-heart)', emoji: '😴', advice: 'Your body needs more rest. Light activity only.' };
  if (r < 66) return { label: 'Moderate', color: 'var(--accent-steps)', emoji: '😐', advice: 'Some recovery still needed. Consider a moderate workout.' };
  return { label: 'Optimal', color: 'var(--accent-recovery)', emoji: '💪', advice: 'You\'re well recovered. Push hard today!' };
}

// Mock HRV trend for last 7 days
function generateHRVTrend(baseHrv = 48) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    hrv: Math.round(baseHrv + (Math.sin(i * 0.8) * 8) + (Math.random() * 6 - 3)),
    recovery: Math.round(60 + Math.sin(i * 0.8) * 20 + Math.random() * 10),
  }));
}

export default function RecoveryPage() {
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

  const { heartRate, sleep, hrv: mockHrv, rhr: mockRhr, recovery: mockRecovery, spo2: mockSpo2 } = healthData;
  const hrv = mockHrv ?? 48;
  const rhr = mockRhr ?? heartRate.min ?? 54;
  const spo2 = mockSpo2 ?? 98;
  const recovery = mockRecovery ?? computeRecovery(heartRate.avg, sleep.totalHours, hrv);
  const { label: recovLabel, color: recovColor, emoji, advice } = getRecoveryLabel(recovery);
  const trendData = generateHRVTrend(hrv);
  const avgHrv = trendData.reduce((s, d) => s + d.hrv, 0) / trendData.length;

  return (
    <div className="page-content">
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(78,205,196,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div>
            <h1 className="page-title">Recovery</h1>
            <p className="page-subtitle">How well are you recovered?</p>
          </div>
          <span className="badge badge-recovery">{recovLabel}</span>
        </div>

        {/* Big Recovery Ring */}
        <div className={`card animate-fade-up`} style={{ marginBottom: 12, opacity: visible ? 1 : 0, borderColor: 'rgba(78,205,196,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ScoreRing score={recovery} color={recovColor} size={130} strokeWidth={13}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: recovColor, lineHeight: 1 }}>{recovery}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>/ 100</div>
              </div>
            </ScoreRing>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: recovColor }}>{recovLabel} Recovery</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{advice}</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <ProgressBar value={recovery} max={100} color={recovColor} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              <span>Low</span><span>Moderate</span><span>Optimal</span>
            </div>
          </div>
        </div>

        {/* Key Recovery Metrics */}
        <div className={`metric-grid animate-fade-up animate-delay-1`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <MetricCard
            icon="💓"
            label="HRV"
            value={hrv}
            unit="ms"
            color="var(--accent-recovery)"
          />
          <MetricCard
            icon="❤️"
            label="Resting HR"
            value={rhr}
            unit="bpm"
            color="var(--accent-heart)"
          />
          <MetricCard
            icon="🫁"
            label="SpO2"
            value={spo2}
            unit="%"
            color="var(--accent-blue)"
          />
          <MetricCard
            icon="💤"
            label="Sleep"
            value={sleep.totalHours}
            unit="h"
            color="var(--accent-sleep)"
          />
        </div>

        {/* HRV Trend */}
        <div className={`card animate-fade-up animate-delay-2`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 className="section-title">HRV Trend</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>7-day heart rate variability</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>7-day avg</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-recovery)' }}>{Math.round(avgHrv)} ms</div>
            </div>
          </div>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.75rem' }}
                  formatter={(v) => [`${v} ms`, 'HRV']}
                />
                <ReferenceLine y={avgHrv} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="hrv"
                  stroke="var(--accent-recovery)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--accent-recovery)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recovery Trend */}
        <div className={`card animate-fade-up animate-delay-3`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Recovery Score Trend</h2>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter' }} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.75rem' }}
                  formatter={(v) => [`${v}%`, 'Recovery']}
                />
                <ReferenceLine y={66} stroke="rgba(78,205,196,0.2)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="recovery"
                  stroke="var(--accent-sleep)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--accent-sleep)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* What affects recovery */}
        <div className={`card animate-fade-up animate-delay-4`} style={{ marginBottom: 20, opacity: visible ? 1 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 14 }}>Recovery Factors</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Sleep Quality', value: Math.round(Math.min((sleep.totalHours / 8) * 100, 100)), color: 'var(--accent-sleep)' },
              { label: 'HRV Status', value: Math.round(Math.min((hrv / 80) * 100, 100)), color: 'var(--accent-recovery)' },
              { label: 'Resting Heart Rate', value: Math.round(Math.max(0, (80 - rhr) / 30) * 100), color: 'var(--accent-heart)' },
              { label: 'SpO2', value: spo2, color: 'var(--accent-blue)' },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{f.label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: f.color }}>{f.value}%</span>
                </div>
                <ProgressBar value={f.value} max={100} color={f.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className={`animate-fade-up animate-delay-5`} style={{ marginBottom: 20, opacity: visible ? 1 : 0 }}>
          <InsightCard
            icon="💡"
            title="Boost your recovery"
            body={`Your HRV of ${hrv}ms is ${hrv > avgHrv ? 'above' : 'below'} your 7-day average. ${hrv > avgHrv ? 'Great sign — your body is adapting well.' : 'Try going to bed 30 minutes earlier tonight.'}`}
          />
        </div>
      </div>
    </div>
  );
}
