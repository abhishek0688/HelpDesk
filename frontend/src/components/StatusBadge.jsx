import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeClass = (st) => {
    switch ((st || '').toLowerCase()) {
      case 'open':
        return 'badge-open';
      case 'in progress':
        return 'badge-in-progress';
      case 'resolved':
        return 'badge-resolved';
      case 'escalated l2':
        return 'badge-escalated-l2';
      case 'closed':
        return 'badge-closed';
      default:
        return 'badge-open';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      <span style={{ fontSize: '10px' }}>●</span> {status || 'Open'}
    </span>
  );
}
