import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { getMyVenues, toggleVenueActive } from "../../services/venueServices";
import "./MyVenues.css";

const MyVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  console.log("Venue list:", venues);

  const fetchVenues = async () => {
    try {
      const data = await getMyVenues();
      setVenues(data);
    } catch (err) {
      console.error("Failed to load my venues", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleToggle = async (id) => {
    console.log("Toggling venue:", id);
    try {
      await toggleVenueActive(id);
      fetchVenues(); // Refresh list
    } catch (err) {
      console.error("Error toggling venue", err);
    }
  };

  if (loading) return <p>Loading your venues...</p>;

  return (
    <div className="my-venues-container">
      <h1>My Venues</h1>
      <div className="venue-grid">
        {venues.length === 0 ? (
          <p>You haven't added any venues yet.</p>
        ) : (
          venues.map((venue) => (
            <div className="venue-card" key={venue.id}>
              <h3>{venue.name}</h3>
              <p>{venue.city}, {venue.state}</p>
              <p>Capacity: {venue.capacity}</p>
              <p>Rate: ${venue.hourly_rate}/hr</p>
              <p>Status: 
                <strong style={{ color: venue.is_active ? "green" : "red" }}>
                  {venue.is_active ? " Active" : " Inactive"}
                </strong>
              </p>
              <button onClick={() => handleToggle(venue.id)} className="btn-secondary">
                {venue.is_active ? "Deactivate" : "Activate"}
              </button>
              <Link to={`/venues/${venue.id}/availability`} state={{ from: "dashboard" }} className="btn-secondary">
                Manage Availability
              </Link>
              <Link to={`/venues/${venue.id}`} state={{ from: "dashboard" }} className="btn-secondary">
                View Details
              </Link>
            </div>
          ))
        )}
        <Link to="/create-venue" className="venue-card add-venue-card">
          <div className="add-venue-content">
            <div className="add-icon">+</div>
            <p className="add-text">List a Venue</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default MyVenues;