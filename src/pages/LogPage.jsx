import { useState } from 'react';

const LOG_CATEGORIES = [
  {
    id: 'water',
    icon: '💧',
    label: 'Water',
    color: 'var(--accent-blue)',
    unit: 'ml',
    options: [250, 330, 500, 750, 1000],
    goal: 2500,
    goalUnit: 'ml',
  },
  {
    id: 'caffeine',
    icon: '☕',
    label: 'Caffeine',
    color: '#c8956c',
    unit: 'mg',
    options: [30, 80, 150, 200, 300],
    goal: 400,
    goalUnit: 'mg',
  },
  {
    id: 'alcohol',
    icon: '🍷',
    label: 'Alcohol',
    color: '#c0392b',
    unit: 'drinks',
    options: [0.5, 1, 1.5, 2, 3],
    goal: 2,
    goalUnit: 'drinks',
  },
  {
    id: 'mood',
    icon: '😊',
    label: 'Mood',
    color: 'var(--accent-steps)',
    options: ['😔', '😐', '🙂', '😊', '😄'],
    isEmoji: true,
    goal: null,
  },
  {
    id: 'energy',
    icon: '⚡',
    label: 'Energy',
    color: 'var(--accent-strain)',
    options: [1, 2, 3, 4, 5],
    isScale: true,
    goal: null,
    scaleLabel: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
  },
  {
    id: 'stress',
    icon: '🧠',
    label: 'Stress',
    color: 'var(--accent-heart)',
    options: [1, 2, 3, 4, 5],
    isScale: true,
    goal: null,
    scaleLabel: ['None', 'Mild', 'Moderate', 'High', 'Very High'],
  },
];

const WORKOUT_TYPES = [
  { id: 'run', icon: '🏃', label: 'Run' },
  { id: 'bike', icon: '🚴', label: 'Bike' },
  { id: 'swim', icon: '🏊', label: 'Swim' },
  { id: 'lift', icon: '🏋️', label: 'Weights' },
  { id: 'yoga', icon: '🧘', label: 'Yoga' },
  { id: 'walk', icon: '🚶', label: 'Walk' },
  { id: 'hiit', icon: '🔥', label: 'HIIT' },
  { id: 'sport', icon: '⚽', label: 'Sport' },
];

