import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TicketList from './pages/TicketList';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import KnowledgeBase from './pages/KnowledgeBase';
import Analytics from './pages/Analytics';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Navigate to ticket detail view
  const handleSelectTicket = (id) => {
    setSelectedTicketId(id);
    setCurrentTab('ticket-details');
  };

  // Switch tab and clear selected ticket
  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    if (tab !== 'ticket-details') {
      setSelectedTicketId(null);
    }
  };

  // Search from Navbar
  const handleGlobalSearch = (query) => {
    setGlobalSearch(query);
    if (currentTab !== 'tickets') {
      setCurrentTab('tickets');
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab === 'ticket-details' ? 'tickets' : currentTab}
        setCurrentTab={handleNavigate}
      />

      <div className="main-wrapper">
        <Navbar
          onSearch={handleGlobalSearch}
          onNewTicket={() => handleNavigate('create-ticket')}
        />

        <main className="page-content">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              onSelectTicket={handleSelectTicket}
            />
          )}

          {currentTab === 'tickets' && (
            <TicketList
              onSelectTicket={handleSelectTicket}
              onNavigate={handleNavigate}
              initialSearch={globalSearch}
            />
          )}

          {currentTab === 'create-ticket' && (
            <CreateTicket
              onNavigate={handleNavigate}
              onSelectTicket={handleSelectTicket}
            />
          )}

          {currentTab === 'ticket-details' && selectedTicketId && (
            <TicketDetails
              ticketId={selectedTicketId}
              onBack={() => handleNavigate('tickets')}
              onNavigateToKB={() => handleNavigate('knowledge-base')}
            />
          )}

          {currentTab === 'knowledge-base' && (
            <KnowledgeBase
              onSelectTicket={handleSelectTicket}
            />
          )}

          {currentTab === 'analytics' && (
            <Analytics />
          )}
        </main>
      </div>
    </div>
  );
}
