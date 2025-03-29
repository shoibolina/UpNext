import authService from './authService';

const API_URL = 'http://127.0.0.1:8000';

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
    
    const token = authService.getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(
      `${API_URL}/api/v1/events/?${queryParams.toString()}`, 
      { headers }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch events');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Get a single event by ID
export const getEventById = async (eventId) => {
  try {
    const token = authService.getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(
      `${API_URL}/api/v1/events/${eventId}/`, 
      { headers }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to create an event');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    
    // First try to parse the response as JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get text
      data = { detail: await response.text() };
    }
    
    if (!response.ok) {
      // Create a meaningful error message from the response data
      let errorMessage = 'Failed to create event';
      
      if (data.detail) {
        errorMessage = data.detail;
      } else if (typeof data === 'object') {
        // Collect all error messages from the response
        const errors = [];
        for (const key in data) {
          if (Array.isArray(data[key])) {
            errors.push(`${key}: ${data[key].join(', ')}`);
          } else {
            errors.push(`${key}: ${data[key]}`);
          }
        }
        errorMessage = errors.join('; ');
      }
      
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (eventId, eventData) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to update an event');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to delete an event');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete event');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Register for an event
export const attendEvent = async (eventId) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to register for an event');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/attend/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to register for event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};

// Cancel registration for an event
export const cancelAttendance = async (eventId) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to cancel registration');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/cancel/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to cancel registration');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error cancelling registration:', error);
    throw error;
  }
};

// Add a comment to an event
export const addEventComment = async (eventId, content) => {
  try {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required to add a comment');
    }
    
    const response = await fetch(`${API_URL}/api/v1/events/${eventId}/comment/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add comment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get all event categories
export const getEventCategories = async () => {
  try {
    const token = authService.getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(
      `${API_URL}/api/v1/event-categories/`, 
      { headers }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch categories');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

