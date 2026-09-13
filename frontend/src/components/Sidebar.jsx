import React from 'react';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tickets', label: 'All Tickets', icon: '🎫' },
    { id: 'create-ticket', label: 'Create Ticket', icon: '➕' },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: '📚' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">SD</div>
        <div>
          <div className="sidebar-title">SupportDesk</div>
          <div className="sidebar-subtitle">IT Incident Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>
          <span style={{ color: 'var(--success)', marginRight: '6px' }}>●</span>
          <span>Core API Online</span>
        </div>
        <span style={{ opacity: 0.7 }}>v1.0</span>
      </div>
    </aside>
  );
}
