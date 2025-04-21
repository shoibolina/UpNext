import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import * as ticketService from '../../services/ticketService';
import authService from '../../services/authService';
import Ticket from '../tickets/Ticket';
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
  const [ticket, setTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketError, setTicketError] = useState(null);

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

  // Fetch ticket if user is registered
  useEffect(() => {
    const fetchTicket = async () => {
      if (isAuthenticated && id && event?.is_attending) {
        try {
          setTicketLoading(true);
          const ticketData = await ticketService.getMyTicketForEvent(id);
          setTicket(ticketData);
        } catch (err) {
          console.log('No ticket found or error fetching ticket');
        } finally {
          setTicketLoading(false);
        }
      }
    };

    fetchTicket();
  }, [id, isAuthenticated, event?.is_attending]);

  const handleAttend = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    try {
      setSubmitting(true);
      setTicketError(null);

      const response = await ticketService.generateTicket(id);

      const updatedEvent = await eventServices.getEventById(id);
      setEvent(updatedEvent);

      if (response.ticket) {
        setTicket(response.ticket);
        setShowTicket(true);
      }

      alert('You have successfully registered for this event!');
    } catch (err) {
      console.error('Error attending event:', err);
      setTicketError(err.message || 'Failed to register for event');
      alert(err.message || 'Failed to register for event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAttendance = async () => {
    try {
      setSubmitting(true);
      await eventServices.cancelAttendance(id);

      const updatedEvent = await eventServices.getEventById(id);
      setEvent(updatedEvent);
      setTicket(null);
      setShowTicket(false);

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

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }

    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      await eventServices.addEventComment(id, comment);

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

  const handleViewTicket = () => {
    setShowTicket(true);
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
  };

  const handleVerifyTickets = () => {
    navigate(`/ticket-verification/${id}`);
  };

  const handleShareEvent = () => {
    // Get the current user from the cached user data
    const currentUser = authService.getCurrentUserSync();
    const fullName = currentUser
      ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
      : 'N/A';
    // Use your existing formatEventDate helper to get a nicely formatted start date and time
    const formattedDate = formatEventDate(event.start_date, event.start_time);

    // Build the share text. Window.location.href gives the current event info page url
    const shareText = `${fullName} is inviting you to take a look at ${event.title} on ${formattedDate}. Check it out here: ${window.location.href}`;

    // Copy text to clipboard
    navigator.clipboard.writeText(shareText)
      .then(() => {
        alert("Share text copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy text. Please try manually.");
      });
  };

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

  // Use the synchronous version to get the current user
  const isOrganizer = event?.organizer && authService.getCurrentUserSync()?.id === event.organizer.id;

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
      {showTicket && ticket && (
        <div className="ticket-modal">
          <div className="ticket-modal-content">
            <button className="close-button" onClick={handleCloseTicket}>&times;</button>
            <Ticket ticket={ticket} event={event} />
          </div>
        </div>
      )}

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
                        <span className="comment-author">
                          {comment.user?.username || comment.user?.email || 'Anonymous'}
                        </span>
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
              isOrganizer ? (
                <>
                  <Link to={`/events/${id}/edit`} className="btn-secondary">
                    Edit Event
                  </Link>
                  <button className="btn-primary" onClick={handleVerifyTickets}>
                    Verify Tickets
                  </button>
                </>
              ) : event.is_attending ? (
                <>
                  <button
                    onClick={handleCancelAttendance}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : 'Cancel Registration'}
                  </button>
                  {ticket && (
                    <button
                      className="btn-primary"
                      onClick={handleViewTicket}
                      disabled={ticketLoading}
                    >
                      {ticketLoading ? 'Loading...' : 'View Ticket'}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleAttend}
                  className="btn-primary"
                  disabled={submitting || event.status !== 'published'}
                >
                  {submitting ? 'Processing...' : 'Register for Event'}
                </button>
              )
            ) : (
              <Link to={`/login?redirect=/events/${id}`} className="btn-primary">
                Login to Register
              </Link>
            )}
            <button className="btn-secondary" onClick={handleShareEvent}>
              Share Event
            </button>
          </div>

          {ticketError && <div className="ticket-error-message">{ticketError}</div>}

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
