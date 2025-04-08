import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getVenueAvailability,
  createAvailability,
} from "../../services/venueServices";
import "./ManageAvailability.css";


const weekdays = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];


const ManageAvailability = () => {
  const { id } = useParams();
  const [availability, setAvailability] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("17:00");
  const [loading, setLoading] = useState(true);
  const [repeatWeekly, setRepeatWeekly] = useState(true);


    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from;

    const handleGoBack = () => {
    if (from === "dashboard") {
        navigate("/dashboard", { state: { tab: "venues" } });
    } else if (from === "details") {
        navigate(`/venues/${id}`);
    } else {
        navigate(-1); // fallback
    }
    };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const data = await getVenueAvailability(id);
      console.log("Availability response:", data);
    //   setAvailability(Array.isArray(data) ? data : []);
    setAvailability(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      console.error("Error fetching availability", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  const handleAddAvailability = async () => {
    try {
      await createAvailability(id, {
        venue: id,
        day_of_week: dayOfWeek,
        opening_time: openingTime,
        closing_time: closingTime,
        is_available: true,
        repeat_weekly: repeatWeekly,
      });
      await fetchAvailability(); // refresh
    } catch (err) {
        if (err.status === 400) {
          alert(err.detail || "This time slot already exists for this venue.");
        } else {
          console.error("Unexpected error:", err);
          alert("Unexpected error. Please try again.");
        }
      }
  };

  return (
    <div className="availability-manager">
        <div style={{ marginBottom: "1rem" }}>
            <button onClick={handleGoBack} className="btn-back">
                ← Back
            </button>
            </div>
      <h2>Manage Venue Availability</h2>

      <div className="availability-form">
        <select
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(Number(e.target.value))}
        >
          {weekdays.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>

        {/* <label>
            <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
            />
            Repeat Weekly
        </label> */}

        <input
          type="time"
          value={openingTime}
          onChange={(e) => setOpeningTime(e.target.value)}
        />
        <span>to</span>
        <input
          type="time"
          value={closingTime}
          onChange={(e) => setClosingTime(e.target.value)}
        />

        <button onClick={handleAddAvailability}>Add Slot</button>
      </div>

      <h3>Current Availability</h3>
      {loading ? (
        <p>Loading...</p>
      ) : availability.length === 0 ? (
        <p>No availability set yet.</p>
      ) : (
        <ul>
          {availability.map((slot) => (
            <li key={slot.id}>
              <strong>{slot.day_name}</strong>: {slot.opening_time}–{slot.closing_time}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageAvailability;
