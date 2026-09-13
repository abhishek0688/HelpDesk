import React from 'react';

export default function Alert({ type = 'info', message, title, onClose }) {
  if (!message && !title) return null;

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '🛑'
  };

  return (
    <div className={`alert alert-${type}`}>
      <span style={{ fontSize: '16px' }}>{icons[type] || 'ℹ️'}</span>
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>}
        <div>{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
