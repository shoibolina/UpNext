import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import * as eventServices from '../../services/eventServices';
import './Dashboard.css';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }
        
        setLoading(true);
        const user = await authService.getCurrentUser();
        setUserData(user);
        
        // Fetch user's events
        const organizedEvents = await eventServices.getEvents({ organizer: user.id });
        setMyEvents(organizedEvents);
        
        // Fetch events user is attending
        const events = await eventServices.getEvents();
        const attending = events.filter(event => event.is_attending);
        setAttendingEvents(attending);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Format date for display
  const formatEventDate = (startDate, startTime) => {
    if (!startDate || !startTime) return '';
    
    try {
      const date = new Date(`${startDate}T${startTime}`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return `${startDate}`;
    }
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  if (!userData) {
    return <div className="error">Unable to load user data. Please login again.</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Dashboard</h1>
        <div className="dashboard-welcome">
          <span>Welcome, {userData.first_name || userData.username}!</span>
        </div>
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          My Events
        </button>
        <button 
          className={`tab-button ${activeTab === 'attending' ? 'active' : ''}`}
          onClick={() => setActiveTab('attending')}
        >
          Attending
        </button>
        {userData.is_venue_owner && (
          <button 
            className={`tab-button ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveTab('venues')}
          >
            My Venues
          </button>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-content">
        {activeTab === 'events' && (
          <div className="dashboard-section">
            <h2>Events You're Organizing</h2>
            {myEvents.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any events yet.</p>
                <Link to="/create-event" className="btn-primary">Create Event</Link>
              </div>
            ) : (
              <div className="dashboard-events">
                {myEvents.map(event => (
                  <div key={event.id} className="dashboard-event-card">
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p className="event-date">{formatEventDate(event.start_date, event.start_time)}</p>
                      <p className="event-status">Status: <span className={`status-${event.status}`}>{event.status}</span></p>
                      {event.attendees_count !== undefined && (
                        <p className="event-attendees">{event.attendees_count} attendees</p>
                      )}
                    </div>
                    <div className="event-actions">
                      <Link to={`/events/${event.id}`} className="btn-secondary">View</Link>
                      <Link to={`/events/${event.id}/edit`} className="btn-secondary">Edit</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'attending' && (
          <div className="dashboard-section">
            <h2>Events You're Attending</h2>
            {attendingEvents.length === 0 ? (
              <div className="empty-state">
                <p>You're not registered for any events yet.</p>
                <Link to="/events" className="btn-primary">Explore Events</Link>
              </div>
            ) : (
              <div className="dashboard-events">
                {attendingEvents.map(event => (
                  <div key={event.id} className="dashboard-event-card">
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p className="event-date">{formatEventDate(event.start_date, event.start_time)}</p>
                      <p className="event-organizer">By: {event.organizer?.username || "Unknown"}</p>
                    </div>
                    <div className="event-actions">
                      <Link to={`/events/${event.id}`} className="btn-secondary">View</Link>
                      <button 
                        className="btn-secondary btn-cancel"
                        onClick={async () => {
                          try {
                            await eventServices.cancelAttendance(event.id);
                            setAttendingEvents(attendingEvents.filter(e => e.id !== event.id));
                          } catch (err) {
                            setError('Failed to cancel registration');
                          }
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'venues' && (
          <div className="dashboard-section">
            <h2>Your Venues</h2>
            <div className="empty-state">
              <p>You haven't listed any venues yet.</p>
              <Link to="/create-venue" className="btn-primary">List a Venue</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;