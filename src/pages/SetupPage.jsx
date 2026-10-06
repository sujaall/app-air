import { useState, useEffect } from 'react';
import { saveGHealthSettings } from '../services/fitbit';

export default function SetupPage({ onDone }) {
  const defaultRedirect = window.location.origin;
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(defaultRedirect);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showSaved, setShowSaved] = useState({});

  // Load existing saved values (show them for verification)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bevel_ghealth_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        setShowSaved(parsed);
        // Pre-fill form with saved values
        if (parsed.clientId) setClientId(parsed.clientId);
        if (parsed.clientSecret) setClientSecret(parsed.clientSecret);
        if (parsed.redirectUri) setRedirectUri(parsed.redirectUri);
      }
    } catch {}
  }, []);

  const handleSave = () => {
    setError('');
    if (!clientId.trim()) { setError('Client ID is required'); return; }
    if (!clientSecret.trim()) { setError('Client Secret is required'); return; }
    if (!clientId.includes('.apps.googleusercontent.com')) {
      setError('Client ID must end with .apps.googleusercontent.com');
      return;
    }
    saveGHealthSettings(clientId.trim(), redirectUri.trim() || defaultRedirect, clientSecret.trim());
    setSaved(true);
    setTimeout(() => onDone?.(), 700);
  };

  const clearAll = () => {
    localStorage.removeItem('bevel_ghealth_settings');
    localStorage.removeItem('bevel_auth_error');
    localStorage.removeItem('bevel_ghealth_token');
    setClientId(''); setClientSecret(''); setRedirectUri(defaultRedirect);
    setShowSaved({});
    setSaved(false);
  };

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-primary)',
      padding: '24px 20px 40px', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => onDone?.()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem', padding: 0 }}>←</button>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Google Health Setup</h1>
        </div>

        {/* Currently saved values - diagnostic */}
        {showSaved.clientId && (
          <div style={{
            background: 'rgba(255,193,7,0.06)', border: '1px solid rgba(255,193,7,0.2)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,200,0,0.9)', marginBottom: 10 }}>
              ⚠️ Currently saved credentials (verify these are correct):
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 2, wordBreak: 'break-all' }}>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Client ID:</span> {showSaved.clientId}</div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Secret:</span> {showSaved.clientSecret ? showSaved.clientSecret.slice(0, 8) + '••••••••' + showSaved.clientSecret.slice(-4) : '⚠️ MISSING'}</div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Redirect:</span> {showSaved.redirectUri}</div>
            </div>
            <button onClick={clearAll} style={{
              marginTop: 10, padding: '6px 14px', borderRadius: 99, border: 'none',
              background: 'rgba(255,71,87,0.15)', color: 'var(--accent-heart)',
              fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              🗑 Clear all & start fresh
            </button>
          </div>
        )}

        {/* Visual step-by-step */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 16, padding: '16px 18px', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 14, color: 'var(--text-primary)' }}>
            📋 How to find your Client Secret
          </div>

          <ol style={{ paddingLeft: 18, margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 2.2 }}>
            <li>Open <a href="https://console.developers.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#4285F4' }}>Google Cloud → Credentials ↗</a></li>
            <li>Click your <strong style={{ color: 'var(--text-primary)' }}>OAuth 2.0 Client ID</strong> name</li>
            <li>Find <strong style={{ color: 'var(--text-primary)' }}>Client secret</strong> on the right side</li>
            <li>Click the <strong style={{ color: 'var(--text-primary)' }}>copy icon 📋</strong> next to it — don't type it!</li>
            <li>Paste it in the field below</li>
          </ol>

          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(66,133,244,0.07)', border: '1px solid rgba(66,133,244,0.15)',
            fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#4285F4' }}>Also verify:</strong> Under "Authorized redirect URIs",
            the value <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>{defaultRedirect}</code> must be listed exactly — no trailing slash.
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Client ID <span style={{ color: 'var(--accent-heart)' }}>*</span>
            </label>
            <textarea
              id="input-client-id"
              placeholder="123456789012-abcdefghijk.apps.googleusercontent.com"
              value={clientId}
              onChange={e => { setClientId(e.target.value.replace(/\s/g, '')); setSaved(false); }}
              rows={2}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'monospace',
                outline: 'none', resize: 'none', lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Client Secret <span style={{ color: 'var(--accent-heart)' }}>*</span>
            </label>
            <input
              id="input-client-secret"
              type="text"
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx"
              value={clientSecret}
              onChange={e => { setClientSecret(e.target.value.replace(/\s/g, '')); setSaved(false); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                background: 'var(--bg-elevated)', border: `1px solid ${!clientSecret && error ? 'rgba(255,71,87,0.5)' : 'var(--border-medium)'}`,
                color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: '0.71rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
              Starts with <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>GOCSPX-</code> • Use the clipboard icon in Google Cloud, don't type it
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Redirect URI
            </label>
            <input
              id="input-redirect-uri"
              type="text"
              value={redirectUri}
              onChange={e => { setRedirectUri(e.target.value.trim()); setSaved(false); }}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)', fontSize: '0.82rem', fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)',
              borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--accent-heart)',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            id="btn-save-settings"
            onClick={handleSave}
            style={{
              width: '100%', padding: '15px', borderRadius: 99, border: 'none',
              background: saved ? '#34A853' : 'linear-gradient(135deg, #4285F4, #34A853)',
              color: '#fff', fontSize: '1rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(66,133,244,0.3)',
              transition: 'background 0.3s, transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {saved ? '✓ Saved!' : 'Save & Connect'}
          </button>
        </div>

        <p style={{ fontSize: '0.71rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Credentials are saved only to this browser. Never sent anywhere except Google's OAuth servers.
        </p>
      </div>
    </div>
  );
}
