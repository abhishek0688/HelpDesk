import React, { useState, useEffect } from 'react';

export default function Navbar({ onSearch, onNewTicket }) {
  const [theme, setTheme] = useState(localStorage.getItem('supportdesk_theme') || 'light');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('supportdesk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <form onSubmit={handleSearchSubmit} className="navbar-search">
          <span className="search-icon-abs">🔍</span>
          <input
            type="text"
            placeholder="Search tickets by ID, title, device..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
          />
        </form>
      </div>

      <div className="navbar-right">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>

        <button className="btn btn-primary btn-sm" onClick={onNewTicket}>
          + New Ticket
        </button>
      </div>
    </header>
  );
}
