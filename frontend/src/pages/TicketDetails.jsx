import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaBadge from '../components/SlaBadge';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import WordCounter from '../components/WordCounter';
import Alert from '../components/Alert';

export default function TicketDetails({ ticketId, onBack, onNavigateToKB }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Recommendations and Checklist
  const [recommendations, setRecommendations] = useState([]);
  const [defaultSteps, setDefaultSteps] = useState([]);
  const [escalationRec, setEscalationRec] = useState(null);

  // Active modal controls
  const [activeModal, setActiveModal] = useState(null); // 'troubleshooting', 'rca', 'resolve', 'escalate', 'kb'

  // Troubleshooting step form
  const [stepForm, setStepForm] = useState({
    step_name: '',
    engineer_notes: '',
    result: 'Successful'
  });

  // RCA Form (Root cause strictly <= 100 words)
  const [rcaForm, setRcaForm] = useState({
    rca_type: 'Suspected',
    root_cause: '',
    contributing_factors: '',
    corrective_action: '',
    preventive_action: ''
  });
  const [suggestingRCA, setSuggestingRCA] = useState(false);
  const [rcaSuggestion, setRcaSuggestion] = useState(null);

  // Resolution Form
  const [resolveForm, setResolveForm] = useState({
    troubleshooting_summary: '',
    final_solution: '',
    workaround: '',
    user_confirmation: true,
    engineer_notes: ''
  });

  // Escalation Form
  const [escalateForm, setEscalateForm] = useState({
    reason: '',
    l2_team: 'Network Tier-2',
    priority: 'High',
    notes: ''
  });

  // Knowledge Base creation form
  const [kbForm, setKbForm] = useState({
    title: '',
    category: '',
    problem: '',
    symptoms: '',
    root_cause: '',
    troubleshooting_steps: '',
    final_solution: '',
    workaround: '',
    preventive_action: ''
  });

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketData, defaults] = await Promise.all([
        api.getTicket(ticketId),
        api.getDefaultTroubleshootingSteps()
      ]);
      setTicket(ticketData);
      setDefaultSteps(defaults);

      // Populate RCA if exists
      if (ticketData.rca_record) {
        setRcaForm({
          rca_type: ticketData.rca_record.rca_type,
          root_cause: ticketData.rca_record.root_cause,
          contributing_factors: ticketData.rca_record.contributing_factors || '',
          corrective_action: ticketData.rca_record.corrective_action || '',
          preventive_action: ticketData.rca_record.preventive_action || ''
        });
      }

      // Load category recommendations & escalation check
      if (ticketData.category) {
        const recs = await api.getCategoryRecommendations(ticketData.category);
        setRecommendations(recs);
      }

      const escCheck = await api.getEscalationRecommendation(ticketId);
      setEscalationRec(escCheck);

    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  // --- Troubleshooting Step Handler ---
  const handleAddStepSubmit = async (e) => {
    e.preventDefault();
    if (!stepForm.step_name.trim()) return;

    try {
      await api.addTroubleshootingStep(ticketId, stepForm);
      setFeedback({ type: 'success', message: `Step '${stepForm.step_name}' logged successfully.` });
      setStepForm({ step_name: '', engineer_notes: '', result: 'Successful' });
      setActiveModal(null);
      loadTicketData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  const openAddStepModal = (prefilledStepName = '') => {
    setStepForm({
      step_name: prefilledStepName,
      engineer_notes: '',
      result: 'Successful'
    });
    setActiveModal('troubleshooting');
  };

  // --- RCA Handlers ---
  const handleSuggestRCA = async () => {
    try {
      setSuggestingRCA(true);
      const suggestion = await api.suggestRCA(ticketId);
      setRcaSuggestion(suggestion);
    } catch (err) {
      alert(`Could not generate RCA suggestion: ${err.message}`);
    } finally {
      setSuggestingRCA(false);
    }
  };

  const acceptRcaSuggestion = () => {
    if (!rcaSuggestion) return;
    setRcaForm((prev) => ({
      ...prev,
      root_cause: rcaSuggestion.suggested_root_cause,
      contributing_factors: rcaSuggestion.contributing_factors,
      corrective_action: rcaSuggestion.corrective_action,
      preventive_action: rcaSuggestion.preventive_action
    }));
    setRcaSuggestion(null);
  };

  const handleSaveRCA = async (e) => {
    e.preventDefault();
    const wordCount = rcaForm.root_cause.trim() ? rcaForm.root_cause.trim().split(/\s+/).length : 0;
    if (wordCount > 100) {
      alert(`Root cause exceeds strict 100-word limit. Current count: ${wordCount} words.`);
      return;
    }
    if (wordCount === 0) {
      alert('Root cause cannot be empty.');
      return;
    }

    try {
      await api.saveTicketRCA(ticketId, rcaForm);
      setFeedback({ type: 'success', message: 'Root Cause Analysis saved successfully.' });
      setActiveModal(null);
      loadTicketData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  // --- Resolution Handler ---
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveForm.final_solution.trim()) {
      alert('Final solution is required to resolve this ticket.');
      return;
    }

    try {
      await api.resolveTicket(ticketId, resolveForm);
      setFeedback({ type: 'success', message: `Ticket ${ticket.ticket_code} marked as Resolved.` });
      setActiveModal(null);
      loadTicketData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  // --- Escalation Handler ---
  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    if (!escalateForm.reason.trim()) {
      alert('Escalation reason is required.');
      return;
    }

    try {
      await api.escalateTicket(ticketId, escalateForm);
      setFeedback({ type: 'success', message: `Ticket ${ticket.ticket_code} escalated to ${escalateForm.l2_team}.` });
      setActiveModal(null);
      loadTicketData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  // --- Save as Knowledge Base Article ---
  const openSaveAsKBModal = () => {
    const stepsSummary = (ticket.troubleshooting_steps || [])
      .map((s) => `- ${s.step_name}: ${s.result} (${s.engineer_notes || 'No notes'})`)
      .join('\n');

    setKbForm({
      ticket_id: ticket.id,
      title: `Solution: ${ticket.title}`,
      category: ticket.category,
      problem: ticket.description,
      symptoms: ticket.error_message || 'Standard symptoms documented in ticket description.',
      root_cause: ticket.rca_record ? ticket.rca_record.root_cause : '',
      troubleshooting_steps: stepsSummary,
      final_solution: ticket.resolution_record ? ticket.resolution_record.final_solution : '',
      workaround: ticket.resolution_record ? ticket.resolution_record.workaround : '',
      preventive_action: ticket.rca_record ? ticket.rca_record.preventive_action : ''
    });
    setActiveModal('kb');
  };

  const handleSaveAsKBSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createKBArticle(kbForm);
      setFeedback({ type: 'success', message: 'Knowledge Base article created successfully!' });
      setActiveModal(null);
      loadTicketData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="alert alert-danger">
        <span>{error || 'Ticket not found.'}</span>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginLeft: '12px' }}>
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header & Navigation */}
      <div className="page-header">
        <div>
          <button
            onClick={onBack}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '8px' }}
          >
            &larr; Back to Tickets
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontFamily: 'var(--font-mono)' }}>
              {ticket.ticket_code}
            </h1>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <SlaBadge
              slaStatus={ticket.sla_status}
              slaDeadline={ticket.sla_deadline}
              ticketStatus={ticket.status}
            />
          </div>
          <p className="page-desc" style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
            {ticket.title}
          </p>
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openAddStepModal()}
            disabled={ticket.status === 'Resolved'}
          >
            + Add Troubleshooting Step
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveModal('rca')}
          >
            {ticket.rca_record ? 'Edit RCA' : '+ Add RCA'}
          </button>

          {ticket.status !== 'Resolved' && (
            <>
              <button
                className="btn btn-warning btn-sm"
                onClick={() => setActiveModal('escalate')}
              >
                Escalate to L2
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() => setActiveModal('resolve')}
              >
                ✓ Resolve Ticket
              </button>
            </>
          )}

          {ticket.status === 'Resolved' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={openSaveAsKBModal}
            >
              📚 Save as KB Article
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Smart Escalation Recommendation Alert */}
      {escalationRec?.should_escalate && ticket.status !== 'Resolved' && ticket.status !== 'Escalated L2' && (
        <div className="alert alert-warning">
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <strong>{escalationRec.reason}</strong>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Suggested Team: <strong>{escalationRec.recommended_team}</strong>. The engineer makes the final decision.
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => {
              setEscalateForm((prev) => ({
                ...prev,
                l2_team: escalationRec.recommended_team,
                reason: escalationRec.reason
              }));
              setActiveModal('escalate');
            }}
          >
            Escalate Now
          </button>
        </div>
      )}

      {/* Main Grid: Info + Troubleshooting Left, Timeline + RCA Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Incident Overview Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ticket Information</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Created: {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Category</span>
                <strong>{ticket.category}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>User / Department</span>
                <strong>{ticket.user_department || 'Not Specified'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Affected Device/Host</span>
                <strong>{ticket.affected_device || 'Not Specified'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Operating System</span>
                <strong>{ticket.operating_system || 'Not Specified'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Application Version</span>
                <strong>{ticket.app_version || 'Not Specified'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>SLA Deadline</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>
                  {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                Problem Description
              </span>
              <p style={{ fontSize: '13px', lineHeight: 1.6 }}>{ticket.description}</p>
            </div>

            {ticket.error_message && (
              <div style={{ marginTop: '12px', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600, display: 'block' }}>
                  Reported Error Message:
                </span>
                <code style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{ticket.error_message}</code>
              </div>
            )}
          </div>

          {/* Smart Recommended Troubleshooting Checklist */}
          {recommendations.length > 0 && ticket.status !== 'Resolved' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Recommended Troubleshooting ({ticket.category})</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Rule-based technical recommendations. Click to log action performed.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="checklist-item">
                    <div>
                      <strong style={{ fontSize: '13px' }}>{rec.step_name}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rec.description}</p>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openAddStepModal(rec.step_name)}
                    >
                      Log Step
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Troubleshooting Steps History */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                Troubleshooting History ({ticket.troubleshooting_steps?.length || 0})
              </h2>
              {ticket.status !== 'Resolved' && (
                <button className="btn btn-secondary btn-sm" onClick={() => openAddStepModal()}>
                  + Add Custom Step
                </button>
              )}
            </div>

            {(!ticket.troubleshooting_steps || ticket.troubleshooting_steps.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', fontSize: '13px' }}>
                No troubleshooting steps recorded yet. Follow the checklist above.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ticket.troubleshooting_steps.map((step) => (
                  <div
                    key={step.id}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px' }}>{step.step_name}</strong>
                      <span
                        className={`badge ${
                          step.result === 'Successful'
                            ? 'badge-resolved'
                            : step.result === 'Unsuccessful'
                            ? 'badge-priority-critical'
                            : 'badge-priority-medium'
                        }`}
                      >
                        {step.result}
                      </span>
                    </div>

                    {step.engineer_notes && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Notes: {step.engineer_notes}
                      </p>
                    )}

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Logged at: {new Date(step.performed_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolution Details Card (if resolved) */}
          {ticket.resolution_record && (
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="card-header">
                <h2 className="card-title" style={{ color: 'var(--success)' }}>
                  ✓ Resolution Details
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Resolved: {new Date(ticket.resolution_record.resolved_at).toLocaleString()}
                </span>
              </div>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Final Solution:</span>
                  <strong>{ticket.resolution_record.final_solution}</strong>
                </div>

                {ticket.resolution_record.workaround && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Workaround:</span>
                    <span>{ticket.resolution_record.workaround}</span>
                  </div>
                )}

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>User Confirmation:</span>
                  <span>{ticket.resolution_record.user_confirmation ? '✅ Confirmed by User' : '❌ Not Confirmed'}</span>
                </div>

                {ticket.resolution_record.engineer_notes && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Closing Notes:</span>
                    <span>{ticket.resolution_record.engineer_notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* L2 Escalation Details Card (if escalated) */}
          {ticket.escalation_record && (
            <div className="card" style={{ borderLeft: '4px solid var(--purple)' }}>
              <div className="card-header">
                <h2 className="card-title" style={{ color: 'var(--purple)' }}>
                  Tier-2 Escalation
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(ticket.escalation_record.escalated_at).toLocaleString()}
                </span>
              </div>

              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned L2 Team:</span>
                  <strong>{ticket.escalation_record.l2_team}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Escalation Reason:</span>
                  <p>{ticket.escalation_record.reason}</p>
                </div>
                {ticket.escalation_record.notes && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Handover Notes:</span>
                    <p>{ticket.escalation_record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Root Cause Analysis (RCA) Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Root Cause Analysis (RCA)</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveModal('rca')}
              >
                {ticket.rca_record ? 'Edit RCA' : '+ Record RCA'}
              </button>
            </div>

            {!ticket.rca_record ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                <p>No Root Cause Analysis has been recorded yet.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={() => setActiveModal('rca')}
                >
                  Record Root Cause Analysis
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>RCA Status:</span>
                  <span className={`badge ${ticket.rca_record.rca_type === 'Confirmed' ? 'badge-resolved' : 'badge-priority-medium'}`}>
                    {ticket.rca_record.rca_type}
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Root Cause (Max 100 words):</span>
                  <p style={{ fontWeight: 500, marginTop: '2px', lineHeight: 1.5 }}>
                    {ticket.rca_record.root_cause}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Word count: {ticket.rca_record.root_cause.split(/\s+/).length} / 100
                  </div>
                </div>

                {ticket.rca_record.contributing_factors && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Contributing Factors:</span>
                    <p style={{ marginTop: '2px' }}>{ticket.rca_record.contributing_factors}</p>
                  </div>
                )}

                {ticket.rca_record.corrective_action && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Corrective Action:</span>
                    <p style={{ marginTop: '2px' }}>{ticket.rca_record.corrective_action}</p>
                  </div>
                )}

                {ticket.rca_record.preventive_action && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Preventive Action:</span>
                    <p style={{ marginTop: '2px' }}>{ticket.rca_record.preventive_action}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Incident Timeline / Audit Trail Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Incident Timeline & Audit Trail</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {ticket.activity_logs?.length || 0} events
              </span>
            </div>
            <Timeline activities={ticket.activity_logs} />
          </div>

        </div>
      </div>

      {/* --- MODAL 1: ADD TROUBLESHOOTING STEP --- */}
      <Modal
        isOpen={activeModal === 'troubleshooting'}
        onClose={() => setActiveModal(null)}
        title="Record Troubleshooting Step"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddStepSubmit}>Save Step</button>
          </>
        }
      >
        <form onSubmit={handleAddStepSubmit}>
          <div className="form-group">
            <label className="form-label">Action Name / Standard Step</label>
            <input
              type="text"
              className="form-input"
              value={stepForm.step_name}
              onChange={(e) => setStepForm({ ...stepForm, step_name: e.target.value })}
              placeholder="e.g. Restart network adapter / Flush DNS"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Standard Action (Optional quick fill)</label>
            <select
              className="form-select"
              onChange={(e) => {
                if (e.target.value) setStepForm({ ...stepForm, step_name: e.target.value });
              }}
              defaultValue=""
            >
              <option value="" disabled>Choose from 14 standard steps...</option>
              {defaultSteps.map((d, i) => (
                <option key={i} value={d.step_name}>{d.step_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Outcome / Result</label>
            <select
              className="form-select"
              value={stepForm.result}
              onChange={(e) => setStepForm({ ...stepForm, result: e.target.value })}
            >
              <option value="Successful">Successful</option>
              <option value="Unsuccessful">Unsuccessful</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Engineer Notes & Diagnostic Output</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Record IP addresses observed, command outputs, or user feedback..."
              value={stepForm.engineer_notes}
              onChange={(e) => setStepForm({ ...stepForm, engineer_notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* --- MODAL 2: ROOT CAUSE ANALYSIS (RCA) WITH SMART SUGGESTION --- */}
      <Modal
        isOpen={activeModal === 'rca'}
        onClose={() => setActiveModal(null)}
        title="Root Cause Analysis (RCA)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveRCA}>Save RCA</button>
          </>
        }
      >
        <div>
          {/* Smart Suggestion Section */}
          <div style={{ marginBottom: '16px', background: 'var(--primary-subtle)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--primary)' }}>💡 Smart RCA Generator</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Analyzes symptoms and troubleshooting results using rule-based heuristics.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSuggestRCA}
                disabled={suggestingRCA}
              >
                {suggestingRCA ? 'Analyzing...' : 'Suggest RCA'}
              </button>
            </div>

            {rcaSuggestion && (
              <div style={{ marginTop: '12px', background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <strong style={{ fontSize: '12px' }}>Suggested Root Cause:</strong>
                <p style={{ fontSize: '12px', marginTop: '2px' }}>{rcaSuggestion.suggested_root_cause}</p>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-success btn-sm" onClick={acceptRcaSuggestion}>
                    ✓ Accept Suggestion
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRcaSuggestion(null)}>
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveRCA}>
            <div className="form-group">
              <label className="form-label">RCA Type</label>
              <select
                className="form-select"
                value={rcaForm.rca_type}
                onChange={(e) => setRcaForm({ ...rcaForm, rca_type: e.target.value })}
              >
                <option value="Suspected">Suspected</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  Root Cause <span style={{ color: 'var(--danger)' }}>* (Strictly &le; 100 Words)</span>
                </label>
              </div>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Explain precisely why the failure occurred..."
                value={rcaForm.root_cause}
                onChange={(e) => setRcaForm({ ...rcaForm, root_cause: e.target.value })}
                required
              />
              <WordCounter text={rcaForm.root_cause} maxWords={100} />
            </div>

            <div className="form-group">
              <label className="form-label">Contributing Factors</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Environment changes, user actions, or concurrent system updates..."
                value={rcaForm.contributing_factors}
                onChange={(e) => setRcaForm({ ...rcaForm, contributing_factors: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Corrective Action</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Immediate fix applied to restore functionality..."
                value={rcaForm.corrective_action}
                onChange={(e) => setRcaForm({ ...rcaForm, corrective_action: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preventive Action</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Long-term measure to prevent recurrence..."
                value={rcaForm.preventive_action}
                onChange={(e) => setRcaForm({ ...rcaForm, preventive_action: e.target.value })}
              />
            </div>
          </form>
        </div>
      </Modal>

      {/* --- MODAL 3: RESOLVE TICKET --- */}
      <Modal
        isOpen={activeModal === 'resolve'}
        onClose={() => setActiveModal(null)}
        title="Resolve Ticket"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-success" onClick={handleResolveSubmit}>Confirm Resolution</button>
          </>
        }
      >
        <form onSubmit={handleResolveSubmit}>
          <div className="form-group">
            <label className="form-label">
              Final Resolution Solution <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="State the permanent solution that fixed the incident..."
              value={resolveForm.final_solution}
              onChange={(e) => setResolveForm({ ...resolveForm, final_solution: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temporary Workaround (if any)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Switched user to temporary hotspot"
              value={resolveForm.workaround}
              onChange={(e) => setResolveForm({ ...resolveForm, workaround: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Troubleshooting Summary</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Summary of tests and verification performed..."
              value={resolveForm.troubleshooting_summary}
              onChange={(e) => setResolveForm({ ...resolveForm, troubleshooting_summary: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="userConfirm"
              checked={resolveForm.user_confirmation}
              onChange={(e) => setResolveForm({ ...resolveForm, user_confirmation: e.target.checked })}
            />
            <label htmlFor="userConfirm" style={{ fontSize: '13px', cursor: 'pointer' }}>
              User has confirmed service restoration
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Engineer Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="Additional handover or closure notes"
              value={resolveForm.engineer_notes}
              onChange={(e) => setResolveForm({ ...resolveForm, engineer_notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* --- MODAL 4: ESCALATE TO LEVEL 2 --- */}
      <Modal
        isOpen={activeModal === 'escalate'}
        onClose={() => setActiveModal(null)}
        title="Escalate Ticket to Level 2 (L2)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-warning" onClick={handleEscalateSubmit}>Confirm Escalation</button>
          </>
        }
      >
        <form onSubmit={handleEscalateSubmit}>
          <div className="form-group">
            <label className="form-label">Target L2 Support Team</label>
            <select
              className="form-select"
              value={escalateForm.l2_team}
              onChange={(e) => setEscalateForm({ ...escalateForm, l2_team: e.target.value })}
            >
              <option value="Network Tier-2">Network Tier-2 (Firewalls & Infrastructure)</option>
              <option value="Application Support Tier-2">Application Support Tier-2</option>
              <option value="Desktop Field Engineering">Desktop Field Engineering</option>
              <option value="Systems & Storage Tier-2">Systems & Storage Tier-2</option>
              <option value="Identity & Access Management (IAM)">Identity & Access Management (IAM)</option>
              <option value="Security Operations Center (SOC)">Security Operations Center (SOC)</option>
              <option value="Senior Technical Support Tier-2">Senior Technical Support Tier-2</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Escalation Reason <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Why is Level 1 unable to resolve this issue? (e.g. requires administrator privileges, firewall route modification)..."
              value={escalateForm.reason}
              onChange={(e) => setEscalateForm({ ...escalateForm, reason: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Escalation Priority</label>
            <select
              className="form-select"
              value={escalateForm.priority}
              onChange={(e) => setEscalateForm({ ...escalateForm, priority: e.target.value })}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Handover Notes for L2 Engineer</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Diagnostic logs attached, test accounts tested, contacts..."
              value={escalateForm.notes}
              onChange={(e) => setEscalateForm({ ...escalateForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* --- MODAL 5: SAVE AS KNOWLEDGE BASE ARTICLE --- */}
      <Modal
        isOpen={activeModal === 'kb'}
        onClose={() => setActiveModal(null)}
        title="Publish Knowledge Base Article"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveAsKBSubmit}>Publish Article</button>
          </>
        }
      >
        <form onSubmit={handleSaveAsKBSubmit}>
          <div className="form-group">
            <label className="form-label">Article Title</label>
            <input
              type="text"
              className="form-input"
              value={kbForm.title}
              onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              className="form-input"
              value={kbForm.category}
              onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Problem Statement</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={kbForm.problem}
              onChange={(e) => setKbForm({ ...kbForm, problem: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Root Cause</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={kbForm.root_cause}
              onChange={(e) => setKbForm({ ...kbForm, root_cause: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Troubleshooting Steps</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={kbForm.troubleshooting_steps}
              onChange={(e) => setKbForm({ ...kbForm, troubleshooting_steps: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Final Solution Instructions</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={kbForm.final_solution}
              onChange={(e) => setKbForm({ ...kbForm, final_solution: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Workaround (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={kbForm.workaround}
              onChange={(e) => setKbForm({ ...kbForm, workaround: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