function LogCard({ category, loggedValues, onLog }) {
  const { icon, label, color, unit, options, isEmoji, isScale, scaleLabel, goal } = category;
  const total = loggedValues.reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
  const lastVal = loggedValues[loggedValues.length - 1];

  return (
    <div className="card" style={{ marginBottom: 12, borderColor: `${color}25` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{label}</div>
            {goal && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Goal: {goal} {unit}
              </div>
            )}
          </div>
        </div>
        {!isEmoji && typeof total === 'number' && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>
              {total > 0 ? total : '—'}
            </div>
            {total > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{unit}</div>}
          </div>
        )}
        {isEmoji && lastVal && (
          <div style={{ fontSize: '1.8rem' }}>{lastVal}</div>
        )}
        {isScale && lastVal && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{lastVal}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>/ 5</div>
          </div>
        )}
      </div>

      {/* Goal progress */}
      {goal && total > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (total / goal) * 100)}%`, background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 3, textAlign: 'right' }}>
            {total} / {goal} {unit}
          </div>
        </div>
      )}

      {/* Option buttons */}
      <div className="log-grid">
        {options.map((opt, i) => (
          <button
            key={i}
            className={`log-item ${isEmoji ? (lastVal === opt ? 'selected' : '') : ''}`}
            style={{ borderColor: `${color}30` }}
            onClick={() => onLog(category.id, opt, isEmoji || isScale)}
          >
            {isEmoji ? opt : isScale ? `${opt} · ${scaleLabel[i - 1] || scaleLabel[i]}` : `+${opt}${unit}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LogPage() {
  const [activeTab, setActiveTab] = useState('lifestyle');
  const [loggedValues, setLoggedValues] = useState({});
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLog = (categoryId, value, replace = false) => {
    setLoggedValues(prev => {
      const existing = prev[categoryId] || [];
      const updated = replace ? [value] : [...existing, value];
      return { ...prev, [categoryId]: updated };
    });

    showToast(`Logged ${value}${typeof value === 'number' ? '' : ''} ✓`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleJournalSave = () => {
    if (!journalText.trim()) return;
    setJournalSaved(true);
    showToast('Journal saved ✓');
    setTimeout(() => setJournalSaved(false), 2000);
  };

  const exportData = () => {
    const data = {
      date: new Date().toLocaleDateString(),
      logged: loggedValues,
      journal: journalText,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bevel-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported! ✓');
  };

  const exportCSV = () => {
    const rows = [['Category', 'Value', 'Date']];
    Object.entries(loggedValues).forEach(([cat, vals]) => {
      vals.forEach(v => rows.push([cat, v, new Date().toLocaleDateString()]));
    });
    if (journalText) rows.push(['journal', journalText.replace(/,/g, ';'), new Date().toLocaleDateString()]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bevel-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV Exported! ✓');
  };

  return (
    <div className="page-content">
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(86,227,159,0.07) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="page-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <div>
            <h1 className="page-title">Log</h1>
            <p className="page-subtitle">Track & journal your day</p>
          </div>
          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={exportData}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}
            >
              JSON
            </button>
            <button
              onClick={exportCSV}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}
            >
              CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['lifestyle', 'workout', 'journal'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                transition: 'all 0.2s',
                background: activeTab === tab ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-secondary)',
              }}
            >
              {tab === 'lifestyle' ? '🌿 Lifestyle' : tab === 'workout' ? '🏃 Workout' : '📓 Journal'}
            </button>
          ))}
        </div>

        {/* Lifestyle tab */}
        {activeTab === 'lifestyle' && (
          <div>
            {LOG_CATEGORIES.map(cat => (
              <LogCard
                key={cat.id}
                category={cat}
                loggedValues={loggedValues[cat.id] || []}
                onLog={handleLog}
              />
            ))}
          </div>
        )}

        {/* Workout tab */}
        {activeTab === 'workout' && (
          <div>
            <div className="card" style={{ marginBottom: 12 }}>
              <h2 className="section-title" style={{ marginBottom: 14 }}>Log Workout</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {WORKOUT_TYPES.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleLog('workout', w.label, false)}
                    style={{
                      background: (loggedValues.workout || []).includes(w.label) ? 'rgba(255,107,53,0.15)' : 'var(--bg-elevated)',
                      border: `1px solid ${(loggedValues.workout || []).includes(w.label) ? 'rgba(255,107,53,0.4)' : 'var(--border-subtle)'}`,
                      borderRadius: 14,
                      padding: '16px 12px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                      color: (loggedValues.workout || []).includes(w.label) ? 'var(--accent-strain)' : 'var(--text-primary)',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{w.icon}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{w.label}</span>
                  </button>
                ))}
              </div>

              {(loggedValues.workout || []).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Logged today:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(loggedValues.workout || []).map((w, i) => (
                      <span key={i} className="badge badge-strain">{w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Duration & Effort */}
            <div className="card" style={{ marginBottom: 12 }}>
              <h2 className="section-title" style={{ marginBottom: 14 }}>Duration</h2>
              <div className="log-grid">
                {[15, 20, 30, 45, 60, 90].map(min => (
                  <button
                    key={min}
                    className={`log-item ${(loggedValues.duration || [])[0] === min ? 'selected' : ''}`}
                    onClick={() => handleLog('duration', min, true)}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="section-title" style={{ marginBottom: 14 }}>Effort Level</h2>
              <div className="log-grid">
                {['😴 Easy', '🙂 Moderate', '😤 Hard', '🔥 Max'].map((e, i) => (
                  <button
                    key={i}
                    className={`log-item ${(loggedValues.effort || [])[0] === e ? 'selected' : ''}`}
                    onClick={() => handleLog('effort', e, true)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Journal tab */}
        {activeTab === 'journal' && (
          <div>
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 className="section-title">Today's Journal</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <textarea
                className="input-field"
                style={{ minHeight: 160, resize: 'none', lineHeight: 1.6 }}
                placeholder="How are you feeling today? What did you eat? Any notes on your workout or recovery..."
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
              />
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: 12 }}
                onClick={handleJournalSave}
              >
                {journalSaved ? '✓ Saved!' : 'Save Journal'}
              </button>
            </div>

            {/* Past entries placeholder */}
            <div className="card" style={{ marginBottom: 12, opacity: 0.6 }}>
              <h2 className="section-title" style={{ marginBottom: 10 }}>Past Entries</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your journal entries will appear here. Start writing above!
              </div>
            </div>

            {/* Export section */}
            <div className="card" style={{ marginBottom: 20 }}>
              <h2 className="section-title" style={{ marginBottom: 6 }}>Export Data</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                Export all your logged data and journal entries.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={exportData}>
                  📥 Export JSON
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }} onClick={exportCSV}>
                  📊 Export CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
