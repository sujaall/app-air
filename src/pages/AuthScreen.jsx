import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiateGHealthSignIn, isGHealthConfigured } from '../services/fitbit';

export default function AuthScreen() {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [err, setErr] = useState('');

  const configured = isGHealthConfigured();

  // Show any error that occurred during the OAuth callback redirect
  useEffect(() => {
    const storedErr = localStorage.getItem('bevel_auth_error');
    if (storedErr) {
      setErr(storedErr);
      localStorage.removeItem('bevel_auth_error');
    }
  }, []);

  const handleConnect = async () => {
    if (!configured) {
      navigate('/setup');
      return;
    }
    setConnecting(true);
    setErr('');
    try {
      await initiateGHealthSignIn(); // redirects to Google
    } catch (e) {
      if (e.message === 'NEEDS_SETUP') {
        navigate('/setup');
      } else {
        setErr(e.message);
        setConnecting(false);
      }
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg-gradient" />

      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,0.1), transparent)', top: '-5%', right: '-15%', pointerEvents: 'none', animation: 'pulse 6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,168,83,0.08), transparent)', bottom: '10%', left: '-10%', pointerEvents: 'none', animation: 'pulse 8s ease-in-out infinite 2s' }} />

      <div className="auth-content">
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 76, height: 76, borderRadius: 22,
            background: 'linear-gradient(135deg, rgba(66,133,244,0.2), rgba(52,168,83,0.15))',
            border: '1px solid rgba(66,133,244,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(66,133,244,0.12)',
          }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <path d="M28 15h28c10 0 18 7 18 16s-5 14-13 16c8 2 14 9 14 18s-8 17-18 17H28V15z" fill="white"/>
              <path d="M44 27h10c4 0 7 2.5 7 6s-3 6-7 6H44V27z" fill="#0a0a0f"/>
              <path d="M44 51h11c4.5 0 7.5 2.5 7.5 6s-3 6.5-7.5 6.5H44V51z" fill="#0a0a0f"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>Bevel</h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your personal health dashboard
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* PRIMARY: Connect Google Health */}
          <button
            id="btn-ghealth"
            onClick={handleConnect}
            disabled={connecting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              width: '100%', padding: '16px', borderRadius: 99, border: 'none',
              background: connecting ? 'rgba(66,133,244,0.5)' : 'linear-gradient(135deg, #4285F4, #34A853)',
              color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: connecting ? 'default' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.01em',
              boxShadow: '0 4px 20px rgba(66,133,244,0.3)',
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => !connecting && (e.currentTarget.style.transform = 'scale(1.01)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgba(255,255,255,0.8)"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgba(255,255,255,0.8)"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgba(255,255,255,0.8)"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgba(255,255,255,0.8)"/>
            </svg>
            {connecting ? 'Connecting…' : configured ? 'Connect Google Health' : 'Set Up Google Health'}
          </button>

          {configured && (
            <button
              id="btn-reconfigure"
              onClick={() => navigate('/setup')}
              style={{
                background: 'none', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', borderRadius: 99, padding: '10px',
                transition: 'color 0.2s',
              }}
            >
              ⚙️ Update credentials
            </button>
          )}

          {err && (
            <div style={{
              background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-heart)', marginBottom: 6 }}>
                ⚠️ Login failed
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                {err}
              </div>
              <button
                onClick={() => navigate('/setup')}
                style={{
                  padding: '8px 16px', borderRadius: 99, border: 'none',
                  background: 'rgba(255,71,87,0.15)', color: 'var(--accent-heart)',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Fix credentials →
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          {/* Demo */}
          <button
            id="btn-demo"
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%', padding: '14px', borderRadius: 99, border: 'none',
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Explore with demo data →
          </button>
        </div>

        <div style={{ fontSize: '0.71rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.7 }}>
          Read-only access · No data stored on any server<br />
          All credentials stay on your device only
        </div>
      </div>
    </div>
  );
}
