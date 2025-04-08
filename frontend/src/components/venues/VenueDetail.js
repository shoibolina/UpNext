import React, { useEffect, useState } from "react";
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
        className="btn-secondary"
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
      <p><strong>Capacity:</strong> {venue.capacity}</p>
      <p><strong>Rate:</strong> ${venue.hourly_rate}/hr</p>
      <p><strong>Owner:</strong> {venue.owner?.username}</p>
      {/* Only show to owner */}
      {venue.owner?.id === currentUser?.id && (
        <Link to={`/venues/${venue.id}/availability`} state={{ from: "details" }} className="btn-secondary">
          Manage Availability
        </Link>
      )}

      {/* Categories */}
      <div className="venue-section">
        <h3>Categories</h3>
        <ul>
          {venue.categories.map((cat) => (
            <li key={cat.id}>{cat.name}</li>
          ))}
        </ul>
      </div>

      {/* Amenities */}
      <div className="venue-section">
        <h3>Amenities</h3>
        <ul>
          {venue.amenities.map((a) => (
            <li key={a.id}>{a.name}</li>
          ))}
        </ul>
      </div>

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

      {/* Availability */}
      <div className="venue-section">
        <h3>Weekly Availability</h3>
        <ul>
          {venue.availability.map((slot) => (
            <li key={slot.id}>
              <strong>{slot.day_name}:</strong> {slot.opening_time} – {slot.closing_time}
            </li>
          ))}
        </ul>
      </div>

      {/* Reviews */}
      <div className="venue-section">
        <h3>Reviews</h3>
        {venue.reviews.length === 0 ? (
          <p>No reviews yet.</p>
        ) : (
          <ul>
            {venue.reviews.map((review) => (
              <li key={review.id}>
               {review.rating} – <em>{review.comment}</em> (by {review.user.username})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Booking Placeholder */}
      <div className="venue-section">
      <div className="venue-section">
        <BookVenueForm venueId={venue.id} />
      </div>
      </div>
    </div>
  );
};

export default VenueDetail;