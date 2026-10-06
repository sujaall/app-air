/**
 * Google Health API Integration
 * Replaces the deprecated Fitbit Web API (shutting down Oct 30, 2026).
 *
 * Uses Google OAuth 2.0 Authorization Code flow with PKCE + offline access.
 * API Base: https://health.googleapis.com/v4/users/me/
 *
 * Setup:
 *  1. Enable "Google Health API" in Google Cloud Console
 *  2. Create OAuth 2.0 Web Client credentials
 *  3. Add redirect URI: http://localhost:5173
 *  4. Set VITE_GHEALTH_CLIENT_ID in .env
 *
 * Docs: https://developers.google.com/health
 */

const SETTINGS_KEY = 'bevel_ghealth_settings';

// IDs that look real but aren't — reject them
const PLACEHOLDER_IDS = ['your_client_id.apps.googleusercontent.com', 'YOUR_CLIENT_ID', ''];

/** Read user-saved settings from localStorage, fall back to env vars */
function getSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    const envId = import.meta.env.VITE_GHEALTH_CLIENT_ID || '';
    const clientId = saved?.clientId || (PLACEHOLDER_IDS.includes(envId) ? '' : envId);
    return {
      clientId,
      clientSecret: saved?.clientSecret || import.meta.env.VITE_GHEALTH_CLIENT_SECRET || '',
      redirectUri: saved?.redirectUri || import.meta.env.VITE_GHEALTH_REDIRECT_URI || window.location.origin,
    };
  } catch {
    return { clientId: '', clientSecret: '', redirectUri: window.location.origin };
  }
}

export function saveGHealthSettings(clientId, redirectUri, clientSecret = '') {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: redirectUri.trim() || window.location.origin,
  }));
}

export function getGHealthSettings() {
  return getSettings();
}

// Google Health API scopes
const GHEALTH_SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'openid',
  'profile',
  'email',
].join(' ');

const HEALTH_BASE = 'https://health.googleapis.com/v4/users/me';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const TOKEN_KEY = 'bevel_ghealth_token';
const USER_KEY = 'bevel_ghealth_user';

// ============================================================
// PKCE helpers
// ============================================================

async function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ============================================================
// Token storage
// ============================================================

export function isGHealthConfigured() {
  return !!getSettings().clientId;
}

export function getGHealthToken() {
  try {
    const data = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (!data) return null;
    // Access token still valid?
    if (Date.now() < data.expiresAt) return data;
    // Try refresh if we have a refresh token
    if (data.refreshToken) return data; // refreshToken path handled in AppContext
    localStorage.removeItem(TOKEN_KEY);
    return null;
  } catch {
    return null;
  }
}

export function storeGHealthToken(tokenResponse) {
  const data = {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || null,
    expiresAt: Date.now() + (tokenResponse.expires_in - 60) * 1000,
    tokenType: tokenResponse.token_type || 'Bearer',
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
  return data;
}

export function getGHealthUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export function storeGHealthUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function signOutGHealth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ============================================================
// OAuth 2.0 Auth Code + PKCE flow
// ============================================================

export async function initiateGHealthSignIn() {
  const { clientId, redirectUri } = getSettings();

  if (!clientId) {
    // Signal to the UI that setup is needed — don't alert, let the UI handle it
    throw new Error('NEEDS_SETUP');
  }

  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = Math.random().toString(36).substring(2);

  sessionStorage.setItem('ghealth_verifier', verifier);
  sessionStorage.setItem('ghealth_state', state);


  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GHEALTH_SCOPES,
    access_type: 'offline',   // request refresh token
    prompt: 'consent',        // force consent to always get refresh token
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Call on every page load — checks ?code= param for OAuth callback.
 */
export async function handleGHealthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  if (!code) return null;

  const storedState = sessionStorage.getItem('ghealth_state');
  if (storedState && state !== storedState) {
    console.warn('Google Health OAuth state mismatch');
    return null;
  }

  const verifier = sessionStorage.getItem('ghealth_verifier');
  if (!verifier) {
    console.warn('Missing PKCE verifier for Google Health');
    return null;
  }

  const { clientId, clientSecret, redirectUri } = getSettings();

  const bodyParams = {
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
  };
  // Include client_secret only if provided (required for Web app credentials)
  if (clientSecret) bodyParams.client_secret = clientSecret;

  const body = new URLSearchParams(bodyParams);

  try {
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const errData = await res.json();
      const msg = errData.error_description || errData.error || 'Token exchange failed';
      // Store error so the UI can show it
      localStorage.setItem('bevel_auth_error', msg);
      throw new Error(msg);
    }

    // Clear any previous error
    localStorage.removeItem('bevel_auth_error');

    const tokenData = await res.json();
    const stored = storeGHealthToken(tokenData);

    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('ghealth_verifier');
    sessionStorage.removeItem('ghealth_state');

    return stored;
  } catch (err) {
    console.error('Google Health token exchange error:', err.message);
    // Clean up URL even on failure
    window.history.replaceState({}, document.title, window.location.pathname);
    sessionStorage.removeItem('ghealth_verifier');
    sessionStorage.removeItem('ghealth_state');
    // Re-throw so AppContext can handle it
    throw err;
  }
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
export async function refreshGHealthToken(tokenData) {
  if (!tokenData?.refreshToken) return null;
  const { clientId, clientSecret } = getSettings();

  const bodyParams = {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: tokenData.refreshToken,
  };
  if (clientSecret) bodyParams.client_secret = clientSecret;

  const body = new URLSearchParams(bodyParams);

  try {
    const res = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.refresh_token) data.refresh_token = tokenData.refreshToken;
    return storeGHealthToken(data);
  } catch {
    return null;
  }
}

