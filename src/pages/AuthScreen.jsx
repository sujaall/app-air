import { initiateGoogleSignIn, isUsingMockData } from '../services/googleFit';
import { useApp } from '../context/AppContext';

export default function AuthScreen() {
  const { setToken, setHealthData } = useApp();

  const handleGoogleSignIn = () => {
    if (isUsingMockData()) {
      alert('⚙️ Google Fit not configured yet.\n\nTo connect real Google Fit data:\n1. Create a Google Cloud project\n2. Enable the Fitness API\n3. Add your OAuth Client ID to the .env file\n\nSee README.md for full setup instructions.\n\nFor now, you can explore with demo data!');
      return;
    }
    initiateGoogleSignIn();
  };

  const handleDemo = () => {
    // Just use mock data
    window.location.href = '/';
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg-gradient" />
      
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,245,0.12), transparent)',
        top: '10%', left: '-15%', pointerEvents: 'none',
        animation: 'pulse 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(78,205,196,0.08), transparent)',
        bottom: '20%', right: '-10%', pointerEvents: 'none',
        animation: 'pulse 6s ease-in-out infinite 2s',
      }} />

      <div className="auth-content">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(124,106,245,0.3), rgba(78,205,196,0.2))',
            border: '1px solid rgba(124,106,245,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '2rem',
          }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <path d="M28 15h28c10 0 18 7 18 16s-5 14-13 16c8 2 14 9 14 18s-8 17-18 17H28V15z" fill="white"/>
              <path d="M44 27h10c4 0 7 2.5 7 6s-3 6-7 6H44V27z" fill="#0a0a0f"/>
              <path d="M44 51h11c4.5 0 7.5 2.5 7.5 6s-3 6.5-7.5 6.5H44V51z" fill="#0a0a0f"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Bevel</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your connected health coach.<br />
            Powered by Google Fit.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {['Strain', 'Recovery', 'Sleep', 'HRV', 'Steps', 'Calories'].map(f => (
            <span key={f} style={{
              padding: '6px 14px', borderRadius: 99,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.8rem', fontWeight: 500,
            }}>{f}</span>
          ))}
        </div>

        {/* CTA */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            id="btn-google-signin"
            className="btn btn-primary btn-full"
            onClick={handleGoogleSignIn}
            style={{ fontSize: '1rem', padding: '16px', gap: 12 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Google Fit
          </button>

          <button
            id="btn-demo"
            className="btn btn-secondary btn-full"
            onClick={handleDemo}
            style={{ fontSize: '0.9rem' }}
          >
            Explore with demo data →
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
          Your data never leaves your device.<br />
          We only read from Google Fit, never write.
        </div>
      </div>
    </div>
  );
}
