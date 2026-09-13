import React from 'react';

export default function Timeline({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
        No historical activities recorded yet.
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="timeline">
      {activities.map((item) => (
        <div key={item.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-title">{item.activity}</span>
              <span className="timeline-time">{formatTime(item.timestamp)}</span>
            </div>
            <div className="timeline-desc">{item.description}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Logged by: {item.engineer || 'Support Engineer'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
