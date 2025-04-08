import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyVenueBookings,
  cancelVenueBooking,
} from "../../services/venueServices";
import authService from "../../services/authService";
import "./MyBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);

  const fetchUserAndBookings = async () => {
    try {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            const data = await getMyVenueBookings();
            setBookings(data);
        } catch (err) {
            setError("Failed to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserAndBookings();
    }, []);

  const handleCancel = async (id) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmCancel) return;

    try {
      await cancelVenueBooking(id);
      alert("Booking cancelled successfully.");
      fetchUserAndBookings(); // Refresh
    } catch (err) {
      alert("Could not cancel booking. Please try again.");
    }
  };

  if (loading) return <p>Loading your bookings...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (bookings.length === 0) return <p>You have no bookings yet.</p>;

  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>
      <div className="booking-grid">
      {bookings.map((b) => (
        <div key={b.id} className="booking-card">
          <h3>{b.venue?.name}</h3>
          {b.venue?.owner?.id === b.booker?.id && (
            <span className="owner-badge">Owner</span>
          )}
          <p>
            <strong>Date:</strong> {b.booking_date}
          </p>
          <p>
            <strong>Time:</strong> {b.start_time} - {b.end_time}
          </p>
          <p>
            <strong>Total Price:</strong> ${b.total_price}
          </p>
          <p><strong>Booked by:</strong> {b.booker?.username}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={b.status === "cancelled" ? "cancelled" : "confirmed"}>
              {b.status}
            </span>
          </p>

          <div className="booking-actions">
            <Link to={`/venues/${b.venue?.id}`} className="btn-secondary">
              View Venue
            </Link>

            {b.status === "confirmed" && b.booker?.id === currentUser.id &&  (
              <button className="btn-danger" onClick={() => handleCancel(b.id)}>
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default MyBookings;