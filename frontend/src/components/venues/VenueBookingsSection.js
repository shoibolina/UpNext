import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './VenueBookingsSection.css';

const VenueBookingsSection = ({ bookings, currentUser }) => {
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const [showContactFor, setShowContactFor] = useState(null);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

    

    const handleCancelBooking = async (bookingId) => {
        const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
        if (!confirmCancel) return;
    
        try {
        const res = await fetch(`http://localhost:8000/api/v1/bookings/${bookingId}/cancel/`, {
            method: "POST",
            headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    
        const data = await res.json();
        if (res.ok) {
            alert("Booking cancelled.");
            window.location.reload();
        } else {
            alert(data.message || "Failed to cancel booking.");
        }
        } catch (err) {
        console.error(err);
        alert("Error cancelling booking.");
        }
    };
    

//   const handleCancelBooking = async (venueId, bookingId) => {
//     const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
//     if (!confirmCancel) return;

//     try {
//     //   const res = await fetch(`http://localhost:8000/api/v1/venues/${venueId}/bookings/${bookingId}/cancel/`, {
//     //     method: "POST",
//     //     headers: {
//     //       "Authorization": `Bearer ${localStorage.getItem("token")}`,
//     //     }
//     //   });
//         const res = await fetch(`http://localhost:8000/api/v1/bookings/${booking.id}/cancel/`, {
//             method: "POST",
//             headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             },
//         });

//       const data = await res.json();
//       if (res.ok) {
//         alert("Booking cancelled.");
//         window.location.reload();
//       } else {
//         alert(data.message || "Failed to cancel booking.");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Error cancelling booking.");
//     }
//   };

  if (!confirmedBookings.length) {
    return <div className="dashboard-section">You don't have any confirmed bookings yet.</div>;
  }

  return (
    <div className="dashboard-section">
      <h2>My Bookings</h2>
      <div className="booking-grid">
        {confirmedBookings.map((booking) => {
          const isOwner = booking?.venue?.owner?.id === currentUser?.id;

          return (
            <div className="booking-card-wrapper" key={booking.id}>
              {isOwner && <div className="owner-badge">Owner</div>}

              <div className="booking-card">
                <p><strong>Venue:</strong>{' '}
                  {booking.venue ? (
                    <Link to={`/venues/${booking.venue.id}`} className="venue-link">
                      {booking.venue.name}
                    </Link>
                  ) : "Unnamed Venue"}
                </p>
                <p><strong>Date:</strong> {formatDate(booking.booking_date)}</p>
                <p><strong>Time:</strong> {booking.start_time} – {booking.end_time}</p>
                <p><strong>Status:</strong>{' '}
                  <span className={`status-${booking.status}`}>{booking.status}</span>
                </p>
                <p><strong>Total Price:</strong> ${booking.total_price}</p>
                <p><strong>Booked by:</strong> {booking.booker?.first_name || booking.booker?.username}</p>

                {booking.booker?.id === currentUser.id && (
                  <button
                    className="btn-cancel-booking"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}

                <button
                className="btn-contact-owner"
                onClick={() => setShowContactFor(showContactFor === booking.id ? null : booking.id)}
                >
                {showContactFor === booking.id ? "Hide Contact" : "Contact Owner"}
                </button>

                {showContactFor === booking.id && (
                <div className="owner-contact">
                    <p><strong>Email:</strong> {booking.venue?.owner?.email || "N/A"}</p>
                    {booking.venue?.owner?.profile?.phone_number && (
                    <p><strong>Phone:</strong> {booking.venue.owner.profile.phone_number}</p>
                    )}
                </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VenueBookingsSection;


// import React from 'react';
// import './VenueBookingsSection.css';

// const VenueBookingsSection = ({ bookings, currentUser }) => {
//   const confirmedBookings = bookings
//   .filter
//   (
//     booking => booking.status === 'confirmed'
//   );

//   if (!confirmedBookings.length) {
//     return <div className="dashboard-section">You don't have any confirmed bookings yet.</div>;
//   }
//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };
// //   console.log("Bookings:", bookings);

//   return (
//     <div className="dashboard-section">
//       <h2>My Bookings</h2>
//       <div className="booking-grid">
//         {confirmedBookings.map((booking) => {
//           const isOwner = booking?.venue?.owner?.id === currentUser?.id;

//           return (
//             <div className="booking-card-wrapper">
//                 {isOwner && <div className="owner-badge">Owner</div>}
//                 <div className="booking-card" key={booking.id}>
//                     <p><strong>Venue:</strong> {booking.venue?.name || "Unnamed Venue"}</p>
//                     <p><strong>Date:</strong> {formatDate(booking.booking_date)}</p>
//                     <p><strong>Time:</strong> {booking.start_time} – {booking.end_time}</p>
//                     <p><strong>Status:</strong> <span className={`status-${booking.status}`}>{booking.status}</span></p>
//                     <p><strong>Total Price:</strong> ${booking.total_price}</p>
//                     {booking.booker && (
//                         <p><strong>Booked by:</strong> {booking.booker.first_name || booking.booker.username}</p>
//                     )}
//                     {booking.venue?.owner?.id === currentUser.id && (
//                         <span className="owner-badge">Owner</span>
//                     )}
//                 {/* {isOwner && <div className="owner-label">Owner</div>}
//                 <p><strong>Date:</strong> {new Date(booking.booking_date).toLocaleDateString()}</p>
//                 <p><strong>Time:</strong> {booking.start_time} – {booking.end_time}</p>
//                 <p><strong>Status:</strong> <span className={`status-${booking.status}`}>{booking.status}</span></p>
//                 <p><strong>Total Price:</strong> ${booking.total_price}</p> */}
//                 </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default VenueBookingsSection;


// // import React from 'react';
// // import './VenueBookingsSection.css'; // Optional CSS file for custom styles

// // const VenueBookingsSection = ({ bookings, currentUser }) => {
// //   return (
// //     <div className="dashboard-section">
// //       <h2>My Bookings</h2>
// //       {bookings.length === 0 ? (
// //         <div className="empty-state">
// //           <p>You don't have any bookings yet.</p>
// //         </div>
// //       ) : (
// //         <div className="booking-cards">
// //           {bookings.map((booking) => {
// //             const isOwner = booking?.venue?.owner?.id === currentUser?.id;

// //             return (
// //               <div className="booking-card" key={booking.id}>
// //                 <div className="booking-header">
// //                   <h3>{booking.venue.name}</h3>
// //                   {isOwner && <span className="badge-owner">Your Venue</span>}
// //                 </div>
// //                 <p><strong>Date:</strong> {new Date(booking.booking_date).toLocaleDateString()}</p>
// //                 <p><strong>Time:</strong> {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}</p>
// //                 <p><strong>Status:</strong> <span className={`status-label status-${booking.status}`}>{booking.status}</span></p>
// //                 <p><strong>Total Price:</strong> ${parseFloat(booking.total_price).toFixed(2)}</p>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default VenueBookingsSection;


// // // VenueBookingsSection.js
// // import React from 'react';
// // import { format } from 'date-fns';

// // const VenueBookingsSection = ({ bookings, currentUser }) => {
// //   if (!bookings.length) {
// //     return <p>You don't have any bookings yet.</p>;
// //   }

// //   return (
// //     <div className="dashboard-section">
// //       <h2>My Bookings</h2>
// //       {bookings.map((booking) => (
// //         <div key={booking.id} className="booking-card">
// //           <p><strong>Venue:</strong> {booking.venue?.name}</p>
// //           <p><strong>Date:</strong> {format(new Date(booking.booking_date), 'PPP')}</p>
// //           <p><strong>Time:</strong> {booking.start_time} – {booking.end_time}</p>
// //           <p><strong>Status:</strong> {booking.status}</p>
// //           <p><strong>Total Price:</strong> ${booking.total_price}</p>

// //           {booking.booker && booking.booker.id !== currentUser.id && (
// //             <p><strong>Booked by:</strong> {booking.booker.username}</p>
// //           )}
// //         </div>
// //       ))}
// //     </div>
// //   );
// // };

// // export default VenueBookingsSection;
