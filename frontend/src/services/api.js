/**
 * API Client Service for SupportDesk
 * Pure, beginner-friendly JavaScript using standard window.fetch.
 */

// In development, requests are proxied via Vite to http://localhost:8000
const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.detail || (typeof data === 'string' ? data : 'An API error occurred');
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, error.message);
    throw error;
  }
}

export const api = {
  // --- Dashboard ---
  getDashboardStats: () => request('/dashboard/stats'),

  // --- Tickets ---
  getTickets: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/tickets${queryString}`);
  },

  getTicket: (id) => request(`/tickets/${id}`),

  createTicket: (ticketData) => request('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticketData)
  }),

  updateTicket: (id, updateData) => request(`/tickets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  }),

  deleteTicket: (id) => request(`/tickets/${id}`, {
    method: 'DELETE'
  }),

  checkDuplicateTickets: (data) => request('/tickets/check-duplicate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // --- Troubleshooting ---
  getDefaultTroubleshootingSteps: () => request('/troubleshooting/defaults'),

  getCategoryRecommendations: (category) => 
    request(`/troubleshooting/recommendations?category=${encodeURIComponent(category)}`),

  getTicketTroubleshooting: (ticketId) => 
    request(`/tickets/${ticketId}/troubleshooting`),

  addTroubleshootingStep: (ticketId, stepData) => request(`/tickets/${ticketId}/troubleshooting`, {
    method: 'POST',
    body: JSON.stringify(stepData)
  }),

  // --- Root Cause Analysis (RCA) ---
  getTicketRCA: (ticketId) => request(`/tickets/${ticketId}/rca`),

  saveTicketRCA: (ticketId, rcaData) => request(`/tickets/${ticketId}/rca`, {
    method: 'POST',
    body: JSON.stringify(rcaData)
  }),

  suggestRCA: (ticketId) => request(`/tickets/${ticketId}/rca/suggest`, {
    method: 'POST'
  }),

  // --- Resolution & Escalation ---
  resolveTicket: (ticketId, resolutionData) => request(`/tickets/${ticketId}/resolution`, {
    method: 'POST',
    body: JSON.stringify(resolutionData)
  }),

  escalateTicket: (ticketId, escalationData) => request(`/tickets/${ticketId}/escalate`, {
    method: 'POST',
    body: JSON.stringify(escalationData)
  }),

  getEscalationRecommendation: (ticketId) => 
    request(`/tickets/${ticketId}/escalation-recommendation`),

  // --- Knowledge Base ---
  getKBArticles: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.search) query.append('search', filters.search);
    if (filters.category) query.append('category', filters.category);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/knowledge-base${queryString}`);
  },

  getKBArticle: (id) => request(`/knowledge-base/${id}`),

  createKBArticle: (kbData) => request('/knowledge-base', {
    method: 'POST',
    body: JSON.stringify(kbData)
  }),

  // --- Troubleshooting Analytics ---
  getTroubleshootingAnalytics: () => request('/analytics/troubleshooting')
};
