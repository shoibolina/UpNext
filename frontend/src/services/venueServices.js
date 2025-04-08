const BASE_URL = "http://localhost:8000";

export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    console.log("Sending token:", token);
    return fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };
  
  export const createVenue = async (venueData) => {
    const response = await fetchWithAuth("/api/v1/venues/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venueData),
    });
  
    if (!response.ok) {
      const errorText = await response.text(); // debugging
      throw new Error(errorText || "Failed to create venue.");
    }
  
    return response.json();
  };
  
  
  export const uploadVenueImage = async (venueId, imageData) => {
    const formData = new FormData();
    for (const key in imageData) {
      formData.append(key, imageData[key]);
    }
    const response = await fetchWithAuth(`/api/v1/venues/${venueId}/images/`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  };
  
  export const createAvailability = async (venueId, slotData) => {
    const response = await fetchWithAuth(`/api/v1/venues/${venueId}/availability/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slotData),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error("Availability creation failed");
      error.status = response.status;
      error.detail = errorData?.non_field_errors?.[0] || errorData?.detail || "Unknown error";
      throw error;
    }
  
    return response.json();
  };
  
  export const bookVenue = async (venueId, bookingData) => {
    const response = await fetchWithAuth(`/api/v1/venues/${venueId}/bookings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    });
    return response.json();
  };
  
  export const getMyVenues = async () => {
    const res = await fetchWithAuth("/api/v1/venues/my/");
    if (!res.ok) throw new Error("Failed to fetch your venues");
    return await res.json();
  };
  
  
  export const toggleVenueActive = async (id) => {
    const res = await fetchWithAuth(`/api/v1/venues/${id}/toggle_active/`, {
      method: "PATCH",
    });
    return await res.json();
  };
  
  export const getVenueCategories = async () => {
    const res = await fetch("http://localhost:8000/api/v1/venue-categories/");
    const data = await res.json();
    return data.results; 
    // return await res.json();
  };
  
  export const getVenueAmenities = async () => {
    const res = await fetch("http://localhost:8000/api/v1/venue-amenities/");
    // return await res.json();
    const data = await res.json();
    return data.results; 
  };

  export const getVenueAvailability = async (venueId) => {
    const res = await fetchWithAuth(`/api/v1/venues/${venueId}/availability/`);
    return await res.json();
  };  

  export const getVenueBookings = async (venueId, date) => {
    const res = await fetchWithAuth(`/api/v1/venues/${venueId}/bookings/?date=${date}`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return await res.json();
  };

  export const getMyVenueBookings = async () => {
    const res = await fetchWithAuth("/api/v1/venue-bookings/my/");
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : data;
  };
  
  export const cancelVenueBooking = async (bookingId) => {
    const res = await fetchWithAuth(`/api/v1/venue-bookings/${bookingId}/cancel/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to cancel booking");
    return res.json();
  };
  
  