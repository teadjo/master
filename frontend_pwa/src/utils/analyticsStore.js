const STORAGE_KEY = 'pwa-analytics';

const defaultData = {
  cacheHits: 0,
  cacheMisses: 0,
  offlineRequests: 0,
  syncSuccess: 0,
  syncFailed: 0,
  pushNotifications: 0,
  installs: 0,
  loadTimes: []
};

export function getAnalytics() {
  const existing = localStorage.getItem(STORAGE_KEY);

  return existing
    ? JSON.parse(existing)
    : defaultData;
}

export function saveAnalytics(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

export function incrementMetric(metric) {
  const data = getAnalytics();

  data[metric]++;

  saveAnalytics(data);
}

export function addLoadTime(time) {
  const data = getAnalytics();

  data.loadTimes.push(time);

  saveAnalytics(data);
}

export function resetAnalytics() {
  localStorage.removeItem(STORAGE_KEY);
}