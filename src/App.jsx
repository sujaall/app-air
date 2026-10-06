import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { BottomNav } from './components/BottomNav';
import TodayPage from './pages/TodayPage';
import StrainPage from './pages/StrainPage';
import RecoveryPage from './pages/RecoveryPage';
import SleepPage from './pages/SleepPage';
import LogPage from './pages/LogPage';
import AuthScreen from './pages/AuthScreen';
import SetupPage from './pages/SetupPage';

function AppRoutes() {
  const { loading } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12, animation: 'pulse 2s ease infinite' }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <path d="M28 15h28c10 0 18 7 18 16s-5 14-13 16c8 2 14 9 14 18s-8 17-18 17H28V15z" fill="white"/>
              <path d="M44 27h10c4 0 7 2.5 7 6s-3 6-7 6H44V27z" fill="#0a0a0f"/>
              <path d="M44 51h11c4.5 0 7.5 2.5 7.5 6s-3 6.5-7.5 6.5H44V51z" fill="#0a0a0f"/>
            </svg>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Loading Bevel...</div>
        </div>
      </div>
    );
  }

  const hideNav = location.pathname === '/auth' || location.pathname === '/setup';

  return (
    <div className="app-layout">
      <div className="page-content">
        <Routes location={location}>
          <Route path="/auth" element={<AuthScreen />} />
          <Route path="/setup" element={<SetupPage onDone={() => window.location.href = '/auth'} />} />
          <Route path="/" element={<TodayPage />} />
          <Route path="/strain" element={<StrainPage />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return <AppRoutes />;
}
