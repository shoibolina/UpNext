import authService from './authService';

const API_URL = 'http://127.0.0.1:8000';

// Helper function to handle API requests with token refresh
const apiRequest = async (url, options = {}) => {
  try {
    // Try to refresh token if needed
    await authService.refreshTokenIfNeeded();
    
    // Get fresh token
    const token = authService.getToken();
    
    // Set authorization header if token exists
    const headers = {
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    // Make the request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle 401 errors after token refresh attempt
    if (response.status === 401) {
      // If we're still getting 401 after refresh, user needs to login
      authService.logout();
      throw new Error('Your session has expired. Please log in again.');
    }
    
    // Handle other errors
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData;
      
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { detail: await response.text() };
      }
      
      const errorMsg = errorData.detail || 'API request failed';
      throw new Error(errorMsg);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};

// Get all events (with optional filters)
export const getEvents = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const data = await apiRequest(
      `${API_URL}/api/v1/events/?${queryParams.toString()}`
    );
    
    // Handle both paginated and non-paginated responses
    if (data.results && Array.isArray(data.results)) {
      return data.results; // Return just the array of events
    } else if (Array.isArray(data)) {
      return data; // Already an array, return it directly
    } else {
      console.warn('API returned unexpected format for events', data);
      return []; // Return empty array as fallback
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Get a single event by ID
export const getEventById = async (eventId) => {
  try {
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/`);
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to create an event');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (eventId, eventData) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to update an event');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to delete an event');
    }
    
    await apiRequest(`${API_URL}/api/v1/events/${eventId}/`, {
      method: 'DELETE'
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Register for an event
export const attendEvent = async (eventId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to register for an event');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/attend/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};

// Register for an event with ticket
export const registerWithTicket = async (eventId, ticketType = 'standard') => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to register for an event');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/register_with_ticket/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_type: ticketType })
    });
  } catch (error) {
    console.error('Error registering for event with ticket:', error);
    throw error;
  }
};

// Cancel registration for an event
export const cancelAttendance = async (eventId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to cancel registration');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/cancel/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error cancelling registration:', error);
    throw error;
  }
};

// Add a comment to an event
export const addEventComment = async (eventId, content) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to add a comment');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/comment/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get all event categories
export const getEventCategories = async () => {
  try {
    return await apiRequest(`${API_URL}/api/v1/event-categories/`);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};