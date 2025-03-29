import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import authService from '../../services/authService';
import './EventDetail.css';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await eventServices.getEventById(id);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. The event may not exist or has been removed.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleAttend = async () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    try {
      setSubmitting(true);
      await eventServices.attendEvent(id);
      
      // Refresh event data
      const updatedEvent = await eventServices.getEventById(id);
      setEvent(updatedEvent);
      
      alert('You have successfully registered for this event!');
    } catch (err) {
      console.error('Error attending event:', err);
      alert(err.message || 'Failed to register for event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAttendance = async () => {
    try {
      setSubmitting(true);
      await eventServices.cancelAttendance(id);
      
      // Refresh event data
      const updatedEvent = await eventServices.getEventById(id);
      setEvent(updatedEvent);
      
      alert('Your registration has been cancelled.');
    } catch (err) {
      console.error('Error cancelling attendance:', err);
      alert(err.message || 'Failed to cancel registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    
    if (!comment.trim()) return;
    
    try {
      setSubmitting(true);
      await eventServices.addEventComment(id, comment);
      
      // Refresh event data to show new comment
      const updatedEvent = await eventServices.getEventById(id);
      setEvent(updatedEvent);
      setComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.message || 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatEventDate = (date, time) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading event details...</div>;
  }

  if (error) {
    return (
      <div className="event-detail-container">
        <div className="error-message">{error}</div>
        <Link to="/events" className="btn-primary">Back to Events</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-container">
        <div className="error-message">Event not found</div>
        <Link to="/events" className="btn-primary">Back to Events</Link>
      </div>
    );
  }

  return (
    <div className="event-detail-container">
      <div className="event-detail-header">
        <h1>{event.title}</h1>
        <div className="event-meta">
          <div className="event-categories">
            {event.categories && event.categories.map(cat => (
              <span key={cat.id} className="event-category">{cat.name}</span>
            ))}
          </div>
          <div className="event-status">
            Status: <span className={`status-${event.status}`}>{event.status}</span>
          </div>
        </div>
      </div>

      <div className="event-detail-content">
        <div className="event-main-info">
          {event.image && (
            <div className="event-image">
              <img src={event.image} alt={event.title} />
            </div>
          )}

          <div className="event-info-section">
            <h2>About this event</h2>
            <p className="event-description">{event.description}</p>
          </div>

          <div className="event-info-section">
            <h2>Attendees</h2>
            <p>
              {event.attendees_count || 0} {event.attendees_count === 1 ? 'person' : 'people'} are attending
              {event.capacity !== null && ` (Capacity: ${event.capacity})`}
            </p>
          </div>

          {isAuthenticated && (
            <div className="event-info-section">
              <h2>Comments</h2>
              {event.comments && event.comments.length > 0 ? (
                <div className="event-comments">
                  {event.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="comment-author">{comment.user?.username || comment.user?.email || 'Anonymous'}</span>
                        <span className="comment-date">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No comments yet. Be the first to comment!</p>
              )}

              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting || !comment.trim()}
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="event-sidebar">
          <div className="event-actions">
            {isAuthenticated ? (
              event.is_attending ? (
                <button 
                  onClick={handleCancelAttendance} 
                  className="btn-secondary"
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Cancel Registration'}
                </button>
              ) : (
                <button 
                  onClick={handleAttend} 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Register for Event'}
                </button>
              )
            ) : (
              <Link to={`/login?redirect=/events/${id}`} className="btn-primary">
                Login to Register
              </Link>
            )}

            {isAuthenticated && event.organizer && event.organizer.id === authService.getCurrentUser()?.id && (
              <Link to={`/events/${id}/edit`} className="btn-secondary">
                Edit Event
              </Link>
            )}
          </div>

          <div className="event-details-card">
            <div className="detail-item">
              <i className="icon-calendar"></i>
              <div>
                <strong>Start</strong>
                <p>{formatEventDate(event.start_date, event.start_time)}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <i className="icon-calendar-end"></i>
              <div>
                <strong>End</strong>
                <p>{formatEventDate(event.end_date, event.end_time)}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <i className="icon-location"></i>
              <div>
                <strong>Location</strong>
                <p>{event.venue ? event.venue.name : event.address}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <i className="icon-price"></i>
              <div>
                <strong>Price</strong>
                <p>{event.is_free ? 'Free' : `$${event.price}`}</p>
              </div>
            </div>
            
            <div className="detail-item">
              <i className="icon-organizer"></i>
              <div>
                <strong>Organizer</strong>
                <p>{event.organizer?.username || event.organizer?.email || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;