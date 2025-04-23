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

// Get a user's ticket for an event
export const getMyTicket = async (eventId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to get ticket');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/my_ticket/`);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw error;
  }
};

// Remove an attendee from an event (organizer only)
export const removeAttendee = async (eventId, attendeeId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to remove attendee');
    }
    
    await apiRequest(`${API_URL}/api/v1/events/${eventId}/remove_attendee/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendee_id: attendeeId })
    });
    
    return true;
  } catch (error) {
    console.error('Error removing attendee:', error);
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

// Get all attendees for an event (organizer only)
export const getEventAttendees = async (eventId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to view attendees');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/attendees/`);
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    throw error;
  }
};

// Image upload functions

// Get all images for an event
export const getEventImages = async (eventId) => {
  try {
    const data = await apiRequest(`${API_URL}/api/v1/events/${eventId}/images/`);
    
    // Make sure we always return an array
    if (Array.isArray(data)) {
      return data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else {
      console.warn('API returned unexpected format for event images', data);
      return []; // Return empty array as fallback
    }
  } catch (error) {
    console.error('Error fetching event images:', error);
    return []; // Return empty array on error
  }
};

// Upload a new image for an event
export const uploadEventImage = async (eventId, imageFile, caption = '', isPrimary = false) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to upload images');
    }
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    if (caption) {
      formData.append('caption', caption);
    }
    
    formData.append('is_primary', isPrimary ? 'true' : 'false');
    
    console.log('Uploading image with FormData:', 
      Object.fromEntries(formData.entries()));
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/images/`, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
};

// Delete an event image
export const deleteEventImage = async (eventId, imageId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to delete images');
    }
    
    await apiRequest(`${API_URL}/api/v1/events/${eventId}/images/${imageId}/delete-image/`, {
      method: 'DELETE'
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting event image:', error);
    throw error;
  }
};

// Set an image as primary
export const setPrimaryImage = async (eventId, imageId) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to update images');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/images/${imageId}/set-primary/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
};

// Update image caption
export const updateImageCaption = async (eventId, imageId, caption) => {
  try {
    if (!authService.isAuthenticated()) {
      throw new Error('Authentication required to update images');
    }
    
    return await apiRequest(`${API_URL}/api/v1/events/${eventId}/images/${imageId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption })
    });
  } catch (error) {
    console.error('Error updating image caption:', error);
    throw error;
  }
};