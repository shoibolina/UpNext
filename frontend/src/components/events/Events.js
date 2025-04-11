import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import './Events.css';
import authService from '../../services/authService';

function Events() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    date: 'upcoming',
    is_free: '',
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch events, current user and categories on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    
    fetchCurrentUser();
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async (filterParams = formatFilters()) => {
    try {
      setLoading(true);
      const eventsData = await eventServices.getEvents(filterParams);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await eventServices.getEventCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Format filters for API query
  const formatFilters = () => {
    const formattedFilters = {};
    
    if (filters.search) {
      formattedFilters.search = filters.search;
    }
    
    if (filters.category) {
      formattedFilters.category = filters.category;
    }
    
    if (filters.date) {
      formattedFilters.date = filters.date;
    }
    
    if (filters.is_free !== '') {
      formattedFilters.is_free = filters.is_free === 'true';
    }
    
    return formattedFilters;
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const handleSearch = async (e) => {
    e.preventDefault();
    fetchEvents(formatFilters());
  };

  // Handle deleting posted events
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventServices.deleteEvent(eventId);
        setEvents(events.filter(event => event.id !== eventId));
      } catch (err) {
        console.error('Error deleting event:', err);
        setError('Failed to delete event. Please try again.');
      }
    }
  };

  // Format date for display
  const formatEventDate = (startDate, startTime) => {
    if (!startDate || !startTime) return '';
    
    try {
      const date = new Date(`${startDate}T${startTime}`);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return `${startDate} ${startTime}`;
    }
  };

  if (loading && events.length === 0) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="events-container">
      <h1>Explore Events</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="create-event-header">
        <Link to="/create-event" className="btn-primary create-event-btn">
          Create New Event
        </Link>
      </div>
      
      <div className="events-filters">
        <form onSubmit={handleSearch} className="filter-form">
          <div className="filter-group">
            <input 
              type="text" 
              name="search"
              placeholder="Search events..." 
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          
          {categories.length > 0 && (
            <div className="filter-group">
              <select 
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="filter-group">
            <select 
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
            >
              <option value="upcoming">Upcoming Events</option>
              <option value="past">Past Events</option>
              <option value="">All Events</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              name="is_free"
              value={filters.is_free}
              onChange={handleFilterChange}
            >
              <option value="">All Events</option>
              <option value="true">Free Events</option>
              <option value="false">Paid Events</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary">Filter</button>
        </form>
      </div>
      
      <div className="events-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No events found.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="event-card">
              {event.image && (
                <div className="event-image">
                  <img src={event.image} alt={event.title} />
                </div>
              )}
              
              <div className="event-content">
                <h3>{event.title}</h3>
                <p className="event-date">
                  {formatEventDate(event.start_date, event.start_time)}
                </p>
                
                <div className="event-categories">
                  {event.categories && event.categories.map(cat => (
                    <span key={cat.id} className="event-category">{cat.name}</span>
                  ))}
                </div>
                
                <p className="event-description">{
                  event.description && event.description.length > 150 
                    ? `${event.description.substring(0, 150)}...` 
                    : event.description
                }</p>
                
                <div className="event-footer">
                  <span className="event-price">
                    {event.is_free ? 'Free' : `$${event.price}`}
                  </span>
                  
                  <div className="event-actions">
                    <Link to={`/events/${event.id}`} className="btn-primary">View Details</Link>
                    
                    {currentUser && currentUser.id === event.organizer.id && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Events;