import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import authService from '../../services/authService';
import './BookmarkedEvents.css';

function BookmarkedEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/bookmarks' } });
      return;
    }

    const fetchBookmarkedEvents = async () => {
      try {
        setLoading(true);
        const data = await eventServices.getBookmarkedEvents();
        
        // Handle pagination data structure
        if (data.results) {
          setEvents(data.results);
          setTotalEvents(data.count || data.results.length);
        } else {
          setEvents(data);
          setTotalEvents(data.length);
        }
      } catch (err) {
        console.error('Error fetching bookmarked events:', err);
        setError('Failed to load your favorite events. ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedEvents();
  }, [navigate]);

  const handleRemoveBookmark = async (eventId) => {
    try {
      await eventServices.bookmarkEvent(eventId);
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      setTotalEvents(prev => prev - 1);
    } catch (err) {
      console.error('Error removing bookmark:', err);
      alert('Failed to remove from favorites. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading favorite events...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="bookmarked-events-container">
      <h1>My Favorite Events</h1>
      <p className="events-count">{totalEvents} saved event{totalEvents !== 1 ? 's' : ''}</p>

      {events.length === 0 ? (
        <div className="no-events">
          <p>You haven't added any events to your favorites yet.</p>
          <Link to="/events" className="btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event.id} className="event-card">
              {event.image ? (
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                </div>
              ) : (
                <div className="event-image no-image">
                  <div className="placeholder-image">No Image</div>
                </div>
              )}
              <div className="event-info">
                <h3>{event.title}</h3>
                <p className="event-date">
                  {new Date(event.start_date).toLocaleDateString()}
                  {event.start_time && <span> at {event.start_time}</span>}
                </p>
                <p className="event-location">
                  {event.venue ? event.venue.name : event.address}
                </p>
                <div className="event-status">
                  {event.is_free ? (
                    <span className="free-tag">Free</span>
                  ) : (
                    <span className="price-tag">${event.price}</span>
                  )}
                  {event.status !== 'published' && (
                    <span className="status-tag">{event.status}</span>
                  )}
                </div>
                <div className="event-card-actions">
                  <Link to={`/events/${event.id}`} className="btn-view">
                    View Details
                  </Link>
                  <button 
                    className="btn-remove" 
                    onClick={() => handleRemoveBookmark(event.id)}
                    aria-label="Remove from favorites"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookmarkedEvents;