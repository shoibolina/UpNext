import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/venueServices";
import { useNavigate } from "react-router-dom";
// import "./MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      const res = await fetchWithAuth("/api/v1/bookings/");
      const data = await res.json();
      setBookings(data);
    };

    fetchBookings();
  }, []);

  const handleGoToVenue = (venueId) => {
    navigate(`/venues/${venueId}`, { state: { from: "bookings" } });
  };

  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <h4>{b.venue.name}</h4>
              <p>
                {b.booking_date} from {b.start_time} to {b.end_time}
              </p>
              <p>Status: {b.status}</p>
              <p>Total Price: ${b.total_price}</p>
              <button onClick={() => handleGoToVenue(b.venue.id)}>View Venue</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
