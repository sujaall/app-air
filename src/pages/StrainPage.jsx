import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScoreRing, MetricCard, ProgressBar, InsightCard, SkeletonCard } from '../components/UI';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';

function computeStrain(steps, activeMins, calories) {
  const stepScore = Math.min(steps / 10000, 1) * 7;
  const activeScore = Math.min(activeMins / 60, 1) * 7;
  const calScore = Math.min(calories / 2500, 1) * 7;
  return Math.min(21, stepScore + activeScore + calScore);
}

function getStrainLabel(s) {
  if (s < 5) return { label: 'Rest Day', color: 'var(--accent-recovery)', desc: 'Light activity. Your body is recovering.' };
  if (s < 9) return { label: 'Light', color: 'var(--accent-steps)', desc: 'Below average strain. Good for a recovery day.' };
  if (s < 14) return { label: 'Moderate', color: 'var(--accent-strain)', desc: 'Healthy activity level. Keep it up!' };
  if (s < 18) return { label: 'High', color: '#ff4500', desc: 'High strain today. Prioritize rest and nutrition.' };
  return { label: 'Max Effort', color: '#cc0000', desc: 'Extreme strain. Take tomorrow easy.' };
}

// Heart rate zones
function getHRZones(hrData, rhr = 60, maxHR = 185) {
  const zones = [
    { name: 'Zone 1', label: 'Warmup', min: rhr, max: rhr + (maxHR - rhr) * 0.6, color: '#4ecdc4', minutes: 0 },
    { name: 'Zone 2', label: 'Fat Burn', min: rhr + (maxHR - rhr) * 0.6, max: rhr + (maxHR - rhr) * 0.7, color: '#56e39f', minutes: 0 },
    { name: 'Zone 3', label: 'Aerobic', min: rhr + (maxHR - rhr) * 0.7, max: rhr + (maxHR - rhr) * 0.8, color: '#ffd93d', minutes: 0 },
    { name: 'Zone 4', label: 'Threshold', min: rhr + (maxHR - rhr) * 0.8, max: rhr + (maxHR - rhr) * 0.9, color: '#ff6b35', minutes: 0 },
    { name: 'Zone 5', label: 'Max', min: rhr + (maxHR - rhr) * 0.9, max: maxHR, color: '#ff4757', minutes: 0 },
  ];

  hrData.forEach(({ bpm }) => {
    const z = zones.findIndex(z => bpm >= z.min && bpm < z.max);
    if (z >= 0) zones[z].minutes += 1; // approximate 1hr buckets
  });

  return zones;
}

export default function StrainPage() {
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
          <SkeletonCard height={240} />
          <SkeletonCard height={160} />
        </div>
      </div>
    );
  }

  const { steps, calories, heartRate, activeMins, distance, weeklySteps, strain: mockStrain } = healthData;
  const strainVal = mockStrain ?? computeStrain(steps, activeMins, calories);
  const strainStr = parseFloat(strainVal).toFixed(1);
  const strainPct = (strainVal / 21) * 100;
  const { label: strainLabel, color: strainColor, desc: strainDesc } = getStrainLabel(strainVal);
  const hrZones = getHRZones(heartRate.data);

  // Build calorie breakdown
  const bmrCals = Math.round(calories * 0.65);
  const activeCals = calories - bmrCals;

  return (
    <div className="page-content">
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(255,107,53,0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div>
            <h1 className="page-title">Strain</h1>
            <p className="page-subtitle">Today's workload</p>
          </div>
          <span className="badge badge-strain">{strainLabel}</span>
        </div>

        {/* Big strain ring */}
        <div className={`card animate-fade-up`} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 24, opacity: visible ? 1 : 0, borderColor: 'rgba(255,107,53,0.2)' }}>
          <ScoreRing score={strainPct} color={strainColor} size={120} strokeWidth={12}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: strainColor, lineHeight: 1 }}>{strainStr}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>/ 21</div>
            </div>
          </ScoreRing>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: strainColor }}>{strainLabel}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{strainDesc}</div>
            <div style={{ marginTop: 12 }}>
              <ProgressBar value={strainVal} max={21} color={strainColor} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                <span>0</span><span>21</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity metrics */}
        <div className={`metric-grid animate-fade-up animate-delay-1`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <MetricCard icon="👟" label="Steps" value={steps.toLocaleString()} color="var(--accent-steps)" />
          <MetricCard icon="🔥" label="Active Cals" value={activeCals} unit="kcal" color="var(--accent-strain)" />
          <MetricCard icon="⏱️" label="Active Mins" value={activeMins} unit="min" color="var(--accent-recovery)" />
          <MetricCard icon="📍" label="Distance" value={distance} unit="km" color="var(--accent-blue)" />
        </div>

        {/* Calories breakdown */}
        <div className={`card animate-fade-up animate-delay-2`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Calories</h2>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-strain)' }}>{calories.toLocaleString()}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>BMR</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{bmrCals} kcal</span>
                </div>
                <ProgressBar value={bmrCals} max={calories} color="var(--accent-blue)" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{activeCals} kcal</span>
                </div>
                <ProgressBar value={activeCals} max={calories} color="var(--accent-strain)" />
              </div>
            </div>
          </div>
        </div>

        {/* Heart Rate Zones */}
        <div className={`card animate-fade-up animate-delay-3`} style={{ marginBottom: 12, opacity: visible ? 1 : 0 }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Heart Rate Zones</h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Avg {heartRate.avg} · Min {heartRate.min} · Max {heartRate.max} bpm
          </div>

          {/* Zone bar */}
          <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 3, marginBottom: 16 }}>
            {hrZones.map((z, i) => (
              <div
                key={i}
                style={{
                  flex: Math.max(z.minutes, 1),
                  background: z.minutes > 0 ? z.color : `${z.color}30`,
                  borderRadius: 99,
                  transition: 'flex 1s ease',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hrZones.map((z, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{z.name} · {z.label}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{z.minutes}m</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {Math.round(z.min)}–{Math.round(z.max)} bpm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly strain chart */}
        {weeklySteps && weeklySteps.length > 0 && (
          <div className={`card animate-fade-up animate-delay-4`} style={{ marginBottom: 20, opacity: visible ? 1 : 0 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Weekly Activity</h2>
            <div style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySteps} barSize={16}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)', fontFamily: 'Inter' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.75rem' }}
                    formatter={(v) => [v.toLocaleString(), 'Steps']}
                  />
                  <Bar dataKey="steps" fill="var(--accent-strain)" radius={[4, 4, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
