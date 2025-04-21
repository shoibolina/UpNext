import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  fetchWithAuth,
  getVenueAvailability,
} from "../../services/venueServices";
import "./BookVenueForm.css";

const BookVenueForm = ({ venueId }) => {
  const id = venueId;
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(0);

  const getBookingEndpoint = async ({ forBooking = false } = {}) => {
    const venueRes = await fetchWithAuth(`/api/v1/venues/${id}/`);
    const venueData = await venueRes.json();

    const token = localStorage.getItem("token");
    const base64 = token?.split(".")[1];
    const payload = base64 ? JSON.parse(atob(base64)) : null;
    const currentUserId = payload?.user_id;

    if (forBooking) {
      return `/api/v1/venues/${id}/bookings/`; // POST to this endpoint
    }

    return `/api/v1/venues/${id}/all-bookings/`; // Always fetch all for slot rendering
  };

  const fetchConfirmedBookings = async () => {
    try {
      const res = await fetchWithAuth(`/api/v1/venues/${id}/all-bookings/`);
      const data = await res.json();
      // Only keep confirmed bookings
      return Array.isArray(data.results)
        ? data.results.filter(b => b.status === "confirmed")
        : Array.isArray(data)
          ? data.filter(b => b.status === "confirmed")
          : [];
    } catch (err) {
      console.error("Error fetching confirmed bookings:", err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const availabilityData = await getVenueAvailability(id);
        setAvailability(Array.isArray(availabilityData.results) ? availabilityData.results : []);

        const venueRes = await fetchWithAuth(`/api/v1/venues/${id}/`);
        const venueData = await venueRes.json();
        setHourlyRate(parseFloat(venueData.hourly_rate));

        // Always fetch all bookings to correctly hide booked slots
        const bookingsEndpoint = await getBookingEndpoint({ forBooking: false });
        const bookingRes = await fetchWithAuth(bookingsEndpoint);
        const bookingData = await bookingRes.json();
        const confirmed = await fetchConfirmedBookings();
        setBookings(confirmed);
      } catch (error) {
        console.error("Error fetching availability/bookings", error);
      }
    };

    fetchData();
  }, [id]);


  useEffect(() => {
    const weekday = (selectedDate.getDay() + 6) % 7; // 0 = Monday, ... 6 = Sunday
    const slots = [];

    const dayAvailability = availability.find(a => a.day_of_week === weekday);
    if (!dayAvailability) return;

    const opening = parseTime(dayAvailability.opening_time);
    const closing = parseTime(dayAvailability.closing_time);

    const booked = bookings
      .filter(b => b.booking_date === selectedDate.toISOString().split("T")[0]
        && b.status === "confirmed"
      )
      .map(b => ({
        start: parseTime(b.start_time),
        end: parseTime(b.end_time),
      }));

    for (let start = opening; start + 60 <= closing; start += 60) {
      const end = start + 60;
      const isOverlapping = booked.some(
        b => !(end <= b.start || start >= b.end)
      );

      if (!isOverlapping) {
        slots.push({
          start,
          end,
          label: `${formatTime(start)} - ${formatTime(end)}`,
        });
      }
    }


    setTimeSlots(slots);
  }, [selectedDate, availability, bookings]);

  const totalPrice = selectedSlots.length * hourlyRate;

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const toggleSlotSelection = (slot) => {
    const exists = selectedSlots.find(s => s.start === slot.start && s.end === slot.end);

    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => s.start !== slot.start));
    } else {
      if (selectedSlots.length >= 3) {
        alert("You can select a maximum of 3 hours.");
        return;
      }

      const allSelected = [...selectedSlots, slot].sort((a, b) => a.start - b.start);
      const isConsecutive = allSelected.every((s, i, arr) =>
        i === 0 || s.start === arr[i - 1].end
      );

      if (!isConsecutive) {
        alert("Selected time slots must be consecutive.");
        return;
      }

      setSelectedSlots(allSelected);
    }
  };

  const buildTimeSlots = (bookingList = bookings) => {
    const weekday = (selectedDate.getDay() + 6) % 7;
    const slots = [];

    const dayAvailability = availability.find(a => a.day_of_week === weekday);
    if (!dayAvailability) return;

    const opening = parseTime(dayAvailability.opening_time);
    const closing = parseTime(dayAvailability.closing_time);

    const booked = bookingList
      .filter(b =>
        b.booking_date === selectedDate.toISOString().split("T")[0] &&
        b.status === "confirmed"
      )
      .map(b => ({
        start: parseTime(b.start_time),
        end: parseTime(b.end_time),
      }));

    for (let start = opening; start + 60 <= closing; start += 60) {
      const end = start + 60;
      const isOverlapping = booked.some(
        b => !(end <= b.start || start >= b.end)
      );

      if (!isOverlapping) {
        slots.push({
          start,
          end,
          label: `${formatTime(start)} - ${formatTime(end)}`,
        });
      }
    }

    setTimeSlots(slots);
  };



  const handleBooking = async () => {
    if (!selectedSlots.length) return alert("Please select time slots.");

    const start = selectedSlots[0].start;
    const end = selectedSlots[selectedSlots.length - 1].end;

    try {
      const postEndpoint = await getBookingEndpoint({ forBooking: true });

      const response = await fetchWithAuth(postEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: selectedDate.toISOString().split("T")[0],
          start_time: formatTime(start),
          end_time: formatTime(end),
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.non_field_errors?.[0] || data?.detail || "Booking failed");

      alert(`Booking successful! Total price: $${data.total_price}`);
      setBookingSuccess(true);

      // Re-fetch ALL bookings after creating
      const bookingsEndpoint = await getBookingEndpoint({ forBooking: false });
      const bookingRes = await fetchWithAuth(bookingsEndpoint);
      const bookingData = await bookingRes.json();
      const updatedBookings = Array.isArray(bookingData.results) ? bookingData.results : [];
      setBookings(updatedBookings);

      setTimeout(() => {
        buildTimeSlots(updatedBookings);
      }, 0);

      setSelectedSlots([]);
      //   buildTimeSlots();
      //   setTimeout(() => setBookingSuccess(false), 1000);
    } catch (err) {
      alert(err.message);
    }
  };



  return (
    <div className="booking-form">
      <h3>Book This Venue</h3>
      <div style={{ marginBottom: "1rem" }}>
        {/* <Calendar onChange={setSelectedDate} value={selectedDate} /> */}
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileDisabled={({ date }) => {
            const weekday = (date.getDay() + 6) % 7;
            const allowedDays = availability.map((a) => a.day_of_week);
            return !allowedDays.includes(weekday); // Disable if not in availability
          }}
        />
      </div>

      {timeSlots.length > 0 ? (
        <div>
          <h4>Available Time Slots for {selectedDate.toDateString()}</h4>
          <ul className="timeslot-list">
            {timeSlots.map((slot, idx) => {
              const isSelected = selectedSlots.some(s => s.start === slot.start && s.end === slot.end);
              return (
                <li
                  key={idx}
                  className={`timeslot ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleSlotSelection(slot)}
                >
                  {slot.label}
                </li>
              );
            })}
          </ul>

          {selectedSlots.length > 0 && (
            <p>
              <strong>Total Price:</strong> ${totalPrice.toFixed(2)}
            </p>
          )}

          {!bookingSuccess ? (
            <button onClick={handleBooking} disabled={!selectedSlots.length}>
              Confirm Booking
            </button>
          ) : (
            <div className="post-booking-buttons">
              <button onClick={() => navigate(`/venues/${id}`)}>Go to Venue Detail</button>
              <button onClick={() => navigate("/dashboard", { state: { tab: "bookings" } })}>
                View My Bookings
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>No available slots for this date.</p>
      )}
    </div>
  );
};

export default BookVenueForm;