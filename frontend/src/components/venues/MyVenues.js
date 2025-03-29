import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/venueServices";

const MyVenues = () => {
  const [venues, setVenues] = useState([]);

  useEffect(() => {
    fetchWithAuth("/api/v1/venues/?owner=true")
      .then(res => res.json())
      .then(data => setVenues(data));
  }, []);

  return (
    <div>
      <h2>My Venues</h2>
      {venues.map(venue => (
        <div key={venue.id}>
          <h3>{venue.name}</h3>
          <p>{venue.city}, {venue.state}</p>
        </div>
      ))}
    </div>
  );
};

export default MyVenues;