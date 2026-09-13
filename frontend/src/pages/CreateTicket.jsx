import React, { useState } from 'react';
import { api } from '../services/api';
import Alert from '../components/Alert';

export default function CreateTicket({ onNavigate, onSelectTicket }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'Software',
    affected_device: '',
    operating_system: '',
    app_version: '',
    error_message: '',
    user_department: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Duplicate ticket detection state
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Trigger duplicate check when title or description has enough content
  const handleCheckDuplicates = async () => {
    if (!formData.title.trim() && !formData.description.trim()) return;

    try {
      setCheckingDuplicates(true);
      const res = await api.checkDuplicateTickets({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        affected_device: formData.affected_device
      });
      if (res.has_duplicates) {
        setDuplicateMatches(res.matches);
      } else {
        setDuplicateMatches([]);
      }
    } catch (err) {
      console.warn('Duplicate check failed:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Ticket Title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Problem Description is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newTicket = await api.createTicket(formData);
      setSuccess(`Ticket ${newTicket.ticket_code} created successfully!`);
      setTimeout(() => {
        onSelectTicket(newTicket.id);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Support Ticket</h1>
          <p className="page-desc">Log a new technical incident or service request into the ITIL queue.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('tickets')}>
          Cancel
        </button>
      </div>

      {error && <Alert type="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} />}

      {/* Duplicate Ticket Detection Alert */}
      {duplicateMatches.length > 0 && (
        <div className="alert alert-warning" style={{ display: 'block', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '8px' }}>
            <span>⚠️</span>
            <span>Similar Tickets Detected ({duplicateMatches.length})</span>
          </div>
          <p style={{ fontSize: '12px', marginBottom: '12px' }}>
            A similar issue has been recorded before. You can review existing resolutions to resolve this immediately, or proceed with creating a new ticket.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {duplicateMatches.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {m.ticket_code}
                  </strong>{' '}
                  — {m.title}{' '}
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>({m.status})</span>
                  {m.final_solution && (
                    <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>
                      💡 Past Solution: {m.final_solution}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectTicket(m.id)}
                >
                  View Ticket
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Ticket Title */}
          <div className="form-group">
            <label className="form-label">
              Ticket Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g. Cisco AnyConnect VPN fails with error 442"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleCheckDuplicates}
              required
            />
          </div>

          {/* Priority & Category */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Priority <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low (24h SLA)</option>
                <option value="Medium">Medium (8h SLA)</option>
                <option value="High">High (4h SLA)</option>
                <option value="Critical">Critical (2h SLA)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Category <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleCheckDuplicates}
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Operating System">Operating System</option>
                <option value="Access">Access & Identity</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Problem Description */}
          <div className="form-group">
            <label className="form-label">
              Problem Description <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              name="description"
              className="form-textarea"
              rows={4}
              placeholder="Detailed description of the issue, steps to reproduce, and impact..."
              value={formData.description}
              onChange={handleChange}
              onBlur={handleCheckDuplicates}
              required
            />
          </div>

          {/* Environment Information */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Affected Device / Host / Application</label>
              <input
                type="text"
                name="affected_device"
                className="form-input"
                placeholder="e.g. Dell XPS 15 (Asset #DL-109)"
                value={formData.affected_device}
                onChange={handleChange}
                onBlur={handleCheckDuplicates}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operating System</label>
              <input
                type="text"
                name="operating_system"
                className="form-input"
                placeholder="e.g. Windows 11 Enterprise / macOS"
                value={formData.operating_system}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Application Version</label>
              <input
                type="text"
                name="app_version"
                className="form-input"
                placeholder="e.g. Outlook v2308 / Chrome 120.0"
                value={formData.app_version}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">User / Department</label>
              <input
                type="text"
                name="user_department"
                className="form-input"
                placeholder="e.g. John Doe / Human Resources"
                value={formData.user_department}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Error Message */}
          <div className="form-group">
            <label className="form-label">Error Code or Dialog Message</label>
            <input
              type="text"
              name="error_message"
              className="form-input"
              placeholder="e.g. Error 0x80070005: Access Denied"
              value={formData.error_message}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCheckDuplicates}
              disabled={checkingDuplicates}
            >
              {checkingDuplicates ? 'Scanning duplicates...' : '🔍 Check For Duplicates'}
            </button>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Ticket...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
