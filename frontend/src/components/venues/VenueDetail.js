import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { fetchWithAuth, bookVenue } from "../../services/venueServices";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./VenueDetail.css";

const VenueDetail = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slotsForDay, setSlotsForDay] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from;

  useEffect(() => {
    const fetchData = async () => {
      const venueRes = await fetchWithAuth(`/api/v1/venues/${id}/`);
      const availabilityRes = await fetchWithAuth(`/api/v1/venues/${id}/availability/`);
      const bookingsRes = await fetchWithAuth(`/api/v1/venues/${id}/bookings/`);

      const venueData = await venueRes.json();
      const availData = await availabilityRes.json();
      // const bookingData = await bookingsRes.json();

      setVenue(venueData);
      // setAvailability(Array.isArray(availData) ? availData : []);
      setAvailability(Array.isArray(availData) ? availData : availData.results || []);
      // setBookings(Array.isArray(bookingData) ? bookingData.filter(b => b.status === "confirmed") : []);
      
      const res2 = await fetchWithAuth(`/api/v1/venues/${id}/bookings/`);
      const bookingData = await res2.json();
      const bookingsList = Array.isArray(bookingData.results)
        ? bookingData.results
        : []; // fallback to empty array
        console.log("bookingData:", bookingData);
        // setBookings(bookingsList.filter(b => b.status === "confirmed"));
        // setBookings(
        //   bookingData.results
        //     ? bookingData.results.filter(b =>
        //         ["pending", "confirmed"].includes(b.status)
        //       )
        //     : []
        // );
        setBookings((bookingData.results || []).filter(b => b.status === "confirmed" || b.status === "pending"));


          };

    fetchData();
  }, [id]);

  useEffect(() => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const weekday = selectedDate.getDay();

    const dailyAvailability = availability.filter(a =>
      (a.date === dateStr) || (a.day_of_week === weekday && a.repeat_weekly)
    );

    // const bookedRanges = bookings
    //   .filter(b => b.booking_date === dateStr)
    //   .map(b => ({
    //     start: b.start_time.slice(0, 5),
    //     end: b.end_time.slice(0, 5),
    //   }));

    // const slotIsBooked = (start, end) => {
    //   return bookedRanges.some(b => !(end <= b.start || start >= b.end));
    // };
    // const toDate = (timeStr) => {
    //   const [h, m] = timeStr.split(":").map(Number);
    //   const d = new Date();
    //   d.setHours(h, m, 0, 0);
    //   return d;
    // };
    
    // const slotIsBooked = (start, end) => {
    //   const startTime = toDate(start);
    //   const endTime = toDate(end);
    
    //   return bookedRanges.some(b => {
    //     const bookedStart = toDate(b.start);
    //     const bookedEnd = toDate(b.end);
    //     return startTime < bookedEnd && endTime > bookedStart;
    //   });
    // };

    const toDate = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    };
    
    // const slotIsBooked = (start, end) => {
    //   const startTime = toDate(start);
    //   const endTime = toDate(end);
    
    //   return bookings.some(b => {
    //     if (b.booking_date !== selectedDate.toISOString().split("T")[0]) return false;
    //     if (!["pending", "confirmed"].includes(b.status)) return false;
    
    //     const bookedStart = toDate(b.start_time.slice(0, 5));
    //     const bookedEnd = toDate(b.end_time.slice(0, 5));
    //     return startTime < bookedEnd && endTime > bookedStart;
    //   });
    // };
    // const slotIsBooked = (start, end) => {
    //   const [startH, startM] = start.split(":").map(Number);
    //   const [endH, endM] = end.split(":").map(Number);
    
    //   const startTime = new Date(selectedDate);
    //   startTime.setHours(startH, startM, 0, 0);
    
    //   const endTime = new Date(selectedDate);
    //   endTime.setHours(endH, endM, 0, 0);
    
    //   return bookings.some((b) => {
    //     if (b.booking_date !== selectedDate.toISOString().split("T")[0]) return false;
    //     if (!["pending", "confirmed"].includes(b.status)) return false;
    
    //     const [bookedStartH, bookedStartM] = b.start_time.split(":").map(Number);
    //     const [bookedEndH, bookedEndM] = b.end_time.split(":").map(Number);
    
    //     const bookedStart = new Date(selectedDate);
    //     bookedStart.setHours(bookedStartH, bookedStartM, 0, 0);
    
    //     const bookedEnd = new Date(selectedDate);
    //     bookedEnd.setHours(bookedEndH, bookedEndM, 0, 0);
    
    //     return startTime < bookedEnd && endTime > bookedStart;
    //   });
    // };

    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
    
    const slotIsBooked = (start, end) => {
      const selectedDay = selectedDate.toISOString().split("T")[0];
      const slotStart = timeToMinutes(start);
      const slotEnd = timeToMinutes(end);
    
      return bookings.some((b) => {
        if (b.booking_date !== selectedDay) return false;
        const bookedStart = timeToMinutes(b.start_time.slice(0, 5));
        const bookedEnd = timeToMinutes(b.end_time.slice(0, 5));
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });
    };
    
    

    const generateHourlySlots = (startTime, endTime) => {
      const slots = [];
      let [sh, sm] = startTime.split(":").map(Number);
      let [eh, em] = endTime.split(":").map(Number);

      while (sh < eh || (sh === eh && sm < em)) {
        const start = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
        let endHour = sh;
        let endMinute = sm + 60;
        if (endMinute >= 60) {
          endHour += 1;
          endMinute -= 60;
        }
        const end = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

        if (!slotIsBooked(start, end) && end <= `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`) {
          slots.push({ date: dateStr, opening_time: start, closing_time: end });
        }

        sh = endHour;
        sm = endMinute;
      }

      return slots;
    };

    const allSlots = dailyAvailability.flatMap(slot => generateHourlySlots(slot.opening_time, slot.closing_time));

    setSlotsForDay(allSlots);
  }, [selectedDate, availability, bookings]);

  const handleBook = async (slot) => {
    const confirmed = window.confirm(
      `Confirm booking on ${slot.date} from ${slot.opening_time} to ${slot.closing_time}?`
    );
    if (!confirmed) return;

    const res = await bookVenue(id, {
      booking_date: slot.date,
      start_time: slot.opening_time,
      end_time: slot.closing_time,
    });

    alert(res.message || "Booking successful!");

    // Refresh bookings
    const res2 = await fetchWithAuth(`/api/v1/venues/${id}/bookings/`);
    const bookingData = await res2.json();
    // setBookings((bookingData.results || []).filter(b => b.status === "confirmed"));
    setBookings((bookingData.results || []).filter(b => b.status === "confirmed" || b.status === "pending"));

    // setBookings(
    //   bookingData.results
    //     ? bookingData.results.filter(b =>
    //         ["pending", "confirmed"].includes(b.status)
    //       )
    //     : []
    // );
  };

  const handleBack = () => {
    if (from === 'dashboard') {
      navigate('/dashboard', { state: { tab: 'venues' } });
    } else {
      navigate('/venues');
    }
  };

  const getTileClassName = ({ date }) => {
    const dateStr = date.toISOString().split("T")[0];
    const weekday = date.getDay();
    return availability.some(
      a => a.date === dateStr || (a.day_of_week === weekday && a.repeat_weekly)
    )
      ? "available-day"
      : "";
  };

  if (!venue) return <p>Loading...</p>;

  return (
    <div className="venue-detail">
      <button onClick={handleBack} className="btn-secondary">← Back</button>

      <h2>{venue.name}</h2>
      <p>{venue.description}</p>
      <p>Hourly Rate: ${venue.hourly_rate}</p>

      <h3>Select a date to book</h3>
      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        tileClassName={getTileClassName}
      />

      <h4>Available Time Slots for {selectedDate.toISOString().split("T")[0]}</h4>
      {slotsForDay.length > 0 ? (
        slotsForDay.map((slot, idx) => (
          <button key={idx} className="time-slot-btn" onClick={() => handleBook(slot)}>
            {slot.opening_time} - {slot.closing_time}
          </button>
        ))
      ) : (
        <p>No available slots.</p>
      )}

      <h3>Gallery</h3>
      <div className="venue-gallery">
        {venue.images?.length > 0 ? (
          venue.images.map((img) => (
            <img key={img.id} src={img.image} alt={img.caption || "Venue"} />
          ))
        ) : (
          <p>No photos uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default VenueDetail;

// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { fetchWithAuth, bookVenue } from "../../services/venueServices";
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
// import "./VenueDetail.css";

// const VenueDetail = () => {
//   const { id } = useParams();
//   const [venue, setVenue] = useState(null);
//   const [availability, setAvailability] = useState([]);
//   const [booking, setBooking] = useState({ booking_date: "", start_time: "", end_time: "" });
//   const [selectedDate, setSelectedDate] = useState(new Date());

//   useEffect(() => {
//     const fetchVenue = async () => {
//       const res = await fetchWithAuth(`/api/v1/venues/${id}/`);
//       const data = await res.json();
//       setVenue(data);
//     };

//     const fetchAvailability = async () => {
//       const res = await fetchWithAuth(`/api/v1/venues/${id}/availability/`);
//       const data = await res.json();
//       setAvailability(data);
//     };

//     fetchVenue();
//     fetchAvailability();
//   }, [id]);

//   const handleDateSelect = (date) => {
//     const iso = date.toISOString().split("T")[0];
//     setSelectedDate(date);
//     setBooking({ ...booking, booking_date: iso });
//   };

//   const handleBooking = async () => {
//     const result = await bookVenue(id, booking);
//     alert(result.message || "Booking successful!");
//   };

//   const getTileClassName = ({ date }) => {
//     const dateStr = date.toISOString().split("T")[0];
//     return Array.isArray(availability) && availability.some(slot => slot.date === dateStr) ? "available-day" : "";
//   };

//   if (!venue) return <p>Loading...</p>;

//   return (
//     <div className="venue-detail">
//       <h2>{venue.name}</h2>
//       <p>{venue.description}</p>
//       <p>Hourly Rate: ${venue.hourly_rate}</p>

//       <h3>Availability</h3>
//       <Calendar
//         value={selectedDate}
//         onChange={handleDateSelect}
//         tileClassName={getTileClassName}
//       />

//       <div className="booking-form">
//         <h4>Book This Venue</h4>
//         <label>Date: {booking.booking_date}</label>
//         <input type="time" value={booking.start_time} onChange={e => setBooking({ ...booking, start_time: e.target.value })} />
//         <input type="time" value={booking.end_time} onChange={e => setBooking({ ...booking, end_time: e.target.value })} />
//         <button onClick={handleBooking}>Book Venue</button>
//       </div>
//     </div>
//   );
// };

// export default VenueDetail;
