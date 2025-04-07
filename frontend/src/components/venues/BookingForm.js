import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchWithAuth } from "../../services/venueServices";

const BookingForm = ({ venueId, hourlyRate, minBookingHours }) => {
  const [bookingDate, setBookingDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [status, setStatus] = useState(null);

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!bookingDate || !startTime || !endTime) {
      setStatus({ type: "error", message: "Please fill in all fields." });
      return;
    }

    const payload = {
      booking_date: bookingDate.toISOString().split("T")[0],
      start_time: startTime.toTimeString().slice(0, 5),
      end_time: endTime.toTimeString().slice(0, 5),
    };

    try {
      const res = await fetchWithAuth(`/api/v1/venues/${venueId}/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: "Booking successful!" });
      } else {
        setStatus({ type: "error", message: data.detail || JSON.stringify(data) });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Something went wrong." });
    }
  };

  return (
    <form onSubmit={handleBooking} className="booking-form">
      <h3>Book This Venue</h3>
      <label>
        Date:
        <DatePicker selected={bookingDate} onChange={setBookingDate} dateFormat="yyyy-MM-dd" />
      </label>
      <label>
        Start Time:
        <DatePicker
          selected={startTime}
          onChange={setStartTime}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={30}
          timeCaption="Start Time"
          dateFormat="HH:mm"
        />
      </label>
      <label>
        End Time:
        <DatePicker
          selected={endTime}
          onChange={setEndTime}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={30}
          timeCaption="End Time"
          dateFormat="HH:mm"
        />
      </label>

      <button type="submit" className="btn-primary">Submit Booking</button>

      {status && (
        <p className={status.type === "success" ? "success-msg" : "error-msg"}>
          {status.message}
        </p>
      )}
    </form>
  );
};

export default BookingForm;
