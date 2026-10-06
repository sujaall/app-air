import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredToken, getStoredUser, storeUser, signOut,
  handleOAuthCallback, fetchUserInfo, fetchAllTodayData,
  getMockData, isUsingMockData,
} from '../services/googleFit';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // Handle OAuth callback on mount
  useEffect(() => {
    const oauthData = handleOAuthCallback();
    if (oauthData) {
      setToken(oauthData);
    } else {
      const stored = getStoredToken();
      if (stored) setToken(stored);
    }

    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);

    setLoading(false);
  }, []);

  // Fetch user info when token changes
  useEffect(() => {
    if (token && !user) {
      fetchUserInfo(token.accessToken)
        .then(u => {
          setUser(u);
          storeUser(u);
        })
        .catch(console.error);
    }
  }, [token, user]);

  // Fetch health data
  const refreshData = useCallback(async () => {
    if (isUsingMockData()) {
      setUsingMock(true);
      setHealthData(getMockData());
      return;
    }

    if (!token) return;

    setDataLoading(true);
    setError(null);
    try {
      const data = await fetchAllTodayData(token.accessToken);
      setHealthData(data);
    } catch (err) {
      setError(err.message);
      // Fall back to mock data
      setUsingMock(true);
      setHealthData(getMockData());
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token || isUsingMockData()) {
      refreshData();
    } else if (!loading) {
      // No token and not using mock — show demo data anyway
      setUsingMock(true);
      setHealthData(getMockData());
    }
  }, [token, loading, refreshData]);

  const handleSignOut = () => {
    signOut();
    setToken(null);
    setUser(null);
    setHealthData(getMockData());
    setUsingMock(true);
  };

  const value = {
    token, setToken,
    user, setUser,
    healthData, setHealthData,
    loading, dataLoading,
    error, usingMock,
    refreshData,
    signOut: handleSignOut,
    isAuthenticated: !!token && !isUsingMockData(),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
