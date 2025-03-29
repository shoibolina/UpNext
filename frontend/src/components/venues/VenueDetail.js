import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth, bookVenue } from "../../services/venueServices";

const VenueDetail = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [booking, setBooking] = useState({ booking_date: "", start_time: "", end_time: "" });

  useEffect(() => {
    fetchWithAuth(`/api/v1/venues/${id}/`)
      .then(res => res.json())
      .then(data => setVenue(data));
  }, [id]);

  const handleBooking = async () => {
    const result = await bookVenue(id, booking);
    alert(result.message || "Booking successful!");
  };

  if (!venue) return <p>Loading...</p>;

  return (
    <div>
      <h2>{venue.name}</h2>
      <p>{venue.description}</p>
      <p>Hourly Rate: ${venue.hourly_rate}</p>
      <input type="date" onChange={e => setBooking({ ...booking, booking_date: e.target.value })} />
      <input type="time" onChange={e => setBooking({ ...booking, start_time: e.target.value })} />
      <input type="time" onChange={e => setBooking({ ...booking, end_time: e.target.value })} />
      <button onClick={handleBooking}>Book Venue</button>
    </div>
  );
};

export default VenueDetail;