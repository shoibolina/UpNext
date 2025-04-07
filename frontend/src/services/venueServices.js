const API_BASE_URL = "http://localhost:8000";  // Django backend URL

export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
};


// export const fetchWithAuth = async (url, options = {}) => {
//     const token = localStorage.getItem("accessToken");
//     return fetch(url, {
//       ...options,
//       headers: {
//         ...(options.headers || {}),
//         Authorization: Bearer ${token},
//       },
//     });
//   };
  
  // export const createVenue = async (venueData) => {
  //   const formData = new FormData();
  //   for (const key in venueData) {
  //     formData.append(key, venueData[key]);
  //   }
  //   const response = await fetchWithAuth("/api/v1/venues/", {
  //     method: "POST",
  //     body: formData,
  //   });

  //   if (!response.ok) {
  //     const errorData = await response.json();
  //     console.error("Venue creation failed:", errorData);
  //     throw new Error("Venue creation failed: " + JSON.stringify(errorData));
  //   }
  
  //   return response.json();
  // };

  export const createVenue = async (venueData) => {
    const formData = new FormData();
  
    // backend infers owner from the token
    const { owner, category_ids, amenity_ids, ...rest } = venueData;
  
    for (const key in rest) {
      formData.append(key, rest[key]);
    }
  
    category_ids.forEach(id => formData.append('category_ids', id));
    amenity_ids.forEach(id => formData.append('amenity_ids', id));
  
    const response = await fetchWithAuth("/api/v1/venues/", {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Venue creation failed:", errorData);
      throw new Error("Venue creation failed: " + JSON.stringify(errorData));
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

  export const toggleVenueActive = async (venueId) => {
    const response = await fetchWithAuth(`/api/v1/venues/${venueId}/toggle_active/`, {
      method: "POST",
    });
    return response.json();
  };

// export const fetchWithAuth = async (url, options = {}) => {
//     const token = localStorage.getItem("accessToken");
//     return fetch(url, {
//       ...options,
//       headers: {
//         ...(options.headers || {}),
//         Authorization: `Bearer ${token}`,
//       },
//     });
//   };
  
//   export const createVenue = async (venueData) => {
//     const formData = new FormData();
//     for (const key in venueData) {
//       formData.append(key, venueData[key]);
//     }
//     const response = await fetchWithAuth("/api/v1/venues/", {
//       method: "POST",
//       body: formData,
//     });
//     return response.json();
//   };
  
//   export const uploadVenueImage = async (venueId, imageData) => {
//     const formData = new FormData();
//     for (const key in imageData) {
//       formData.append(key, imageData[key]);
//     }
//     const response = await fetchWithAuth(`/api/v1/venues/${venueId}/images/`, {
//       method: "POST",
//       body: formData,
//     });
//     return response.json();
//   };
  
//   export const createAvailability = async (venueId, slotData) => {
//     const response = await fetchWithAuth(`/api/v1/venues/${venueId}/availability/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(slotData),
//     });
//     return response.json();
//   };
  
//   export const bookVenue = async (venueId, bookingData) => {
//     const response = await fetchWithAuth(`/api/v1/venues/${venueId}/bookings/`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(bookingData),
//     });
//     return response.json();
//   };

export const getMyVenues = async (userId) => {
  const res = await fetchWithAuth(`/api/v1/venues/?owner=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch venues");
  return res.json(); // Must return a list
};

 
  