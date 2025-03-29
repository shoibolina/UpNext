import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import authService from '../../services/authService';
import './CreateEvent.css';

function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    address: '',
    capacity: '',
    is_free: true,
    price: '',
    visibility: 'public',
    status: 'published',
    category_ids: []
  });

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Check auth
        if (!authService.isAuthenticated()) {
          navigate('/login', { state: { from: `/events/${id}/edit` } });
          return;
        }

        // Fetch event data
        const eventData = await eventServices.getEventById(id);
        
        // Check if user is organizer
        const currentUser = await authService.getCurrentUser();
        if (eventData.organizer.id !== currentUser.id) {
          setError("You don't have permission to edit this event");
          return;
        }

        // Fetch categories
        const categoriesData = await eventServices.getEventCategories();
        setCategories(categoriesData);

        // Format date and time from API response
        setFormData({
          title: eventData.title || '',
          description: eventData.description || '',
          start_date: eventData.start_date || '',
          start_time: eventData.start_time || '',
          end_date: eventData.end_date || '',
          end_time: eventData.end_time || '',
          address: eventData.address || '',
          venue: eventData.venue || null,
          capacity: eventData.capacity || '',
          is_free: eventData.is_free,
          price: eventData.price || '',
          visibility: eventData.visibility || 'public',
          status: eventData.status || 'published',
          category_ids: eventData.categories.map(cat => cat.id) || []
        });
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'category_ids') {
      // Handle multi-select categories
      const categoryId = parseInt(value);
      const isSelected = checked || e.target.selected;
      
      setFormData(prev => {
        const currentCategories = [...prev.category_ids];
        
        if (isSelected && !currentCategories.includes(categoryId)) {
          return { ...prev, category_ids: [...currentCategories, categoryId] };
        } else if (!isSelected && currentCategories.includes(categoryId)) {
          return { ...prev, category_ids: currentCategories.filter(id => id !== categoryId) };
        }
        
        return prev;
      });
    } else {
      // Handle other form fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Prepare data for API - match the expected format in Django serializer
      const eventData = {
        ...formData,
        // Convert capacity to number or null
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        // Convert price to number or null
        price: !formData.is_free && formData.price ? parseFloat(formData.price) : null
      };

      // Send to API
      const updatedEvent = await eventServices.updateEvent(id, eventData);
      
      console.log('Event updated successfully:', updatedEvent);
      
      // Redirect to the event detail page
      navigate(`/events/${id}`);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(
        err.message || 
        'Failed to update event. Please check your form and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event data...</div>;
  }

  if (error && !formData.title) {
    return (
      <div className="create-event-container">
        <div className="error-message">{error}</div>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="create-event-container">
      <h1>Edit Event</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label htmlFor="title">Event Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description*</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          ></textarea>
        </div>
        
        {categories.length > 0 && (
          <div className="form-group">
            <label>Categories</label>
            <div className="categories-container">
              {categories.map(category => (
                <div key={category.id} className="category-checkbox">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    name="category_ids"
                    value={category.id}
                    onChange={handleChange}
                    checked={formData.category_ids.includes(category.id)}
                  />
                  <label htmlFor={`category-${category.id}`}>{category.name}</label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="start_date">Start Date*</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="start_time">Start Time*</label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="end_date">End Date*</label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="end_time">End Time*</label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Location/Address*</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="visibility">Visibility</label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="invite_only">Invite Only</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="capacity">Capacity</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            placeholder="Leave empty for unlimited"
          />
        </div>
        
        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="is_free"
            name="is_free"
            checked={formData.is_free}
            onChange={handleChange}
          />
          <label htmlFor="is_free">This is a free event</label>
        </div>
        
        {!formData.is_free && (
          <div className="form-group">
            <label htmlFor="price">Price*</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required={!formData.is_free}
            />
          </div>
        )}
        
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate(`/events/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventEdit;