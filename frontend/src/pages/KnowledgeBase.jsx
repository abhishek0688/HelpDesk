import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function KnowledgeBase({ onSelectTicket }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected article for detailed view
  const [selectedArticle, setSelectedArticle] = useState(null);

  // New Article Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'Software',
    problem: '',
    symptoms: '',
    root_cause: '',
    troubleshooting_steps: '',
    final_solution: '',
    workaround: '',
    preventive_action: ''
  });

  useEffect(() => {
    fetchArticles();
  }, [search, categoryFilter]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getKBArticles({ search, category: categoryFilter });
      setArticles(data);
    } catch (err) {
      setError(err.message || 'Error fetching knowledge base articles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createKBArticle(createForm);
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        category: 'Software',
        problem: '',
        symptoms: '',
        root_cause: '',
        troubleshooting_steps: '',
        final_solution: '',
        workaround: '',
        preventive_action: ''
      });
      fetchArticles();
    } catch (err) {
      alert(`Could not create article: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="page-desc">Verified solutions, standard operating procedures (SOPs), and incident resolutions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          + New Article
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Search solutions by keywords (e.g. Wi-Fi, Outlook, Printer)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '240px' }}
          />

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Operating System">Operating System</option>
            <option value="Access">Access</option>
            <option value="Security">Security</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Searching knowledge base...
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : articles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '15px', fontWeight: 500 }}>No knowledge base articles found.</p>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Try searching another keyword or create a new article.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {articles.map((art) => (
            <div
              key={art.id}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s, border-color 0.15s',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => setSelectedArticle(art)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="badge badge-open">{art.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    KB-{String(art.id).padStart(4, '0')}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {art.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  <strong>Problem:</strong> {art.problem.length > 120 ? `${art.problem.substring(0, 120)}...` : art.problem}
                </p>

                {art.final_solution && (
                  <div style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-primary)' }}>
                    <strong style={{ color: 'var(--success)' }}>✓ Solution:</strong>{' '}
                    {art.final_solution.length > 100 ? `${art.final_solution.substring(0, 100)}...` : art.final_solution}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Published: {new Date(art.created_at).toLocaleDateString()}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Read Article &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL: VIEW FULL KB ARTICLE --- */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Knowledge Base Article'}
        footer={
          <button className="btn btn-secondary" onClick={() => setSelectedArticle(null)}>
            Close
          </button>
        }
      >
        {selectedArticle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-open">{selectedArticle.category}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Article ID: KB-{String(selectedArticle.id).padStart(4, '0')}
              </span>
            </div>

            <div>
              <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Problem Description:</strong>
              <p style={{ marginTop: '2px', lineHeight: 1.5 }}>{selectedArticle.problem}</p>
            </div>

            {selectedArticle.symptoms && (
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Symptoms & Errors:</strong>
                <p style={{ marginTop: '2px' }}>{selectedArticle.symptoms}</p>
              </div>
            )}

            {selectedArticle.root_cause && (
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Root Cause:</strong>
                <p style={{ marginTop: '2px' }}>{selectedArticle.root_cause}</p>
              </div>
            )}

            {selectedArticle.troubleshooting_steps && (
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Troubleshooting Steps:</strong>
                <pre style={{ marginTop: '4px', background: 'var(--bg-subtle)', padding: '10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {selectedArticle.troubleshooting_steps}
                </pre>
              </div>
            )}

            <div style={{ background: 'var(--primary-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ display: 'block', color: 'var(--primary)' }}>Final Verified Solution:</strong>
              <p style={{ marginTop: '4px', lineHeight: 1.5 }}>{selectedArticle.final_solution}</p>
            </div>

            {selectedArticle.workaround && (
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Workaround:</strong>
                <p style={{ marginTop: '2px' }}>{selectedArticle.workaround}</p>
              </div>
            )}

            {selectedArticle.preventive_action && (
              <div>
                <strong style={{ display: 'block', color: 'var(--text-muted)' }}>Preventive Action:</strong>
                <p style={{ marginTop: '2px' }}>{selectedArticle.preventive_action}</p>
              </div>
            )}

            {selectedArticle.ticket_id && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Derived from Incident Ticket #{selectedArticle.ticket_id}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* --- MODAL: CREATE MANUAL KB ARTICLE --- */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Knowledge Base Article"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>Publish Article</button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Article Title <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text"
              className="form-input"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="e.g. How to resolve Cisco VPN DNS resolution timeouts"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select
              className="form-select"
              value={createForm.category}
              onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
            >
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Operating System">Operating System</option>
              <option value="Access">Access</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Statement <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              className="form-textarea"
              rows={2}
              value={createForm.problem}
              onChange={(e) => setCreateForm({ ...createForm, problem: e.target.value })}
              placeholder="Describe the issue symptoms..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Root Cause</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={createForm.root_cause}
              onChange={(e) => setCreateForm({ ...createForm, root_cause: e.target.value })}
              placeholder="Why this issue occurs..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Troubleshooting Steps</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={createForm.troubleshooting_steps}
              onChange={(e) => setCreateForm({ ...createForm, troubleshooting_steps: e.target.value })}
              placeholder="Step-by-step diagnostic checklist..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Final Solution <span style={{ color: 'var(--danger)' }}>*</span></label>
            <textarea
              className="form-textarea"
              rows={3}
              value={createForm.final_solution}
              onChange={(e) => setCreateForm({ ...createForm, final_solution: e.target.value })}
              placeholder="Permanent resolution instructions..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Workaround (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={createForm.workaround}
              onChange={(e) => setCreateForm({ ...createForm, workaround: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
