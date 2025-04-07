import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { fetchWithAuth, bookVenue } from "../../services/venueServices";

const localizer = momentLocalizer(moment);

const VenueBookingCalendar = ({ venueId }) => {
  const [events, setEvents] = useState([]);

  const fetchData = async () => {
    const res1 = await fetchWithAuth(`/api/v1/venues/${venueId}/availability/`);
    const res2 = await fetchWithAuth(`/api/v1/venues/${venueId}/bookings/`);
    const availability = await res1.json();
    const bookings = await res2.json();

    const availableEvents = availability.map((slot, idx) => ({
      id: `a-${idx}`,
      title: "Available",
      start: new Date(`${slot.date}T${slot.opening_time}`),
      end: new Date(`${slot.date}T${slot.closing_time}`),
      allDay: false,
      type: "available",
    }));

    const bookedEvents = bookings.map((booking, idx) => ({
      id: `b-${idx}`,
      title: "Booked",
      start: new Date(`${booking.booking_date}T${booking.start_time}`),
      end: new Date(`${booking.booking_date}T${booking.end_time}`),
      allDay: false,
      type: "booked",
    }));

    setEvents([...availableEvents, ...bookedEvents]);
  };

  useEffect(() => {
    fetchData();
  }, [venueId]);

  const handleSelectSlot = async ({ start, end }) => {
    const date = moment(start).format("YYYY-MM-DD");
    const startTime = moment(start).format("HH:mm");
    const endTime = moment(end).format("HH:mm");

    const confirm = window.confirm(`Book this venue on ${date} from ${startTime} to ${endTime}?`);
    if (!confirm) return;

    const res = await bookVenue(venueId, {
      booking_date: date,
      start_time: startTime,
      end_time: endTime,
    });

    if (res?.message) {
      alert(res.message);
      fetchData(); // refresh calendar
    } else {
      alert("Booking failed");
    }
  };

  const eventStyleGetter = (event) => {
    let style = {
      backgroundColor: event.type === "booked" ? "#e74c3c" : "#2ecc71", // red & green
      borderRadius: "5px",
      opacity: 0.9,
      color: "white",
      border: "0px",
      display: "block",
    };
    return { style };
  };

  return (
    <div style={{ height: "600px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="day"
        views={["day", "week", "month"]}
        selectable
        onSelectSlot={handleSelectSlot}
        eventPropGetter={eventStyleGetter}
        startAccessor="start"
        endAccessor="end"
      />
    </div>
  );
};

export default VenueBookingCalendar;
