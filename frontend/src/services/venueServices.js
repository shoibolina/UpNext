export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("accessToken");
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };
  
  export const createVenue = async (venueData) => {
    const formData = new FormData();
    for (const key in venueData) {
      formData.append(key, venueData[key]);
    }
    const response = await fetchWithAuth("/api/v1/venues/", {
      method: "POST",
      body: formData,
    });
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