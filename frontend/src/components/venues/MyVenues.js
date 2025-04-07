import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../services/venueServices";
import { Link } from "react-router-dom";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { AiFillPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { AiFillPlusCircle } from 'react-icons/ai';
import { useNavigate } from "react-router-dom";
import './MyVenues.css';

const MyVenues = () => {
  const [venues, setVenues] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user info
    fetchWithAuth("/api/v1/users/me/")
      .then((res) => res.json())
      .then((data) => {
        setUserId(data.id);
      });
  }, []);

  // useEffect(() => {
  //   if (!userId) return;
  //   fetchWithAuth(`/api/v1/venues/?owner=${userId}`)
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setVenues(data);
  //       setLoading(false);
  //     });
  // }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchWithAuth(`/api/v1/venues/?owner=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched venues:", data); 
        setVenues(Array.isArray(data) ? data : data.results || []);  
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch venues:", err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <p>Loading your venues...</p>;

  const toggleVenueStatus = async (venueId, currentStatus) => {
    try {
      const res = await fetchWithAuth(`/api/v1/venues/${venueId}/toggle_active/`, {
        method: "POST"
      });
  
      if (res.ok) {
        // Fetch the full updated venue details
        const venueRes = await fetchWithAuth(`/api/v1/venues/${venueId}/`);
        const fullVenue = await venueRes.json();
  
        // Replace the old venue with the updated one
        setVenues((prev) =>
          prev.map((v) => (v.id === fullVenue.id ? fullVenue : v))
        );
      } else {
        console.error("Failed to toggle venue status");
      }
    } catch (err) {
      console.error("Error toggling venue status", err);
    }
  };

  // const toggleVenueStatus = async (venueId, currentStatus) => {
  //   try {
  //     // const res = await fetchWithAuth(`/api/v1/venues/${venueId}/`, {
  //     //   method: "PATCH",
  //     //   headers: { "Content-Type": "application/json" },
  //     //   body: JSON.stringify({ is_active: !currentStatus }),
  //     // });
  //     const res = await fetchWithAuth(`/api/v1/venues/${venueId}/toggle_active/`, {
  //       method: "POST"
  //     });
  
  //     if (res.ok) {
  //       const updatedVenue = await res.json();
  //       setVenues((prev) =>
  //         prev.map((v) => (v.id === updatedVenue.id ? updatedVenue : v))
  //       );
  //     } else {
  //       console.error("Failed to toggle venue status");
  //     }
  //   } catch (err) {
  //     console.error("Error toggling venue status", err);
  //   }
  // };
  
  return (
    <div>
      <h2>Your Venues</h2>
      {venues.length === 0 ? (
        <div className="empty-state">
          <p>You haven't listed any venues yet.</p>
          <Link to="/create-venue" className="btn-primary">List a Venue</Link>
        </div>
      ) : (
        <div className="dashboard-events">
          {venues.map((venue) => (
            <div key={venue.id} className="dashboard-event-card">
              <div className="event-details">
                <h3>{venue.name}</h3>
                <p>{venue.city}, {venue.state}</p>
                {!venue.is_active && (
                  <p style={{ color: "red", fontWeight: "bold" }}>Inactive</p>
                )}
              </div>
              <div className="event-actions">
                {/* <Link to={`/venues/${venue.id}`} className="btn-secondary">View</Link> */}
                <Link
                  to={`/venues/${venue.id}`}
                  state={{ from: 'dashboard' }}
                  className="btn-secondary"
                >
                  View
                </Link>

                <button
                  className="btn-secondary"
                  onClick={() => toggleVenueStatus(venue.id, venue.is_active)}
                >
                  {venue.is_active ? "Deactivate" : "Activate"}
                </button>

                {/* "Manage Availability" button here */}
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/venues/${venue.id}/manage-availability`)}
                >
                  Manage Availability
                </button>
              </div>
            </div>
          ))}
  
          {/* Add Venue Card */}
          {/* <div className="dashboard-event-card add-venue-card">
            <div className="event-details">
              <h3>List a New Venue</h3>
              <p>Make your venue available for booking!</p>
            </div>
            <div className="event-actions">
              <Link to="/create-venue" className="btn-primary">List a Venue</Link>
            </div>
          </div> */}
          <div className="dashboard-event-card add-venue-card">
            <Link to="/create-venue" className="add-venue-link">
              <AiFillPlusCircle size={50} className="add-venue-icon" />
              <p className="add-venue-text">List a Venue</p>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
  

  // return (
  //   <div>
  //     <h2>Your Venues</h2>
  //     {venues.length === 0 ? (
  //       <div className="empty-state">
  //         <p>You haven't listed any venues yet.</p>
  //         <Link to="/create-venue" className="btn-primary">List a Venue</Link>
  //       </div>
  //     ) : (
  //       <div className="dashboard-events">
  //         {venues.map((venue) => (
  //           <div key={venue.id} className="dashboard-event-card">
  //             <div className="event-details">
  //               <h3>{venue.name}</h3>
  //               <p>{venue.city}, {venue.state}</p>
  //               {!venue.is_active && (
  //                 <p style={{ color: "red", fontWeight: "bold" }}>Inactive</p>
  //               )}
  //             </div>
  //             <div className="event-actions">
  //               <Link to={`/venues/${venue.id}`} className="btn-secondary">View</Link>
  //               <button
  //                 className="btn-secondary"
  //                 onClick={() => toggleVenueStatus(venue.id, venue.is_active)}
  //               >
  //                 {venue.is_active ? "Deactivate" : "Activate"}
  //               </button>
  //             </div>
  //           </div>
  //         ))}

  //       </div>
  //     )}
  //   </div>
  // );
};

export default MyVenues;

// import React, { useEffect, useState } from "react";
// import { fetchWithAuth } from "../../services/venueServices";

// const MyVenues = () => {
//   const [venues, setVenues] = useState([]);

//   useEffect(() => {
//     fetchWithAuth("/api/v1/venues/?owner=true")
//       .then(res => res.json())
//       .then(data => setVenues(data));
//   }, []);

//   return (
//     <div>
//       <h2>My Venues</h2>
//       {venues.map(venue => (
//         <div key={venue.id}>
//           <h3>{venue.name}</h3>
//           <p>{venue.city}, {venue.state}</p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default MyVenues;