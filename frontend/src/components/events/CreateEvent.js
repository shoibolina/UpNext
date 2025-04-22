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

  // State for image upload
  const [newImage, setNewImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [createdEventId, setCreatedEventId] = useState(null);
  const [uploadStep, setUploadStep] = useState(false); // false = event details, true = image upload

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
  
  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear any previous errors
      setImageError(null);
    }
  };

  const handleCaptionChange = (e) => {
    setImageCaption(e.target.value);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    
    if (!newImage) {
      setImageError('Please select an image to upload');
      return;
    }
    
    try {
      setUploadingImage(true);
      setImageError(null);
      
      // Upload the image
      await eventServices.uploadEventImage(
        createdEventId, 
        newImage, 
        imageCaption, 
        true // Make it primary by default since it's the first image
      );
      
      // Show success message
      alert('Image uploaded successfully! Redirecting to event page...');
      
      // Redirect to the event detail page
      navigate(`/events/${createdEventId}`);
    } catch (err) {
      console.error('Error uploading image:', err);
      setImageError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const skipImageUpload = () => {
    // Redirect to the event detail page without uploading an image
    navigate(`/events/${createdEventId}`);
  };

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
    
    console.log("Submitting form data:", formData);

    try {
      if (!authService.isAuthenticated()) {
        throw new Error('You must be logged in to create an event');
      }

      const eventData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: !formData.is_free && formData.price ? parseFloat(formData.price) : null,
        category_ids: formData.category_ids.length > 0 ? formData.category_ids : []
      };

      const createdEvent = await eventServices.createEvent(eventData);
      
      console.log('Event created successfully:', createdEvent);
      
      setCreatedEventId(createdEvent.id);
      
      setUploadStep(true);
      setLoading(false);
    } catch (err) {
      console.error('Error creating event:', err);
      
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
      {!uploadStep ? (
        // Event Details Form
        <>
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
        </>
      ) : (
        // Image Upload Step
        <>
          <h1>Add Event Image</h1>
          <p className="success-message">Event created successfully! Add an image for your event.</p>
          
          {imageError && <div className="error-message">{imageError}</div>}
          
          <div className="image-upload-form">
            <div className="form-group">
              <label htmlFor="event-image">Select Image</label>
              <input
                type="file"
                id="event-image"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="image-caption">Caption (Optional)</label>
              <input
                type="text"
                id="image-caption"
                value={imageCaption}
                onChange={handleCaptionChange}
                placeholder="Enter image caption"
              />
            </div>
            
            <div className="form-actions">
              <button 
                className="btn-primary"
                onClick={handleImageUpload}
                disabled={!newImage || uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              <button 
                className="btn-secondary"
                onClick={skipImageUpload}
              >
                Skip
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CreateEvent;