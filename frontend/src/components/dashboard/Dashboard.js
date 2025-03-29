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
    const fetchData = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        const user = await authService.getCurrentUser();
        setUserData(user);

        const [organizedEvents, allEvents] = await Promise.all([
          eventServices.getEvents({ organizer: user.id }),
          eventServices.getEvents()
        ]);

        setMyEvents(organizedEvents);
        setAttendingEvents(allEvents.filter(event => event.is_attending));
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCancelAttendance = async (eventId) => {
    try {
      await eventServices.cancelAttendance(eventId);
      setAttendingEvents(prev => prev.filter(e => e.id !== eventId));
    } catch {
      setError('Failed to cancel registration.');
    }
  };

  const formatEventDate = (startDate, startTime) => {
    if (!startDate || !startTime) return '';
    try {
      const date = new Date(`${startDate}T${startTime}`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return startDate;
    }
  };

  if (loading) return <div className="loading">Loading your dashboard...</div>;
  if (!userData) return <div className="error">Unable to load user data. Please login again.</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Your Dashboard</h1>
        <span className="dashboard-welcome">Welcome, {userData.first_name || userData.username}!</span>
      </div>

      <div className="dashboard-tabs">
        {['events', 'attending', userData.is_venue_owner && 'venues'].filter(Boolean).map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'events' ? 'My Events' : tab === 'attending' ? 'Attending' : 'My Venues'}
          </button>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {activeTab === 'events' && (
          <DashboardSection
            title="Events You're Organizing"
            emptyMessage="You haven't created any events yet."
            emptyLink={{ to: '/create-event', text: 'Create Event' }}
            events={myEvents}
            renderActions={(event) => (
              <>
                <Link to={`/events/${event.id}`} className="btn-secondary">View</Link>
                <Link to={`/events/${event.id}/edit`} className="btn-secondary">Edit</Link>
              </>
            )}
            formatEventDate={formatEventDate}
          />
        )}

        {activeTab === 'attending' && (
          <DashboardSection
            title="Events You're Attending"
            emptyMessage="You're not registered for any events yet."
            emptyLink={{ to: '/events', text: 'Explore Events' }}
            events={attendingEvents}
            renderActions={(event) => (
              <>
                <Link to={`/events/${event.id}`} className="btn-secondary">View</Link>
                <button
                  className="btn-secondary btn-cancel"
                  onClick={() => handleCancelAttendance(event.id)}
                >
                  Cancel
                </button>
              </>
            )}
            formatEventDate={formatEventDate}
            showOrganizer
          />
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

function DashboardSection({ title, events, emptyMessage, emptyLink, renderActions, formatEventDate, showOrganizer = false }) {
  return (
    <div className="dashboard-section">
      <h2>{title}</h2>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
          <Link to={emptyLink.to} className="btn-primary">{emptyLink.text}</Link>
        </div>
      ) : (
        <div className="dashboard-events">
          {events.map(event => (
            <div key={event.id} className="dashboard-event-card">
              <div className="event-details">
                <h3>{event.title}</h3>
                <p className="event-date">{formatEventDate(event.start_date, event.start_time)}</p>
                {showOrganizer && (
                  <p className="event-organizer">By: {event.organizer?.username || 'Unknown'}</p>
                )}
                {event.status && (
                  <p className="event-status">Status: <span className={`status-${event.status}`}>{event.status}</span></p>
                )}
                {'attendees_count' in event && (
                  <p className="event-attendees">{event.attendees_count} attendees</p>
                )}
              </div>
              <div className="event-actions">{renderActions(event)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
