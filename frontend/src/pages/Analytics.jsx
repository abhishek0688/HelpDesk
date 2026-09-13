import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTroubleshootingAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Error fetching analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
        Calculating troubleshooting success metrics from database...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <span>{error}</span>
        <button className="btn btn-secondary btn-sm" onClick={loadAnalytics} style={{ marginLeft: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Troubleshooting Success Analytics</h1>
          <p className="page-desc">
            Empirical effectiveness metrics computed directly from recorded troubleshooting actions in PostgreSQL.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadAnalytics}>
          🔄 Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Diagnostic Events</span>
          <span className="stat-value">{analytics?.total_troubleshooting_events || 0}</span>
          <span className="stat-sub">Actions logged by engineers</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Overall Success Rate</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {analytics?.overall_success_rate || 0}%
          </span>
          <span className="stat-sub">Percentage of actions resolving issue</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <span className="stat-label">Most Used Step</span>
          <span className="stat-value" style={{ fontSize: '18px', color: 'var(--purple)', marginTop: '8px' }}>
            {analytics?.most_used_step || 'N/A'}
          </span>
          <span className="stat-sub">Highest frequency action</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <span className="stat-label">Most Effective Step</span>
          <span className="stat-value" style={{ fontSize: '18px', color: '#0284c7', marginTop: '8px' }}>
            {analytics?.most_successful_step || 'N/A'}
          </span>
          <span className="stat-sub">Highest resolution success rate</span>
        </div>
      </div>

      {/* Detailed Step Performance Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Action Effectiveness Breakdown</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {analytics?.steps?.length || 0} unique actions tracked
          </span>
        </div>

        {(!analytics?.steps || analytics.steps.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
            No troubleshooting events have been logged yet.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Troubleshooting Action</th>
                  <th>Times Used</th>
                  <th>Successful</th>
                  <th>Unsuccessful</th>
                  <th>Inconclusive</th>
                  <th style={{ minWidth: '180px' }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.steps.map((st, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{st.step_name}</td>
                    <td>{st.times_used}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{st.successful_count}</td>
                    <td style={{ color: 'var(--danger)' }}>{st.unsuccessful_count}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{st.inconclusive_count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="progress-bar-bg" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${st.success_rate}%`,
                              backgroundColor:
                                st.success_rate >= 70
                                  ? 'var(--success)'
                                  : st.success_rate >= 40
                                  ? 'var(--warning)'
                                  : 'var(--danger)'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '40px' }}>
                          {st.success_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
