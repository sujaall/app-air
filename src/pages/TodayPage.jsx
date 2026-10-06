import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ScoreRing, MetricCard, Section, InsightCard, MiniBar, SkeletonCard, ProgressBar } from '../components/UI';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDay() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Compute strain score from activity data (0-21 Bevel-style)
function computeStrain(steps, activeMins, calories) {
  const stepScore = Math.min(steps / 10000, 1) * 7;
  const activeScore = Math.min(activeMins / 60, 1) * 7;
  const calScore = Math.min(calories / 2500, 1) * 7;
  return Math.min(21, stepScore + activeScore + calScore).toFixed(1);
}

// Compute recovery from HR and sleep
function computeRecovery(hrAvg, sleepHours, hrv) {
  if (hrv) {
    const hrvScore = Math.min(hrv / 80, 1) * 40;
    const sleepScore = Math.min(sleepHours / 8, 1) * 40;
    const hrScore = Math.max(0, (80 - hrAvg) / 30) * 20;
    return Math.round(Math.min(100, hrvScore + sleepScore + hrScore));
  }
  const sleepScore = Math.min(sleepHours / 8, 1) * 60;
  const hrScore = Math.max(0, (80 - hrAvg) / 50) * 40;
  return Math.round(Math.min(100, sleepScore + hrScore));
}

function computeSleepScore(totalHours, deepHours, remHours) {
  const durationScore = Math.min(totalHours / 8, 1) * 50;
  const qualityScore = Math.min((deepHours + remHours) / 3.5, 1) * 50;
  return Math.round(durationScore + qualityScore);
}