// ============================================================
// API helpers
// ============================================================

async function healthGet(path, token) {
  const res = await fetch(`${HEALTH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error('TOKEN_EXPIRED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Verify account is linked to Google Health (required before API calls) */
export async function verifyGHealthLinked(token) {
  const data = await healthGet('/identity', token);
  return !!data?.userId;
}

export async function fetchGHealthUserInfo(token) {
  const res = await fetch(USER_INFO_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function weekAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

function isoToMs(isoString) {
  return isoString ? new Date(isoString).getTime() : 0;
}

// ============================================================
// Google Health data fetchers
// Data types: https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints
// ============================================================

export async function fetchGHealthStepsToday(token) {
  const data = await healthGet(
    `/dataTypes/com.google.step_count.delta/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );
  return (data.dataPoints || []).reduce((sum, p) => sum + (p.value?.[0]?.integerValue || 0), 0);
}

export async function fetchGHealthCaloriesToday(token) {
  const data = await healthGet(
    `/dataTypes/com.google.calories.expended/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );
  const total = (data.dataPoints || []).reduce((sum, p) => sum + (p.value?.[0]?.fpValue || 0), 0);
  return Math.round(total);
}

export async function fetchGHealthHeartRateToday(token) {
  const data = await healthGet(
    `/dataTypes/com.google.heart_rate.bpm/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );

  const points = data.dataPoints || [];
  if (!points.length) return { data: [], avg: 0, min: 0, max: 0 };

  const bpms = points.map(p => p.value?.[0]?.fpValue || 0).filter(Boolean);
  const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
  const min = Math.round(Math.min(...bpms));
  const max = Math.round(Math.max(...bpms));

  // Bucket into hourly for chart
  const hourlyMap = {};
  points.forEach(p => {
    const hour = new Date(p.startTime).getHours();
    if (!hourlyMap[hour]) hourlyMap[hour] = [];
    hourlyMap[hour].push(p.value?.[0]?.fpValue || 0);
  });

  const hrData = Object.entries(hourlyMap).map(([hour, vals]) => ({
    hour: parseInt(hour),
    bpm: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  })).sort((a, b) => a.hour - b.hour);

  return { data: hrData, avg, min, max };
}

export async function fetchGHealthActiveMinsToday(token) {
  const data = await healthGet(
    `/dataTypes/com.google.active_minutes/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );
  return (data.dataPoints || []).reduce((sum, p) => sum + (p.value?.[0]?.integerValue || 0), 0);
}

export async function fetchGHealthDistanceToday(token) {
  const data = await healthGet(
    `/dataTypes/com.google.distance.delta/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );
  const total = (data.dataPoints || []).reduce((sum, p) => sum + (p.value?.[0]?.fpValue || 0), 0);
  return (total / 1000).toFixed(2); // convert meters to km
}

