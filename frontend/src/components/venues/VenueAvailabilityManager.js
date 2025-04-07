import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { fetchWithAuth } from "../../services/venueServices";
import "./VenueDetail.css";

const VenueAvailabilityManager = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("17:00");

  useEffect(() => {
    const fetchAvailability = async () => {
      const res = await fetchWithAuth(`/api/v1/venues/${id}/availability/`);
      const data = await res.json();
    //   setSlots(Array.isArray(data) ? data : []);
    setSlots(Array.isArray(data) ? data : data.results || []);
    };
    fetchAvailability();
  }, [id]);

  const handleSave = async () => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const dayOfWeek = selectedDate.getDay();

    const isDuplicate = slots.some(
      s =>
        s.date === dateStr &&
        s.opening_time === openingTime &&
        s.closing_time === closingTime
    );

    if (isDuplicate) {
      alert("This slot already exists.");
      return;
    }

    const response = await fetchWithAuth(`/api/v1/venues/${id}/availability/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        day_of_week: dayOfWeek,
        opening_time: openingTime,
        closing_time: closingTime,
        repeat_weekly: false,
        is_available: true,
      }),
    });

    if (response.ok) {
      alert("Availability slot saved.");
      const refreshed = await fetchWithAuth(`/api/v1/venues/${id}/availability/`);
      const updated = await refreshed.json();
    //   setSlots(updated);
    setSlots(Array.isArray(updated) ? updated : updated.results || []);
    } else {
      alert("Error saving slot.");
    }
  };

  return (
    <div className="venue-detail">
      <button onClick={() => navigate("/dashboard", { state: { tab: "venues" } })} className="btn-secondary">
        ← Back to My Venues
      </button>

      <h2>Manage Availability</h2>

      <h4>Select a date</h4>
      <Calendar value={selectedDate} onChange={setSelectedDate} />

      <div className="time-inputs">
        <label>
          Opening Time:
          <input
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
          />
        </label>
        <label>
          Closing Time:
          <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
          />
        </label>
      </div>

      <button onClick={handleSave} className="btn-primary">
        Save Availability
      </button>

      <h4>Saved Slots</h4>
      <ul>
        {slots.map((slot, idx) => (
          <li key={idx}>
            {slot.date || `Every ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slot.day_of_week]}`} —{" "}
            {slot.opening_time} to {slot.closing_time}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VenueAvailabilityManager;