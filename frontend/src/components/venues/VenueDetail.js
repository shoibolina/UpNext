import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchWithAuth, getVenueDetail } from "../../services/venueServices";
import authService from "../../services/authService";
import "./VenueDetail.css";
import BookVenueForm from "./BookVenueForm";


const VenueDetail = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const bookingRef = useRef();

useEffect(() => {
  const fetchUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };
  fetchUser();
}, []);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        const res = await fetchWithAuth(`/api/v1/venues/${id}/`);
        const data = await res.json();
        setVenue(data);
      } catch (err) {
        console.error("Failed to fetch venue details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  if (loading) return <div>Loading venue details...</div>;
  if (!venue) return <div>Venue not found.</div>;

  

  return (
    <div className="venue-detail-container">
      <button
        className="btn-back"
        onClick={() => {
          if (location.state?.from === "dashboard") {
            navigate("/dashboard", { state: { tab: "venues" } });
          } else {
            navigate("/venues");
          }
        }}
      >
        ← Back
      </button>

      <h1>{venue.name}</h1>
      <div className="venue-header">
      {/* Left column: */}
      <div className="venue-left">
        <p className="venue-address">
          {venue.address}, {venue.city}, {venue.state} {venue.zip_code}, {venue.country}
        </p>

        {/* Primary image */}
        {venue.primary_image && venue.primary_image.image ? (
          <img
            src={`http://localhost:8000${venue.primary_image?.image}`}
            alt={venue.primary_image.caption || 'Venue Image'}
            style={{ maxWidth: '100%', height: '250px', borderRadius: '8px' }}
          />
        ) : (
          <p>No image available</p>
        )}

        <p className="venue-description">{venue.description}</p>

        {/* Amenities */}
        <div className="venue-col">
          <h3>Amenities</h3>
          <p className="amenities-line">
            {venue.amenities.map((a, idx) => (
              <span key={a.id}>
                {a.name}
                {idx < venue.amenities.length - 1 && " | "}
              </span>
            ))}
          </p>
        </div>

        {/* Categories */}
        <div className="venue-col">
          <h3>Categories</h3>
          <ul>
            {venue.categories.map((cat) => (
              <li key={cat.id}>{cat.name}</li>
            ))}
          </ul>
        </div>
      </div> {/* Left column ends*/}

      {/* Right column:*/}
      <div className="venue-right">
        <p><strong>Capacity:</strong> {venue.capacity}</p>
        <p><strong>Rate:</strong> ${venue.hourly_rate}/hr</p>
        <p><strong>Owner:</strong> {venue.owner?.username}</p>

        {/* Availability */}
        <div className="venue-col">
          <h3>Weekly Availability</h3>
          <ul>
            {venue.availability.map((slot) => (
              <li key={slot.id}>
                <strong>{slot.day_name}:</strong> {slot.opening_time} – {slot.closing_time}
              </li>
            ))}
          </ul>
        </div>

        <div className="venue-button-group">
          {/* Only show to owner */}
          {venue.owner?.id === currentUser?.id && (
              <>
                <Link to={`/venues/${venue.id}/edit`} className="btn-secondary">
                  Edit Venue
                </Link>
                <Link to={`/venues/${venue.id}/availability`} state={{ from: "details" }} className="btn-secondary">
                  Manage Availability
                </Link>
              </>
            )}
            <button className="btn-primary" onClick={() => bookingRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Book This Venue
            </button>
          </div>

      </div> {/* Right column ends*/}
      </div> {/* Header ends*/}

      {/* Additional Images */}
      {venue.images?.length > 1 && (
        <div className="venue-section">
          <h3>Gallery</h3>
          <div className="image-gallery">
            {venue.images.map((img) =>
              !img.is_primary ? (
                <img
                  key={img.id}
                  src={img.image}
                  alt={img.caption || "Venue image"}
                  className="gallery-image"
                />
              ) : null
            )}
          </div>
        </div>
      )}


      {/* Booking Placeholder */}
      <div className="venue-section">
      <div className="venue-section" ref={bookingRef}>
        <BookVenueForm venueId={venue.id} />
      </div>
      </div>
    </div>
  );
};

export default VenueDetail;