import React from 'react';

export default function SlaBadge({ slaStatus, slaDeadline, ticketStatus }) {
  const getBadgeClass = () => {
    if (ticketStatus === 'Resolved' || ticketStatus === 'Closed' || slaStatus === 'Completed') {
      return 'badge-sla-within';
    }
    if (slaStatus === 'Breached') {
      return 'badge-sla-breached';
    }
    if (slaStatus === 'Near Breach') {
      return 'badge-sla-near-breach';
    }
    return 'badge-sla-within';
  };

  const getTimeRemainingText = () => {
    if (ticketStatus === 'Resolved' || ticketStatus === 'Closed' || slaStatus === 'Completed') {
      return 'Completed';
    }
    if (!slaDeadline) return slaStatus || 'Within SLA';

    const deadlineTime = new Date(slaDeadline).getTime();
    const nowTime = new Date().getTime();
    const diffMs = deadlineTime - nowTime;

    if (diffMs < 0) {
      const overdueMins = Math.floor(Math.abs(diffMs) / 60000);
      const overdueHours = Math.floor(overdueMins / 60);
      return overdueHours > 0 
        ? `Breached (${overdueHours}h overdue)` 
        : `Breached (${overdueMins}m overdue)`;
    }

    const remainingMins = Math.floor(diffMs / 60000);
    const remainingHours = Math.floor(remainingMins / 60);
    if (remainingHours > 0) {
      return `${slaStatus} (${remainingHours}h ${remainingMins % 60}m left)`;
    }
    return `${slaStatus} (${remainingMins}m left)`;
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      ⏱ {getTimeRemainingText()}
    </span>
  );
}
