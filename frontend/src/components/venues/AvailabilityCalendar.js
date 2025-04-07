import React, { useMemo } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const AvailabilityCalendar = ({ availability = [], bookings = [], onSelectSlot }) => {
  const events = useMemo(() => {
    const availEvents = availability.map((slot, i) => ({
      id: `avail-${i}`,
      title: "Available",
      start: new Date(`${slot.date}T${slot.opening_time}`),
      end: new Date(`${slot.date}T${slot.closing_time}`),
      type: "available",
    }));

    const bookingEvents = bookings.map((booking, i) => ({
      id: `booked-${i}`,
      title: "Booked",
      start: new Date(`${booking.booking_date}T${booking.start_time}`),
      end: new Date(`${booking.booking_date}T${booking.end_time}`),
      type: "booked",
    }));

    return [...availEvents, ...bookingEvents];
  }, [availability, bookings]);

  const eventStyleGetter = (event) => {
    const backgroundColor = event.type === "booked" ? "#ff4d4f" : "#52c41a"; // red or green
    return {
      style: {
        backgroundColor,
        color: "white",
        borderRadius: "4px",
        border: "none",
        padding: "2px",
        fontSize: "0.85rem",
        textAlign: "center"
      },
    };
  };

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      views={[Views.WEEK]}
      defaultView={Views.WEEK}
      step={30}
      timeslots={2}
      min={new Date(0, 0, 0, 8, 0)}    // 8 AM
      max={new Date(0, 0, 0, 22, 0)}   // 10 PM
      style={{ height: 500 }}
      selectable
      onSelectSlot={onSelectSlot}
      eventPropGetter={eventStyleGetter}
    />
  );
};

export default AvailabilityCalendar;
