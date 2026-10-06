import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMockData } from '../services/googleFit';

// Lazy-load API services so they never block the initial render
let googleFitService = null;
let gHealthService = null;

async function getGoogleFit() {
  if (!googleFitService) googleFitService = await import('../services/googleFit');
  return googleFitService;
}

async function getGHealth() {
  if (!gHealthService) gHealthService = await import('../services/fitbit');
  return gHealthService;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [ghealthToken, setGHealthToken] = useState(null);
  const [user, setUser] = useState(null);
  // Start with demo data immediately — no loading spinner needed
  const [healthData, setHealthData] = useState(() => getMockData());
  const [loading, setLoading] = useState(false); // no longer blocks UI
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(true);
  const [dataSource, setDataSource] = useState('mock');
  const [initialized, setInitialized] = useState(false);

  // ── Bootstrap: check for stored/callback tokens ─────────────
  useEffect(() => {
    let cancelled = false;

    const TIMEOUT_MS = 4000; // never hang more than 4s

    const init = async () => {
      try {
        // Race against a timeout so a slow network never freezes the app
        const ghModule = await Promise.race([
          getGHealth(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)),
        ]);

        if (cancelled) return;

        // Check for Google Health OAuth callback (?code=...)
        let ghToken = null;
        try {
          ghToken = await Promise.race([
            ghModule.handleGHealthCallback(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Token exchange timed out')), TIMEOUT_MS)),
          ]);
        } catch (callbackErr) {
          // Surface the error visibly — don't silently fall back
          console.error('Auth callback failed:', callbackErr.message);
          // Store it so the auth screen can show it
          if (!localStorage.getItem('bevel_auth_error')) {
            localStorage.setItem('bevel_auth_error', callbackErr.message);
          }
        }

        if (cancelled) return;

        if (ghToken) {
          setGHealthToken(ghToken);
          setDataSource('ghealth');
          setInitialized(true);
          return;
        }

        // Restore stored Google Health token
        const storedGH = ghModule.getGHealthToken();
        if (storedGH) {
          // Try to refresh if expired — but don't block startup
          if (Date.now() >= storedGH.expiresAt) {
            ghModule.refreshGHealthToken(storedGH)
              .then(refreshed => { if (refreshed && !cancelled) setGHealthToken(refreshed); })
              .catch(() => {});
          } else {
            setGHealthToken(storedGH);
            setDataSource('ghealth');
          }
        }

        // Check legacy Google Fit
        const gfModule = await getGoogleFit();
        if (cancelled) return;

        const gfCallback = gfModule.handleOAuthCallback();
        if (gfCallback) {
          setToken(gfCallback);
          setDataSource('google');
        } else {
          const storedGF = gfModule.getStoredToken();
          if (storedGF) {
            setToken(storedGF);
            setDataSource('google');
          }
        }

        // Restore saved user
        const savedUser = ghModule.getGHealthUser() || gfModule.getStoredUser();
        if (savedUser && !cancelled) setUser(savedUser);

      } catch (e) {
        // Any error during init (network, timeout, etc.) → silently use demo data
        console.warn('Bevel: init error, using demo data', e.message);
      } finally {
        if (!cancelled) setInitialized(true);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch health data when tokens are available ──────────────
  const refreshData = useCallback(async () => {
    // Google Health API
    if (ghealthToken) {
      setDataLoading(true);
      setError(null);
      try {
        const ghModule = await getGHealth();
        let activeToken = ghealthToken;
        if (Date.now() >= ghealthToken.expiresAt) {
          const refreshed = await ghModule.refreshGHealthToken(ghealthToken);
          if (refreshed) { setGHealthToken(refreshed); activeToken = refreshed; }
          else throw new Error('Session expired — please reconnect.');
        }
        const data = await ghModule.fetchAllGHealthData(activeToken.accessToken);
        setHealthData(data);
        setUsingMock(false);
        setDataSource('ghealth');
      } catch (err) {
        setError(err.message);
        setUsingMock(true);
        setHealthData(getMockData());
        setDataSource('mock');
      } finally {
        setDataLoading(false);
      }
      return;
    }

    // Legacy Google Fit
    if (token) {
      setDataLoading(true);
      setError(null);
      try {
        const gfModule = await getGoogleFit();
        if (gfModule.isUsingMockData()) throw new Error('No Google Fit credentials');
        const data = await gfModule.fetchAllTodayData(token.accessToken);
        setHealthData(data);
        setUsingMock(false);
        setDataSource('google');
      } catch (err) {
        setError(err.message);
        setUsingMock(true);
        setHealthData(getMockData());
        setDataSource('mock');
      } finally {
        setDataLoading(false);
      }
      return;
    }

    // No credentials — demo data (already set as default)
    setUsingMock(true);
    setHealthData(getMockData());
    setDataSource('mock');
  }, [ghealthToken, token]);

  useEffect(() => {
    if (initialized && (ghealthToken || token)) {
      refreshData();
    }
  }, [ghealthToken, token, initialized, refreshData]);

  // ── Fetch user info ──────────────────────────────────────────
  useEffect(() => {
    if (ghealthToken && !user) {
      getGHealth()
        .then(m => m.fetchGHealthUserInfo(ghealthToken.accessToken))
        .then(u => { setUser(u); getGHealth().then(m => m.storeGHealthUser(u)); })
        .catch(() => {});
    }
  }, [ghealthToken, user]);

  useEffect(() => {
    if (token && !user) {
      getGoogleFit()
        .then(m => m.fetchUserInfo(token.accessToken))
        .then(u => { setUser(u); getGoogleFit().then(m => m.storeUser(u)); })
        .catch(() => {});
    }
  }, [token, user]);

  // ── Sign out ─────────────────────────────────────────────────
  const handleSignOut = async () => {
    const [gf, gh] = await Promise.all([getGoogleFit(), getGHealth()]);
    gf.signOut();
    gh.signOutGHealth();
    setToken(null);
    setGHealthToken(null);
    setUser(null);
    setHealthData(getMockData());
    setUsingMock(true);
    setDataSource('mock');
  };

  const value = {
    token, setToken,
    ghealthToken, setGHealthToken,
    user, setUser,
    healthData, setHealthData,
    loading,        // always false now
    dataLoading,
    error, usingMock, dataSource,
    refreshData,
    signOut: handleSignOut,
    isAuthenticated: !!ghealthToken || !!token,
    isGHealthConnected: !!ghealthToken,
    isGoogleFitConnected: !!token,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
