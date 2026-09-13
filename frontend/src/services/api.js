/**
 * API Client Service for SupportDesk
 * Seamlessly connects to the FastAPI backend.
 * If the backend is offline or deployed on static Netlify without VITE_API_URL,
 * it gracefully falls back to an interactive in-browser demo database
 * so recruiters and visitors can test all features without 404/JSON errors.
 */

const BACKEND_HOST = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
const API_BASE = `${BACKEND_HOST}/api/v1`;

// --- INITIAL SEED DATA FOR DEMO / NETLIFY FALLBACK ---
const INITIAL_DEMO_TICKETS = [
  {
    id: 1,
    ticket_code: "INC-1001",
    title: "Unable to connect to office Wi-Fi network",
    description: "Laptop disconnects from corporate SSID 'Corp-Secure' every few minutes and reports 'No Internet, Secured'.",
    priority: "High",
    category: "Network",
    affected_device: "Dell Latitude 5420 (Asset #DL-9821)",
    operating_system: "Windows 11 Enterprise",
    app_version: "Intel Wi-Fi 6 AX201 Driver v22.10",
    error_message: "DNS_PROBE_FINISHED_NO_INTERNET",
    user_department: "Sarah Jenkins / Finance",
    status: "Resolved",
    sla_deadline: new Date(Date.now() - 2 * 3600000).toISOString(),
    sla_status: "Completed",
    is_escalated: false,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    troubleshooting_steps: [
      { id: 1, ticket_id: 1, step_name: "Restart computer/application", result: "Unsuccessful", engineer_notes: "Rebooted PC. Issue persisted.", performed_at: new Date().toISOString() },
      { id: 2, ticket_id: 1, step_name: "Update/reinstall drivers", result: "Successful", engineer_notes: "Updated Intel Wi-Fi driver to v22.250.", performed_at: new Date().toISOString() }
    ],
    rca_record: {
      id: 1,
      ticket_id: 1,
      rca_type: "Confirmed",
      root_cause: "Outdated Intel Wi-Fi 6 AX201 adapter driver failed to handle 802.11ax WPA3 enterprise roaming handshakes.",
      contributing_factors: "Corporate AP firmware update enabled mandatory PMF.",
      corrective_action: "Updated network adapter driver to verified OEM version 22.250.0.",
      preventive_action: "Push automated Wi-Fi driver updates via Microsoft Intune ring deployment.",
      created_at: new Date().toISOString()
    },
    resolution_record: {
      id: 1,
      ticket_id: 1,
      final_solution: "Upgraded Wi-Fi network adapter driver to version 22.250.0 and renewed DHCP lease.",
      workaround: "Used USB Ethernet adapter temporarily.",
      user_confirmation: true,
      engineer_notes: "User confirmed connection restored.",
      resolved_at: new Date().toISOString()
    },
    activity_logs: [
      { id: 1, ticket_id: 1, activity: "Ticket Created", description: "Ticket INC-1001 created.", engineer: "Support Engineer", timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: 2, ticket_id: 1, activity: "Troubleshooting: Update/reinstall drivers", description: "Result: Successful", engineer: "Support Engineer", timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: 3, ticket_id: 1, activity: "Ticket Resolved", description: "Ticket marked Resolved.", engineer: "Support Engineer", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
    ]
  },
  {
    id: 2,
    ticket_code: "INC-1002",
    title: "Outlook crashes on startup with 'Cannot start Microsoft Outlook'",
    description: "User clicks desktop Outlook icon; splash screen displays 'Loading Profile' for 10 seconds, then terminates abruptly.",
    priority: "Medium",
    category: "Software",
    affected_device: "Lenovo ThinkPad X1 Carbon",
    operating_system: "Windows 10 Enterprise 22H2",
    app_version: "Microsoft 365 Apps v2308",
    error_message: "Cannot start Microsoft Outlook. The set of folders cannot be opened.",
    user_department: "Marcus Vance / Legal",
    status: "In Progress",
    sla_deadline: new Date(Date.now() + 6 * 3600000).toISOString(),
    sla_status: "Within SLA",
    is_escalated: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    troubleshooting_steps: [
      { id: 3, ticket_id: 2, step_name: "Follow SOP/Knowledge Base", result: "Successful", engineer_notes: "Outlook opened successfully in Safe Mode.", performed_at: new Date().toISOString() }
    ],
    activity_logs: [
      { id: 4, ticket_id: 2, activity: "Ticket Created", description: "Ticket INC-1002 created.", engineer: "Support Engineer", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
    ]
  },
  {
    id: 3,
    ticket_code: "INC-1003",
    title: "HP LaserJet print jobs stuck in spooler queue",
    description: "Marketing team cannot print payroll flyers. All submitted print jobs show 'Error - Printing' in the queue.",
    priority: "Medium",
    category: "Hardware",
    affected_device: "HP LaserJet Enterprise M608",
    operating_system: "Windows Server 2022",
    app_version: "HP Universal Print Driver v7.1.0",
    error_message: "Print Spooler Service unresponsive; Error 0x0000007b",
    user_department: "Robert Chen / Marketing",
    status: "Resolved",
    sla_deadline: new Date(Date.now() - 5 * 3600000).toISOString(),
    sla_status: "Completed",
    is_escalated: false,
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    troubleshooting_steps: [
      { id: 4, ticket_id: 3, step_name: "Clear cache/temp files", result: "Successful", engineer_notes: "Purged corrupt spooler queue.", performed_at: new Date().toISOString() }
    ],
    resolution_record: {
      id: 2,
      ticket_id: 3,
      final_solution: "Flushed stuck print queue in Windows Spooler directory and restarted service.",
      user_confirmation: true,
      resolved_at: new Date().toISOString()
    },
    activity_logs: [
      { id: 5, ticket_id: 3, activity: "Ticket Created", description: "Ticket INC-1003 created.", engineer: "Support Engineer", timestamp: new Date(Date.now() - 14 * 3600000).toISOString() }
    ]
  },
  {
    id: 4,
    ticket_code: "INC-1004",
    title: "Cisco AnyConnect VPN connects but cannot reach internal subnets",
    description: "Remote engineer connects to corporate VPN successfully; tunnel IP is assigned, but routing to 10.200.0.0/16 fails.",
    priority: "Critical",
    category: "Network",
    affected_device: "MacBook Pro M2",
    operating_system: "macOS Sonoma 14.3",
    app_version: "Cisco Secure Client v5.0",
    error_message: "Destination host unreachable via tun0",
    user_department: "Elena Rostova / Engineering",
    status: "Escalated L2",
    sla_deadline: new Date(Date.now() - 1 * 3600000).toISOString(),
    sla_status: "Breached",
    is_escalated: true,
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    troubleshooting_steps: [
      { id: 5, ticket_id: 4, step_name: "Restart computer/application", result: "Unsuccessful", engineer_notes: "Restarted AnyConnect.", performed_at: new Date().toISOString() },
      { id: 6, ticket_id: 4, step_name: "Check IP configuration", result: "Unsuccessful", engineer_notes: "Missing ASA split-tunnel route.", performed_at: new Date().toISOString() }
    ],
    escalation_record: {
      id: 1,
      ticket_id: 4,
      reason: "Split-tunnel Access Control List on the corporate Cisco ASA firewall is missing subnet routes for AWS VPC.",
      l2_team: "Network Tier-2",
      priority: "Critical",
      notes: "Requires firewall administrator privilege to update ACL.",
      escalated_at: new Date().toISOString()
    },
    activity_logs: [
      { id: 6, ticket_id: 4, activity: "Ticket Created", description: "Ticket INC-1004 created.", engineer: "Support Engineer", timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: 7, ticket_id: 4, activity: "Escalated to L2", description: "Escalated to Network Tier-2.", engineer: "Support Engineer", timestamp: new Date().toISOString() }
    ]
  }
];

const INITIAL_DEMO_KB = [
  {
    id: 1,
    title: "Resolving Intel Wi-Fi 6 Adapter Roaming & DHCP APIPA Failures",
    category: "Network",
    problem: "Workstation repeatedly disconnects from enterprise 802.1X Wi-Fi networks and assigns a self-assigned 169.254.x.x APIPA address.",
    symptoms: "Notification 'No Internet, Secured'; ping to default gateway fails.",
    root_cause: "Outdated OEM network drivers do not support WPA3 Protected Management Frames (PMF).",
    troubleshooting_steps: "1. Device Manager -> Network Adapters\n2. Run ipconfig /renew\n3. Install latest Intel driver package.",
    final_solution: "Update Intel Wi-Fi driver to version 22.250.0 or higher.",
    workaround: "Use USB Ethernet dock.",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 2,
    title: "How to Clear Stalled Print Spooler Queue in Windows",
    category: "Hardware",
    problem: "Print jobs remain stuck in queue with status 'Error - Printing'.",
    symptoms: "Printers appear offline; spoolsv.exe high CPU.",
    root_cause: "Corrupted spool file (.SHD/.SPL) locks spooler RPC port.",
    troubleshooting_steps: "net stop spooler && del /Q C:\\Windows\\System32\\spool\\PRINTERS\\* && net start spooler",
    final_solution: "Purge locked queue files from System32 spool directory and restart Print Spooler service.",
    workaround: "Export document as PDF.",
    created_at: new Date(Date.now() - 5 * 3600000).toISOString()
  }
];

function getDemoTickets() {
  const stored = localStorage.getItem('supportdesk_demo_tickets');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { /* fallback */ }
  }
  localStorage.setItem('supportdesk_demo_tickets', JSON.stringify(INITIAL_DEMO_TICKETS));
  return INITIAL_DEMO_TICKETS;
}

function saveDemoTickets(tickets) {
  localStorage.setItem('supportdesk_demo_tickets', JSON.stringify(tickets));
}

function getDemoKB() {
  const stored = localStorage.getItem('supportdesk_demo_kb');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { /* fallback */ }
  }
  localStorage.setItem('supportdesk_demo_kb', JSON.stringify(INITIAL_DEMO_KB));
  return INITIAL_DEMO_KB;
}

