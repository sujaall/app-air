/**
 * Google Fit API Integration
 * Handles OAuth2 flow and data fetching from Google Fit REST API
 */

// IMPORTANT: Replace with your own Google Cloud credentials
// See README for setup instructions
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.nutrition.read',
  'openid',
  'profile',
  'email',
].join(' ');

const TOKEN_KEY = 'bevel_gfit_token';
const USER_KEY = 'bevel_user';

// ============================================================
// Auth
// ============================================================

export function getStoredToken() {
  try {
    const data = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (!data) return null;
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function storeToken(tokenResponse) {
  const data = {
    accessToken: tokenResponse.access_token,
    expiresAt: Date.now() + (tokenResponse.expires_in - 60) * 1000,
    tokenType: tokenResponse.token_type,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data));
  return data;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isUsingMockData() {
  return GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID.apps.googleusercontent.com';
}

/**
 * Initiates Google OAuth2 flow using implicit grant (PKCE not required for browser apps)
 */
export function initiateGoogleSignIn() {
  const redirectUri = window.location.origin;
  const state = Math.random().toString(36).substring(2);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: GOOGLE_FIT_SCOPES,
    state,
    include_granted_scopes: 'true',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Handle OAuth2 redirect callback (parse hash fragment)
 */
export function handleOAuthCallback() {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  if (!params.get('access_token')) return null;

  const storedState = sessionStorage.getItem('oauth_state');
  if (storedState && params.get('state') !== storedState) {
    console.warn('OAuth state mismatch');
    return null;
  }

  const tokenData = storeToken({
    access_token: params.get('access_token'),
    expires_in: parseInt(params.get('expires_in') || '3600'),
    token_type: params.get('token_type') || 'Bearer',
  });

  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);

  return tokenData;
}

// ============================================================
// Google Fit API Calls
// ============================================================

const FIT_BASE = 'https://www.googleapis.com/fitness/v1';
const PEOPLE_API = 'https://www.googleapis.com/oauth2/v2/userinfo';

async function fitRequest(endpoint, token, options = {}) {
  const res = await fetch(`${FIT_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchUserInfo(token) {
  const res = await fetch(PEOPLE_API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return res.json();
}

/**
 * Get nanosecond timestamp for start of day
 */
function dayStartNs(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() * 1_000_000;
}

function dayEndNs(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime() * 1_000_000;
}

function msToNs(ms) { return ms * 1_000_000; }
function nsToMs(ns) { return ns / 1_000_000; }

/**
 * Fetch steps for today
 */
export async function fetchStepsToday(token) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: new Date().setHours(0, 0, 0, 0),
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  let steps = 0;
  data.bucket?.[0]?.dataset?.[0]?.point?.forEach(p => {
    steps += p.value?.[0]?.intVal || 0;
  });
  return steps;
}

/**
 * Fetch calories for today
 */
export async function fetchCaloriesToday(token) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: new Date().setHours(0, 0, 0, 0),
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  let cals = 0;
  data.bucket?.[0]?.dataset?.[0]?.point?.forEach(p => {
    cals += p.value?.[0]?.fpVal || 0;
  });
  return Math.round(cals);
}

/**
 * Fetch heart rate data for today
 */
export async function fetchHeartRateToday(token) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.heart_rate.bpm' }],
    bucketByTime: { durationMillis: 3600000 }, // hourly
    startTimeMillis: new Date().setHours(0, 0, 0, 0),
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const hrData = [];
  let min = Infinity, max = 0, sum = 0, count = 0;

  data.bucket?.forEach((bucket, i) => {
    const point = bucket.dataset?.[0]?.point?.[0];
    if (point) {
      const avg = point.value?.[0]?.fpVal || 0;
      hrData.push({ hour: i, bpm: Math.round(avg) });
      if (avg < min) min = avg;
      if (avg > max) max = avg;
      sum += avg;
      count++;
    }
  });

  return {
    data: hrData,
    avg: count ? Math.round(sum / count) : 0,
    min: min === Infinity ? 0 : Math.round(min),
    max: Math.round(max),
  };
}

/**
 * Fetch active minutes / move minutes
 */
export async function fetchActiveMinsToday(token) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.active_minutes' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: new Date().setHours(0, 0, 0, 0),
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  let mins = 0;
  data.bucket?.[0]?.dataset?.[0]?.point?.forEach(p => {
    mins += p.value?.[0]?.intVal || 0;
  });
  return mins;
}

/**
 * Fetch distance today (meters)
 */
export async function fetchDistanceToday(token) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.distance.delta' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: new Date().setHours(0, 0, 0, 0),
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  let dist = 0;
  data.bucket?.[0]?.dataset?.[0]?.point?.forEach(p => {
    dist += p.value?.[0]?.fpVal || 0;
  });
  return (dist / 1000).toFixed(2); // km
}

/**
 * Fetch sleep data for last night
 */
export async function fetchSleepLastNight(token) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(18, 0, 0, 0); // 6pm yesterday

  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
    bucketByTime: { durationMillis: 86400000 * 2 },
    startTimeMillis: yesterday.getTime(),
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const stages = [];
  let totalMs = 0;
  let deepMs = 0, remMs = 0, lightMs = 0, awakeMs = 0;

  data.bucket?.forEach(bucket => {
    bucket.dataset?.[0]?.point?.forEach(p => {
      const start = nsToMs(parseInt(p.startTimeNanos));
      const end = nsToMs(parseInt(p.endTimeNanos));
      const dur = end - start;
      const stage = p.value?.[0]?.intVal;
      // Google Fit sleep stages: 1=awake, 2=sleep, 3=out-of-bed, 4=light, 5=deep, 6=REM
      stages.push({ start, end, stage, dur });
      if (stage === 4) lightMs += dur;
      else if (stage === 5) deepMs += dur;
      else if (stage === 6) remMs += dur;
      else if (stage === 1) awakeMs += dur;
      if (stage !== 3 && stage !== 1) totalMs += dur;
    });
  });

  const toHrs = ms => (ms / 3600000).toFixed(1);

  return {
    stages,
    totalHours: parseFloat(toHrs(totalMs)),
    deepHours: parseFloat(toHrs(deepMs)),
    remHours: parseFloat(toHrs(remMs)),
    lightHours: parseFloat(toHrs(lightMs)),
    awakeHours: parseFloat(toHrs(awakeMs)),
  };
}

/**
 * Fetch weight
 */
export async function fetchWeight(token) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.weight' }],
    bucketByTime: { durationMillis: 86400000 * 30 },
    startTimeMillis: Date.now() - 86400000 * 30,
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  let weight = null;
  data.bucket?.forEach(b => {
    b.dataset?.[0]?.point?.forEach(p => {
      const w = p.value?.[0]?.fpVal;
      if (w) weight = w;
    });
  });
  return weight ? weight.toFixed(1) : null;
}

/**
 * Fetch weekly steps history
 */
export async function fetchWeeklySteps(token) {
  const weekAgo = Date.now() - 7 * 86400000;
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: weekAgo,
    endTimeMillis: Date.now(),
  };

  const data = await fitRequest('/users/me/dataset:aggregate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data.bucket?.map((bucket, i) => {
    const date = new Date(parseInt(bucket.startTimeMillis));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let steps = 0;
    bucket.dataset?.[0]?.point?.forEach(p => { steps += p.value?.[0]?.intVal || 0; });
    return { day: days[date.getDay()], steps };
  }) || [];
}

/**
 * Fetch all today's data in parallel
 */
export async function fetchAllTodayData(token) {
  const [steps, calories, heartRate, activeMins, distance, sleep, weight, weeklySteps] = await Promise.allSettled([
    fetchStepsToday(token),
    fetchCaloriesToday(token),
    fetchHeartRateToday(token),
    fetchActiveMinsToday(token),
    fetchDistanceToday(token),
    fetchSleepLastNight(token),
    fetchWeight(token),
    fetchWeeklySteps(token),
  ]);

  const getValue = (result, fallback) =>
    result.status === 'fulfilled' ? result.value : fallback;

  return {
    steps: getValue(steps, 0),
    calories: getValue(calories, 0),
    heartRate: getValue(heartRate, { avg: 0, min: 0, max: 0, data: [] }),
    activeMins: getValue(activeMins, 0),
    distance: getValue(distance, '0.00'),
    sleep: getValue(sleep, { totalHours: 0, deepHours: 0, remHours: 0, lightHours: 0, stages: [] }),
    weight: getValue(weight, null),
    weeklySteps: getValue(weeklySteps, []),
  };
}

// ============================================================
// Mock Data (when no Google Fit credentials)
// ============================================================

export function getMockData() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  return {
    steps: 8432,
    calories: 1847,
    heartRate: {
      avg: 68,
      min: 52,
      max: 142,
      data: Array.from({ length: 16 }, (_, i) => ({
        hour: i + 6,
        bpm: Math.round(55 + Math.random() * 40 + (i === 6 ? 30 : 0)),
      })),
    },
    activeMins: 47,
    distance: '6.23',
    sleep: {
      totalHours: 7.4,
      deepHours: 1.8,
      remHours: 1.6,
      lightHours: 3.6,
      awakeHours: 0.4,
      stages: [
        { stage: 2, dur: 1200000 },
        { stage: 4, dur: 3600000 },
        { stage: 5, dur: 6480000 },
        { stage: 6, dur: 5760000 },
        { stage: 4, dur: 4320000 },
        { stage: 1, dur: 1440000 },
      ],
    },
    weight: '72.4',
    weeklySteps: days.map((day, i) => ({
      day,
      steps: i === today ? 8432 : Math.round(5000 + Math.random() * 7000),
    })),
    recovery: 78,
    strain: 12.4,
    hrv: 48,
    rhr: 52,
    spo2: 98,
    bodyBattery: 71,
  };
}