export default function TodayPage() {
  const { healthData, dataLoading, usingMock, user, refreshData, dataSource, isGHealthConnected } = useApp();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!healthData || dataLoading) {
    return (
      <div className="page-content">
        <div className="container" style={{ paddingTop: 16 }}>
          <SkeletonCard height={60} />
          <SkeletonCard height={200} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </div>
      </div>
    );
  }

  const { steps, calories, heartRate, activeMins, distance, sleep, weight, weeklySteps, hrv, rhr, recovery: mockRecovery, strain: mockStrain } = healthData;

  const strain = mockStrain ?? parseFloat(computeStrain(steps, activeMins, calories));
  const recovery = mockRecovery ?? computeRecovery(heartRate.avg, sleep.totalHours, hrv);
  const sleepScore = computeSleepScore(sleep.totalHours, sleep.deepHours, sleep.remHours);
  const strainPct = (strain / 21) * 100;
  const maxSteps = Math.max(...(weeklySteps.map(d => d.steps)), 1);
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  const insights = [
    {
      icon: '✦',
      title: 'Recovery looks strong today',
      body: `Your recovery score of ${recovery} suggests your body is well-rested. A moderate workout today could be ideal.`,
    },
    {
      icon: '💤',
      title: 'Sleep quality insight',
      body: `You got ${sleep.totalHours}h of sleep with ${sleep.deepHours}h deep sleep. Aim for 1.5–2h deep sleep consistently.`,
    },
  ];

  return (
    <div className="page-content">
      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(124,106,245,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{getDay()}</p>
            <h1 className="page-title">{getGreeting()}{user?.given_name ? `, ${user.given_name}` : ''} 👋</h1>
          </div>
          <button
            onClick={refreshData}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3" />
            </svg>
          </button>
        </div>

        {usingMock && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,106,245,0.08), rgba(78,205,196,0.05))',
            border: '1px solid rgba(124,106,245,0.2)',
            borderRadius: 14, padding: '12px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>✨</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Demo Mode</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1 }}>Showing sample health data</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '7px 14px', borderRadius: 99, border: 'none',
                background: 'linear-gradient(135deg, #4285F4, #34A853)',
                color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Connect →
            </button>
          </div>
        )}
        {!usingMock && dataSource === 'ghealth' && (
          <div style={{ background: 'rgba(66,133,244,0.07)', border: '1px solid rgba(66,133,244,0.2)', borderRadius: 12, padding: '8px 14px', marginBottom: 16, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="url(#ghGrad)"/><defs><linearGradient id="ghGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4285F4"/><stop offset="100%" stopColor="#34A853"/></linearGradient></defs></svg>
            <span style={{ background: 'linear-gradient(90deg, #4285F4, #34A853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live data from <strong>Google Health API</strong></span>
          </div>
        )}
        {!usingMock && dataSource === 'google' && (
          <div style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)', borderRadius: 12, padding: '8px 14px', marginBottom: 16, fontSize: '0.78rem', color: '#4285F4', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
            Live data from <strong>Google Fit</strong> (deprecated)
          </div>
        )}

        {/* Triple score cards */}
        <div
          className={`animate-fade-up`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginBottom: 20,
            opacity: visible ? 1 : 0,
          }}
        >
          {/* Strain */}
          <div className="card" style={{ padding: '16px 12px', textAlign: 'center', borderColor: 'rgba(255,107,53,0.2)' }}>
            <ScoreRing score={strainPct} color="var(--accent-strain)" size={80} strokeWidth={8}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-strain)' }}>{strain}</span>
            </ScoreRing>
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strain</div>
          </div>

          {/* Recovery */}
          <div className="card" style={{ padding: '16px 12px', textAlign: 'center', borderColor: 'rgba(78,205,196,0.2)' }}>
            <ScoreRing score={recovery} color="var(--accent-recovery)" size={80} strokeWidth={8}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-recovery)' }}>{recovery}</span>
            </ScoreRing>
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recovery</div>
          </div>

          {/* Sleep */}
          <div className="card" style={{ padding: '16px 12px', textAlign: 'center', borderColor: 'rgba(124,106,245,0.2)' }}>
            <ScoreRing score={sleepScore} color="var(--accent-sleep)" size={80} strokeWidth={8}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-sleep)' }}>{sleep.totalHours}h</span>
            </ScoreRing>
            <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sleep</div>
          </div>
        </div>

        {/* Steps + weekly chart */}
        <div className={`card animate-fade-up animate-delay-1`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Steps Today</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--accent-steps)', lineHeight: 1 }}>
                {steps.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Goal: 10,000</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-strain">{Math.round((steps / 10000) * 100)}%</span>
            </div>
          </div>

          {/* Progress */}
          <ProgressBar value={steps} max={10000} color="var(--accent-steps)" />

          {/* Weekly bars */}
          {weeklySteps.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>This Week</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                {weeklySteps.map((d, i) => (
                  <MiniBar
                    key={i}
                    value={d.steps}
                    max={maxSteps}
                    color="var(--accent-steps)"
                    label={d.day}
                    isToday={d.day === todayDayName}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metric grid */}
        <div className={`metric-grid animate-fade-up animate-delay-2`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <MetricCard
            icon="🔥"
            label="Calories"
            value={calories.toLocaleString()}
            unit="kcal"
            color="var(--accent-strain)"
          />
          <MetricCard
            icon="❤️"
            label="Heart Rate"
            value={heartRate.avg}
            unit="bpm"
            color="var(--accent-heart)"
          />
          <MetricCard
            icon="⚡"
            label="Active Mins"
            value={activeMins}
            unit="min"
            color="var(--accent-recovery)"
          />
          <MetricCard
            icon="📍"
            label="Distance"
            value={distance}
            unit="km"
            color="var(--accent-blue)"
          />
        </div>

        {/* HR Chart */}
        {heartRate.data.length > 0 && (
          <div className={`card animate-fade-up animate-delay-3`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
            <div className="section-header">
              <h2 className="section-title">Heart Rate</h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-heart)' }}>
                {heartRate.avg} avg
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Min <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{heartRate.min}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Max <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{heartRate.max}</span>
              </div>
            </div>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRate.data}>
                  <defs>
                    <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-heart)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--accent-heart)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" hide />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.75rem' }}
                    formatter={(v) => [`${Math.round(v)} bpm`, 'Heart Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="bpm"
                    stroke="var(--accent-heart)"
                    strokeWidth={2}
                    fill="url(#hrGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className={`animate-fade-up animate-delay-4`} style={{ marginBottom: 20, opacity: visible ? 1 : 0 }}>
          <Section title="Intelligence">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <InsightCard key={i} icon={ins.icon} title={ins.title} body={ins.body} />
              ))}
            </div>
          </Section>
        </div>

        {/* Weight */}
        {weight && (
          <div className={`card animate-fade-up animate-delay-5`} style={{ marginBottom: 20, opacity: visible ? 1 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Weight</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{weight} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>kg</span></div>
              </div>
              <div style={{ fontSize: '2.5rem' }}>⚖️</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