function saveDemoKB(kb) {
  localStorage.setItem('supportdesk_demo_kb', JSON.stringify(kb));
}

// Check if request is trying to talk to Netlify static host (which returns HTML instead of JSON)
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    
    // If Netlify returns HTML instead of JSON (because backend is not running on Netlify)
    if (contentType.includes('text/html')) {
      throw new Error('BACKEND_OFFLINE_HTML');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'An API error occurred');
    }
    return data;
  } catch (error) {
    // If server unreachable or returned HTML, trigger fallback
    console.warn(`[SupportDesk] Live backend not reachable on ${url}. Using demo store. (${error.message})`);
    throw error;
  }
}

// --- PUBLIC API WRAPPER WITH SEAMLESS DEMO FALLBACK ---
export const api = {
  getDashboardStats: async () => {
    try {
      return await request('/dashboard/stats');
    } catch (err) {
      const tickets = getDemoTickets();
      const openCount = tickets.filter(t => t.status === 'Open').length;
      const inProg = tickets.filter(t => t.status === 'In Progress').length;
      const resolved = tickets.filter(t => t.status === 'Resolved').length;
      const l2 = tickets.filter(t => t.status === 'Escalated L2').length;
      const breached = tickets.filter(t => t.sla_status === 'Breached').length;
      const critical = tickets.filter(t => t.priority === 'Critical').length;
      
      return {
        total_tickets: tickets.length,
        open_tickets: openCount,
        in_progress_tickets: inProg,
        resolved_tickets: resolved,
        l2_escalated_tickets: l2,
        sla_breached_tickets: breached,
        critical_tickets: critical,
        most_common_category: "Network",
        avg_resolution_time_hours: 2.5,
        fcr_rate_percentage: 66.7,
        category_distribution: [
          { category: "Network", count: 2 },
          { category: "Software", count: 1 },
          { category: "Hardware", count: 1 }
        ]
      };
    }
  },

  getTickets: async (filters = {}) => {
    try {
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await request(`/tickets${qs}`);
    } catch (err) {
      let list = [...getDemoTickets()];
      if (filters.search) {
        const s = filters.search.toLowerCase();
        list = list.filter(t => t.title.toLowerCase().includes(s) || t.ticket_code.toLowerCase().includes(s));
      }
      if (filters.status) list = list.filter(t => t.status === filters.status);
      if (filters.priority) list = list.filter(t => t.priority === filters.priority);
      if (filters.category) list = list.filter(t => t.category === filters.category);
      if (filters.sla_status) list = list.filter(t => t.sla_status === filters.sla_status);
      if (filters.is_escalated !== undefined) list = list.filter(t => t.is_escalated === filters.is_escalated);
      return list;
    }
  },

  getTicket: async (id) => {
    try {
      return await request(`/tickets/${id}`);
    } catch (err) {
      const tickets = getDemoTickets();
      const match = tickets.find(t => t.id === Number(id));
      if (!match) throw new Error("Ticket not found in demo database");
      return match;
    }
  },

  createTicket: async (ticketData) => {
    try {
      return await request('/tickets', { method: 'POST', body: JSON.stringify(ticketData) });
    } catch (err) {
      const tickets = getDemoTickets();
      const nextNum = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1001 : 1001;
      const newTicket = {
        id: tickets.length + 1,
        ticket_code: `INC-${nextNum}`,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority || 'Medium',
        category: ticketData.category || 'Software',
        affected_device: ticketData.affected_device || '',
        operating_system: ticketData.operating_system || '',
        app_version: ticketData.app_version || '',
        error_message: ticketData.error_message || '',
        user_department: ticketData.user_department || '',
        status: 'Open',
        sla_deadline: new Date(Date.now() + 8 * 3600000).toISOString(),
        sla_status: 'Within SLA',
        is_escalated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        troubleshooting_steps: [],
        activity_logs: [
          {
            id: Date.now(),
            ticket_id: tickets.length + 1,
            activity: 'Ticket Created',
            description: `Ticket INC-${nextNum} created with priority '${ticketData.priority}'.`,
            engineer: 'Support Engineer',
            timestamp: new Date().toISOString()
          }
        ]
      };
      tickets.unshift(newTicket);
      saveDemoTickets(tickets);
      return newTicket;
    }
  },

  updateTicket: async (id, updateData) => {
    try {
      return await request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });
    } catch (err) {
      const tickets = getDemoTickets();
      const idx = tickets.findIndex(t => t.id === Number(id));
      if (idx !== -1) {
        tickets[idx] = { ...tickets[idx], ...updateData, updated_at: new Date().toISOString() };
        saveDemoTickets(tickets);
        return tickets[idx];
      }
      throw new Error("Ticket not found");
    }
  },

  deleteTicket: async (id) => {
    try {
      return await request(`/tickets/${id}`, { method: 'DELETE' });
    } catch (err) {
      let tickets = getDemoTickets();
      tickets = tickets.filter(t => t.id !== Number(id));
      saveDemoTickets(tickets);
      return null;
    }
  },

  checkDuplicateTickets: async (data) => {
    try {
      return await request('/tickets/check-duplicate', { method: 'POST', body: JSON.stringify(data) });
    } catch (err) {
      const tickets = getDemoTickets();
      const term = (data.title || '').toLowerCase();
      const matches = tickets.filter(t => t.title.toLowerCase().includes(term.slice(0, 8)));
      return {
        has_duplicates: matches.length > 0,
        matches: matches.map(m => ({
          id: m.id,
          ticket_code: m.ticket_code,
          title: m.title,
          status: m.status,
          category: m.category,
          similarity_score: 0.85,
          final_solution: m.resolution_record ? m.resolution_record.final_solution : null
        }))
      };
    }
  },

  getDefaultTroubleshootingSteps: async () => {
    try {
      return await request('/troubleshooting/defaults');
    } catch (err) {
      return [
        { step_name: "Restart computer/application", description: "Clean restart of device or process." },
        { step_name: "Check power and physical connections", description: "Ensure cables are connected firmly." },
        { step_name: "Check network connectivity", description: "Verify ping to gateway and local network." },
        { step_name: "Check IP configuration", description: "Run ipconfig /all to verify valid IP." },
        { step_name: "Check user permissions", description: "Verify Active Directory permissions." },
        { step_name: "Update/reinstall drivers", description: "Update to manufacturer certified drivers." },
        { step_name: "Clear cache/temp files", description: "Delete temporary files and app cache." },
        { step_name: "Follow SOP/Knowledge Base", description: "Cross-reference documented procedures." }
      ];
    }
  },

  getCategoryRecommendations: async (category) => {
    try {
      return await request(`/troubleshooting/recommendations?category=${encodeURIComponent(category)}`);
    } catch (err) {
      return [
        { step_name: "Restart network adapter", description: "Disable and re-enable adapter.", category },
        { step_name: "Check IP configuration", description: "Run ipconfig /release and renew.", category },
        { step_name: "Test DNS", description: "Verify name resolution via nslookup.", category }
      ];
    }
  },

  getTicketTroubleshooting: async (ticketId) => {
    try {
      return await request(`/tickets/${ticketId}/troubleshooting`);
    } catch (err) {
      const ticket = (getDemoTickets()).find(t => t.id === Number(ticketId));
      return ticket ? (ticket.troubleshooting_steps || []) : [];
    }
  },

  addTroubleshootingStep: async (ticketId, stepData) => {
    try {
      return await request(`/tickets/${ticketId}/troubleshooting`, { method: 'POST', body: JSON.stringify(stepData) });
    } catch (err) {
      const tickets = getDemoTickets();
      const ticket = tickets.find(t => t.id === Number(ticketId));
      if (ticket) {
        const newStep = {
          id: Date.now(),
          ticket_id: Number(ticketId),
          step_name: stepData.step_name,
          engineer_notes: stepData.engineer_notes,
          result: stepData.result,
          performed_at: new Date().toISOString()
        };
        if (!ticket.troubleshooting_steps) ticket.troubleshooting_steps = [];
        ticket.troubleshooting_steps.push(newStep);
        if (ticket.status === 'Open') ticket.status = 'In Progress';
        ticket.activity_logs.push({
          id: Date.now(),
          ticket_id: Number(ticketId),
          activity: `Troubleshooting: ${stepData.step_name}`,
          description: `Result: ${stepData.result}`,
          engineer: 'Support Engineer',
          timestamp: new Date().toISOString()
        });
        saveDemoTickets(tickets);
        return newStep;
      }
      throw new Error("Ticket not found");
    }
  },

  getTicketRCA: async (ticketId) => {
    try {
      return await request(`/tickets/${ticketId}/rca`);
    } catch (err) {
      const ticket = (getDemoTickets()).find(t => t.id === Number(ticketId));
      return ticket ? ticket.rca_record : null;
    }
  },

  saveTicketRCA: async (ticketId, rcaData) => {
    try {
      return await request(`/tickets/${ticketId}/rca`, { method: 'POST', body: JSON.stringify(rcaData) });
    } catch (err) {
      const tickets = getDemoTickets();
      const ticket = tickets.find(t => t.id === Number(ticketId));
      if (ticket) {
        ticket.rca_record = { ...rcaData, id: Date.now(), ticket_id: Number(ticketId), created_at: new Date().toISOString() };
        ticket.activity_logs.push({
          id: Date.now(),
          ticket_id: Number(ticketId),
          activity: "RCA Recorded",
          description: `RCA Type: ${rcaData.rca_type}. Root Cause: ${rcaData.root_cause.slice(0, 80)}...`,
          engineer: "Support Engineer",
          timestamp: new Date().toISOString()
        });
        saveDemoTickets(tickets);
        return ticket.rca_record;
      }
      throw new Error("Ticket not found");
    }
  },

  suggestRCA: async (ticketId) => {
    try {
      return await request(`/tickets/${ticketId}/rca/suggest`, { method: 'POST' });
    } catch (err) {
      return {
        suggested_root_cause: "Network interface adapter driver failed to negotiate enterprise 802.1X security handshake after recent firmware update.",
        contributing_factors: "Outdated OEM network driver; conflicting security policy.",
        corrective_action: "Update network adapter driver to verified certified version and renew DHCP lease.",
        preventive_action: "Enforce automated driver update packages through endpoint management.",
        explanation: "Rule-based heuristic analysis of reported network symptoms."
      };
    }
  },

  resolveTicket: async (ticketId, resolutionData) => {
    try {
      return await request(`/tickets/${ticketId}/resolution`, { method: 'POST', body: JSON.stringify(resolutionData) });
    } catch (err) {
      const tickets = getDemoTickets();
      const ticket = tickets.find(t => t.id === Number(ticketId));
      if (ticket) {
        ticket.status = "Resolved";
        ticket.sla_status = "Completed";
        ticket.resolution_record = { ...resolutionData, id: Date.now(), ticket_id: Number(ticketId), resolved_at: new Date().toISOString() };
        ticket.activity_logs.push({
          id: Date.now(),
          ticket_id: Number(ticketId),
          activity: "Ticket Resolved",
          description: `Resolution: ${resolutionData.final_solution.slice(0, 100)}`,
          engineer: "Support Engineer",
          timestamp: new Date().toISOString()
        });
        saveDemoTickets(tickets);
        return ticket.resolution_record;
      }
      throw new Error("Ticket not found");
    }
  },

  escalateTicket: async (ticketId, escalationData) => {
    try {
      return await request(`/tickets/${ticketId}/escalate`, { method: 'POST', body: JSON.stringify(escalationData) });
    } catch (err) {
      const tickets = getDemoTickets();
      const ticket = tickets.find(t => t.id === Number(ticketId));
      if (ticket) {
        ticket.status = "Escalated L2";
        ticket.is_escalated = true;
        ticket.escalation_record = { ...escalationData, id: Date.now(), ticket_id: Number(ticketId), escalated_at: new Date().toISOString() };
        ticket.activity_logs.push({
          id: Date.now(),
          ticket_id: Number(ticketId),
          activity: "Escalated to L2",
          description: `Escalated to ${escalationData.l2_team}. Reason: ${escalationData.reason}`,
          engineer: "Support Engineer",
          timestamp: new Date().toISOString()
        });
        saveDemoTickets(tickets);
        return ticket.escalation_record;
      }
      throw new Error("Ticket not found");
    }
  },

  getEscalationRecommendation: async (ticketId) => {
    try {
      return await request(`/tickets/${ticketId}/escalation-recommendation`);
    } catch (err) {
      const ticket = (getDemoTickets()).find(t => t.id === Number(ticketId));
      if (!ticket) return { should_escalate: false, reason: "", recommended_team: "None" };
      const failed = (ticket.troubleshooting_steps || []).filter(s => s.result === 'Unsuccessful');
      if (failed.length >= 2 || ticket.priority === 'Critical') {
        return {
          should_escalate: true,
          reason: "Recommended Action: Escalate to L2. Multiple troubleshooting steps were unsuccessful.",
          recommended_team: "Network Tier-2"
        };
      }
      return { should_escalate: false, reason: "Troubleshooting still in progress.", recommended_team: "None" };
    }
  },

  getKBArticles: async (filters = {}) => {
    try {
      const query = new URLSearchParams();
      if (filters.search) query.append('search', filters.search);
      if (filters.category) query.append('category', filters.category);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await request(`/knowledge-base${qs}`);
    } catch (err) {
      let list = [...getDemoKB()];
      if (filters.search) {
        const s = filters.search.toLowerCase();
        list = list.filter(k => k.title.toLowerCase().includes(s) || k.problem.toLowerCase().includes(s));
      }
      if (filters.category) list = list.filter(k => k.category === filters.category);
      return list;
    }
  },

  getKBArticle: async (id) => {
    try {
      return await request(`/knowledge-base/${id}`);
    } catch (err) {
      const list = getDemoKB();
      const match = list.find(k => k.id === Number(id));
      if (!match) throw new Error("KB Article not found");
      return match;
    }
  },

  createKBArticle: async (kbData) => {
    try {
      return await request('/knowledge-base', { method: 'POST', body: JSON.stringify(kbData) });
    } catch (err) {
      const list = getDemoKB();
      const newArticle = { ...kbData, id: list.length + 1, created_at: new Date().toISOString() };
      list.unshift(newArticle);
      saveDemoKB(list);
      return newArticle;
    }
  },

  getTroubleshootingAnalytics: async () => {
    try {
      return await request('/analytics/troubleshooting');
    } catch (err) {
      return {
        total_troubleshooting_events: 18,
        most_used_step: "Restart computer/application",
        most_successful_step: "Update/reinstall drivers",
        overall_success_rate: 68.4,
        steps: [
          { step_name: "Restart computer/application", times_used: 7, successful_count: 4, unsuccessful_count: 2, inconclusive_count: 1, success_rate: 57.1 },
          { step_name: "Update/reinstall drivers", times_used: 4, successful_count: 3, unsuccessful_count: 1, inconclusive_count: 0, success_rate: 75.0 },
          { step_name: "Clear cache/temp files", times_used: 3, successful_count: 2, unsuccessful_count: 1, inconclusive_count: 0, success_rate: 66.7 },
          { step_name: "Follow SOP/Knowledge Base", times_used: 2, successful_count: 2, unsuccessful_count: 0, inconclusive_count: 0, success_rate: 100.0 },
          { step_name: "Check IP configuration", times_used: 2, successful_count: 1, unsuccessful_count: 1, inconclusive_count: 0, success_rate: 50.0 }
        ]
      };
    }
  }
};
