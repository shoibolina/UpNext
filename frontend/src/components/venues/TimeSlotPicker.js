import React, { useState } from "react";

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const generateHourlySlots = (start, end) => {
  const slots = [];
  let current = toMinutes(start);
  const endMinutes = toMinutes(end);

  while (current + 60 <= endMinutes) {
    const s = current;
    const e = current + 60;
    const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
    slots.push({ start_time: fmt(s), end_time: fmt(e) });
    current = e;
  }

  return slots;
};

const TimeSlotPicker = ({ bookingDate, availability, bookings, onSelect }) => {
  const [selectedStart, setSelectedStart] = useState(null);
  const slot = availability.find((a) => a.date === bookingDate);

  if (!slot) return <p>No availability for this day.</p>;

  const bookedTimes = bookings
    .filter((b) => b.booking_date === bookingDate)
    .map((b) => ({
      start: toMinutes(b.start_time),
      end: toMinutes(b.end_time),
    }));

  const isBooked = (s, e) => {
    return bookedTimes.some((b) => s < b.end && e > b.start);
  };

  const slots = generateHourlySlots(slot.opening_time, slot.closing_time);

  const handleClick = (s) => {
    if (!selectedStart) {
      setSelectedStart(s);
    } else {
      const s1 = toMinutes(selectedStart.start_time);
      const s2 = toMinutes(s.start_time);

      const startMin = Math.min(s1, s2);
      const endMin = Math.max(toMinutes(selectedStart.end_time), toMinutes(s.end_time));

      // Check overlap in the selected range
      const hasConflict = bookedTimes.some((b) => startMin < b.end && endMin > b.start);
      if (hasConflict) {
        alert("Selected range overlaps with existing booking.");
        setSelectedStart(null);
        return;
      }

      const fmt = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      onSelect({ start_time: fmt(startMin), end_time: fmt(endMin) });
      setSelectedStart(null);
    }
  };

  return (
    <div className="time-slots">
      <h4>Choose Start & End Time for {bookingDate}</h4>
      {slots.map((s, idx) => {
        const sMin = toMinutes(s.start_time);
        const eMin = toMinutes(s.end_time);
        const isDisabled = isBooked(sMin, eMin);

        return (
          <button
            key={idx}
            className={`time-slot-btn ${isDisabled ? "disabled" : ""}`}
            onClick={() => !isDisabled && handleClick(s)}
            disabled={isDisabled}
          >
            {s.start_time} – {s.end_time}
          </button>
        );
      })}
      {selectedStart && <p>Selected Start: {selectedStart.start_time}</p>}
    </div>
  );
};

export default TimeSlotPicker;