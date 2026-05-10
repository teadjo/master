import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import './MetricsDashboard.css';

function MetricsDashboard() {
  const [metrics, setMetrics] = useState([]);

  const [cacheHits, setCacheHits] = useState(0);
  const [offlineRequests, setOfflineRequests] = useState(0);
  const [syncSuccess, setSyncSuccess] = useState(0);

  useEffect(() => {
    loadMetrics();

    const interval = setInterval(loadMetrics, 3000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      clearInterval(interval);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const handleSWMessage = (event) => {
    if (!event.data) return;

    if (event.data.type === 'CACHE_HIT') {
      const newHits = cacheHits + 1;
      setCacheHits(newHits);
      localStorage.setItem('cache-hits', String(newHits));
    }

    if (event.data.type === 'SYNC_SUCCESS') {
      const newSync = syncSuccess + 1;
      setSyncSuccess(newSync);
      localStorage.setItem('sync-success', String(newSync));
    }
  };

  const loadMetrics = () => {
    const history = JSON.parse(
      localStorage.getItem('pwa-metrics-history') || '[]'
    );

    const formatted = history.slice(-10).map((item, index) => ({
      name: `M${index + 1}`,
      load: Number(item?.loadTime?.loadComplete || 0).toFixed(0),
      fcp: Number(item?.loadTime?.firstContentfulPaint || 0).toFixed(0)
    }));

    setMetrics(formatted);

    setCacheHits(Number(localStorage.getItem('cache-hits') || 0));

    setOfflineRequests(
      Number(localStorage.getItem('offline-requests') || 0)
    );

    setSyncSuccess(
      Number(localStorage.getItem('sync-success') || 0)
    );
  };

    const exportMetrics = () => {
  const data = localStorage.getItem('pwa-metrics-history');

  const blob = new Blob([data], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;
  a.download = `metrics-${Date.now()}.json`;

  a.click();

  URL.revokeObjectURL(url);
};

   const pieData = [
    {
      name: 'Cache Hits',
      value: cacheHits
    },
    {
      name: 'Offline Requests',
      value: offlineRequests
    }
  ];

  const syncData = [
    {
      name: 'Sync Success',
      value: syncSuccess
    },
    {
      name: 'Offline Requests',
      value: offlineRequests
    }
  ];

   return (
    <div className="metrics-dashboard">
      <h2>PWA Analytics Dashboard</h2>

        <button
        className="export-btn"
        onClick={exportMetrics}
        >
        ⬇️ Export Metrics
        </button>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>📈 Performance Metrics</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="load"
                stroke="#8884d8"
              />

              <Line
                type="monotone"
                dataKey="fcp"
                stroke="#82ca9d"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <h3>📦 Cache Efficiency</h3>

        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={index === 0 ? '#8884d8' : '#82ca9d'}
                  />
                ))}
              </Pie>

         <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="metric-card">
          <h3>🔄 Background Sync</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={syncData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <h4>Cache Hits</h4>
          <p>{cacheHits}</p>
        </div>

        <div className="stat-box">
          <h4>Offline Requests</h4>
          <p>{offlineRequests}</p>
        </div>

        <div className="stat-box">
          <h4>Sync Success</h4>
          <p>{syncSuccess}</p>
        </div>
      </div>
    </div>
  );
}

export default MetricsDashboard;
