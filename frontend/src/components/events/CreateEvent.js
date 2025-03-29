import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import authService from '../../services/authService';
import './CreateEvent.css';

function CreateEvent() {
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
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: '/create-event' } });
    }
  }, [navigate]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await eventServices.getEventCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load event categories. Please refresh the page.');
      }
    };
    
    fetchCategories();
  }, []);

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
    setLoading(true);
    setError(null);
    
    // Debug: Log the form data being submitted
    console.log("Submitting form data:", formData);

    try {
      // Check if user is authenticated first
      if (!authService.isAuthenticated()) {
        throw new Error('You must be logged in to create an event');
      }

      // Prepare data for API - match the expected format in Django serializer
      const eventData = {
        ...formData,
        // Convert capacity to number or null
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        // Convert price to number or null
        price: !formData.is_free && formData.price ? parseFloat(formData.price) : null,
        // Ensure category_ids is sent properly
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : []
      };

      // Send to API
      const createdEvent = await eventServices.createEvent(eventData);
      
      console.log('Event created successfully:', createdEvent);
      setLoading(false);
      
      // Redirect to the event detail page or dashboard
      navigate(`/events/${createdEvent.id}`);
    } catch (err) {
      console.error('Error creating event:', err);
      
      // Set a more detailed error message based on the error
      let errorMessage = 'Failed to create event. Please check your form and try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="create-event-container">
      <h1>Create New Event</h1>
      
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
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/events')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateEvent;