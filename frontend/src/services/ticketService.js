import authService from './authService';

const API_URL = 'http://127.0.0.1:8000';

// Generate a ticket for an event
export const generateTicket = async (eventId, ticketType = 'standard') => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to register for event');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/register_with_ticket/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ticket_type: ticketType })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || 'Failed to generate ticket');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating ticket:', error);
    throw error;
  }
};

// Get ticket for current user by event ID
export const getMyTicketForEvent = async (eventId) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/my_ticket/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 404) {
      return null; // No ticket found
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch ticket');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

// Get all tickets for an event (organizer only)
export const getEventTickets = async (eventId) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/attendee_tickets/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch tickets');
    }
    
    const data = await response.json();
    
    // Handle both paginated and non-paginated responses
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('API returned unexpected format for tickets', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching event tickets:', error);
    throw error;
  }
};

// Get all tickets for the current user
export const getMyTickets = async () => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/v1/tickets/my_tickets/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch tickets');
    }
    
    const data = await response.json();
    
    // Handle both paginated and non-paginated responses
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      console.warn('API returned unexpected format for tickets', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

// Verify a ticket by ticket number
export const verifyTicket = async (ticketNumber, location = '') => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to verify tickets');
    }
    
    const response = await fetch(`${API_URL}/api/v1/ticket-verifications/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ticket_number: ticketNumber,
        verification_location: location
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || 'Failed to verify ticket');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying ticket:', error);
    throw error;
  }
};

// Verify a ticket by QR code
export const verifyTicketByQR = async (qrData, location = '') => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to verify tickets');
    }
    
    const response = await fetch(`${API_URL}/api/v1/ticket-verifications/verify_by_qr/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        qr_data: qrData,
        verification_location: location
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || 'Failed to verify ticket');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error verifying ticket by QR:', error);
    throw error;
  }
};

// Cancel a ticket
export const cancelTicket = async (ticketId) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${API_URL}/api/v1/tickets/${ticketId}/cancel/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to cancel ticket');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error cancelling ticket:', error);
    throw error;
  }
};