export async function fetchGHealthSleep(token) {
  const data = await healthGet(
    `/dataTypes/com.google.sleep.segment/dataPoints?startTime=${todayStr()}T00:00:00-12:00&endTime=${todayStr()}T23:59:59Z`,
    token
  );

  const points = data.dataPoints || [];
  // Sleep stages: 1=awake, 4=light, 5=deep, 6=REM
  let totalMs = 0, deepMs = 0, remMs = 0, lightMs = 0, awakeMs = 0;

  points.forEach(p => {
    const start = isoToMs(p.startTime);
    const end = isoToMs(p.endTime);
    const dur = end - start;
    const stage = p.value?.[0]?.integerValue;
    if (stage === 4) { lightMs += dur; totalMs += dur; }
    else if (stage === 5) { deepMs += dur; totalMs += dur; }
    else if (stage === 6) { remMs += dur; totalMs += dur; }
    else if (stage === 1) awakeMs += dur;
  });

  const toHrs = ms => parseFloat((ms / 3600000).toFixed(1));
  return {
    totalHours: toHrs(totalMs),
    deepHours: toHrs(deepMs),
    remHours: toHrs(remMs),
    lightHours: toHrs(lightMs),
    awakeHours: toHrs(awakeMs),
    stages: points,
  };
}

export async function fetchGHealthWeight(token) {
  const data = await healthGet(
    `/dataTypes/com.google.weight/dataPoints?startTime=${weekAgoStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );
  const points = data.dataPoints || [];
  if (!points.length) return null;
  const latest = points[points.length - 1];
  const w = latest.value?.[0]?.fpValue;
  return w ? parseFloat(w).toFixed(1) : null;
}

export async function fetchGHealthWeeklySteps(token) {
  const data = await healthGet(
    `/dataTypes/com.google.step_count.delta/dataPoints?startTime=${weekAgoStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
    token
  );

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyMap = {};

  (data.dataPoints || []).forEach(p => {
    const day = days[new Date(p.startTime).getDay()];
    dailyMap[day] = (dailyMap[day] || 0) + (p.value?.[0]?.integerValue || 0);
  });

  // Build ordered 7-day array
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = days[d.getDay()];
    return { day: dayName, steps: dailyMap[dayName] || 0 };
  });
}

export async function fetchGHealthHRV(token) {
  try {
    const data = await healthGet(
      `/dataTypes/com.google.heart_rate.variability.rmssd/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
      token
    );
    const points = data.dataPoints || [];
    if (!points.length) return null;
    const vals = points.map(p => p.value?.[0]?.fpValue || 0).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  } catch { return null; }
}

export async function fetchGHealthSpO2(token) {
  try {
    const data = await healthGet(
      `/dataTypes/com.google.oxygen_saturation/dataPoints?startTime=${todayStr()}T00:00:00Z&endTime=${todayStr()}T23:59:59Z`,
      token
    );
    const points = data.dataPoints || [];
    if (!points.length) return null;
    const vals = points.map(p => p.value?.[0]?.fpValue || 0).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  } catch { return null; }
}

/**
 * Fetch all Google Health data in parallel.
 * Returns the same shape as googleFit.js fetchAllTodayData for compatibility.
 */
export async function fetchAllGHealthData(token) {
  const [steps, calories, heartRate, activeMins, distance, sleep, weight, weeklySteps, hrv, spo2] =
    await Promise.allSettled([
      fetchGHealthStepsToday(token),
      fetchGHealthCaloriesToday(token),
      fetchGHealthHeartRateToday(token),
      fetchGHealthActiveMinsToday(token),
      fetchGHealthDistanceToday(token),
      fetchGHealthSleep(token),
      fetchGHealthWeight(token),
      fetchGHealthWeeklySteps(token),
      fetchGHealthHRV(token),
      fetchGHealthSpO2(token),
    ]);

  const get = (r, fb) => r.status === 'fulfilled' ? r.value : fb;

  return {
    steps: get(steps, 0),
    calories: get(calories, 0),
    heartRate: get(heartRate, { avg: 0, min: 0, max: 0, data: [] }),
    activeMins: get(activeMins, 0),
    distance: get(distance, '0.00'),
    sleep: get(sleep, { totalHours: 0, deepHours: 0, remHours: 0, lightHours: 0, stages: [] }),
    weight: get(weight, null),
    weeklySteps: get(weeklySteps, []),
    hrv: get(hrv, null),
    spo2: get(spo2, null),
  };
}
