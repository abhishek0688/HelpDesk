import React from 'react';

export default function PriorityBadge({ priority }) {
  const getBadgeClass = (p) => {
    switch ((p || '').toLowerCase()) {
      case 'critical':
        return 'badge-priority-critical';
      case 'high':
        return 'badge-priority-high';
      case 'medium':
        return 'badge-priority-medium';
      case 'low':
        return 'badge-priority-low';
      default:
        return 'badge-priority-medium';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(priority)}`}>
      {priority || 'Medium'}
    </span>
  );
}
