import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';

export default function Dashboard({ onNavigate, onSelectTicket }) {
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, ticketsData] = await Promise.all([
        api.getDashboardStats(),
        api.getTickets({ sort_by: 'created_at_desc' })
      ]);
      setStats(statsData);
      setRecentTickets(ticketsData.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <span>Failed to connect to backend: {error}</span>
        <button className="btn btn-sm btn-secondary" onClick={loadDashboardData} style={{ marginLeft: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Desk Dashboard</h1>
          <p className="page-desc">Real-time overview of technical support tickets, SLA performance, and resolution health.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('create-ticket')}>
          + Create Ticket
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Tickets</span>
          <span className="stat-value">{stats?.total_tickets || 0}</span>
          <span className="stat-sub">All-time volume</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Open Tickets</span>
          <span className="stat-value" style={{ color: 'var(--primary)' }}>
            {stats?.open_tickets || 0}
          </span>
          <span className="stat-sub">Awaiting action</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-label">In Progress</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>
            {stats?.in_progress_tickets || 0}
          </span>
          <span className="stat-sub">Active troubleshooting</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Resolved</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>
            {stats?.resolved_tickets || 0}
          </span>
          <span className="stat-sub">Successfully closed</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--purple)' }}>
          <span className="stat-label">L2 Escalated</span>
          <span className="stat-value" style={{ color: 'var(--purple)' }}>
            {stats?.l2_escalated_tickets || 0}
          </span>
          <span className="stat-sub">Assigned to Tier-2</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span className="stat-label">SLA Breached</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>
            {stats?.sla_breached_tickets || 0}
          </span>
          <span className="stat-sub">Exceeded time limit</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <span className="stat-label">Critical Tickets</span>
          <span className="stat-value" style={{ color: '#dc2626' }}>
            {stats?.critical_tickets || 0}
          </span>
          <span className="stat-sub">P1 high severity</span>
        </div>
      </div>

      {/* Operational KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card">
          <span className="stat-label">Most Common Issue Category</span>
          <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px', color: 'var(--text-primary)' }}>
            🏷️ {stats?.most_common_category || 'N/A'}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Primary driver of inbound support volume
          </p>
        </div>

        <div className="card">
          <span className="stat-label">Average Resolution Time</span>
          <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px', color: 'var(--text-primary)' }}>
            ⏱️ {stats?.avg_resolution_time_hours || 0} hours
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across all closed incidents
          </p>
        </div>

        <div className="card">
          <span className="stat-label">First-Contact Resolution (FCR)</span>
          <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px', color: 'var(--text-primary)' }}>
            🎯 {stats?.fcr_rate_percentage || 0}%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Resolved without escalation in 1 step
          </p>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Tickets</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tickets')}>
            View All Tickets &rarr;
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No tickets found. Click "Create Ticket" to get started.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Status</th>
                  <th>User / Dept</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => onSelectTicket(t.id)}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                      {t.ticket_code}
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: '280px' }}>
                      {t.title}
                    </td>
                    <td>{t.category}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SlaBadge slaStatus={t.sla_status} slaDeadline={t.sla_deadline} ticketStatus={t.status} /></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.user_department || '—'}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                      >
                        Open
                      </button>
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
