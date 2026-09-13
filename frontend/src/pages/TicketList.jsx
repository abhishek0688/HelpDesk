import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import Modal from '../components/Modal';

export default function TicketList({ onSelectTicket, onNavigate, initialSearch = '' }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [slaFilter, setSlaFilter] = useState('');
  const [l2Filter, setL2Filter] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');

  // Delete modal state
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [search, statusFilter, priorityFilter, categoryFilter, slaFilter, l2Filter, sortBy]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        search,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        sla_status: slaFilter,
        is_escalated: l2Filter === '' ? undefined : l2Filter === 'true',
        sort_by: sortBy
      };
      const data = await api.getTickets(filters);
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeleting(true);
      await api.deleteTicket(ticketToDelete.id);
      setTicketToDelete(null);
      fetchTickets();
    } catch (err) {
      alert(`Could not delete ticket: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setSlaFilter('');
    setL2Filter('');
    setSortBy('created_at_desc');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tickets</h1>
          <p className="page-desc">Comprehensive log of all technical incidents and service requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('create-ticket')}>
          + New Ticket
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '180px' }}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated L2">Escalated L2</option>
            <option value="Closed">Closed</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Operating System">Operating System</option>
            <option value="Access">Access</option>
            <option value="Security">Security</option>
            <option value="Other">Other</option>
          </select>

          <select value={slaFilter} onChange={(e) => setSlaFilter(e.target.value)}>
            <option value="">All SLA States</option>
            <option value="Within SLA">Within SLA</option>
            <option value="Near Breach">Near Breach</option>
            <option value="Breached">Breached</option>
            <option value="Completed">Completed</option>
          </select>

          <select value={l2Filter} onChange={(e) => setL2Filter(e.target.value)}>
            <option value="">L2 Escalation</option>
            <option value="true">Escalated to L2</option>
            <option value="false">Not Escalated</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="deadline">SLA Deadline</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading tickets...
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>No tickets found matching your criteria.</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Try adjusting filters or create a new ticket.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>L2</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectTicket(t.id)}
                    >
                      {t.ticket_code}
                    </td>
                    <td
                      style={{
                        fontWeight: 500,
                        maxWidth: '260px',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectTicket(t.id)}
                    >
                      {t.title}
                    </td>
                    <td>{t.category}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      <SlaBadge
                        slaStatus={t.sla_status}
                        slaDeadline={t.sla_deadline}
                        ticketStatus={t.status}
                      />
                    </td>
                    <td>
                      {t.is_escalated ? (
                        <span className="badge badge-escalated-l2">L2 Assigned</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectTicket(t.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setTicketToDelete(t)}
                          style={{ padding: '4px 8px' }}
                          title="Delete Ticket"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        title="Confirm Ticket Deletion"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setTicketToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteTicket}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete ticket{' '}
          <strong>{ticketToDelete?.ticket_code} ({ticketToDelete?.title})</strong>?
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          This will permanently delete the ticket, its troubleshooting steps, RCA, and timeline history.
        </p>
      </Modal>
    </div>
  );
}
