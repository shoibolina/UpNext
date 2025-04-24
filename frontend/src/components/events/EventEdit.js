import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import authService from '../../services/authService';
import './EventEdit.css';

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

  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [imageActionLoading, setImageActionLoading] = useState({}); 

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login', { state: { from: `/events/${id}/edit` } });
          return;
        }

        const eventData = await eventServices.getEventById(id);
        const currentUser = await authService.getCurrentUser();
        if (eventData.organizer.id !== currentUser.id) {
          setError("You don't have permission to edit this event");
          return;
        }

        const categoriesData = await eventServices.getEventCategories();
        setCategories(categoriesData);

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

        await fetchEventImages();
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, navigate]);

  const fetchEventImages = async () => {
    try {
      const imageData = await eventServices.getEventImages(id);
      setImages(imageData);
    } catch (err) {
      console.error('Error fetching event images:', err);
      setImageError('Failed to load event images');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'category_ids') {
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
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setNewImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
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
      setSuccessMessage(null);
      
      const isPrimary = images.length === 0;
      await eventServices.uploadEventImage(id, newImage, imageCaption, isPrimary);
      
      // Clean up preview URL
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setNewImage(null);
      setImageCaption('');
      setImagePreview(null);
      await fetchEventImages();
      setSuccessMessage('Image uploaded successfully');
    } catch (err) {
      console.error('Error uploading image:', err);
      setImageError(err.response?.data?.error || err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        setImageActionLoading(prev => ({ ...prev, [imageId]: true }));
        setImageError(null);
        setSuccessMessage(null);
        
        await eventServices.deleteEventImage(id, imageId);
        await fetchEventImages();
        setSuccessMessage('Image deleted successfully');
      } catch (err) {
        console.error('Error deleting image:', err);
        setImageError(err.response?.data?.error || err.message || 'Failed to delete image');
      } finally {
        setImageActionLoading(prev => ({ ...prev, [imageId]: false }));
      }
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      setImageActionLoading(prev => ({ ...prev, [imageId]: true }));
      setImageError(null);
      setSuccessMessage(null);
      
      await eventServices.setPrimaryImage(id, imageId);
      await fetchEventImages();
      setSuccessMessage('Primary image updated');
    } catch (err) {
      console.error('Error setting primary image:', err);
      setImageError(err.response?.data?.error || err.message || 'Failed to set primary image');
    } finally {
      setImageActionLoading(prev => ({ ...prev, [imageId]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const eventData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: !formData.is_free && formData.price ? parseFloat(formData.price) : null
      };
      const updatedEvent = await eventServices.updateEvent(id, eventData);
      console.log('Event updated successfully:', updatedEvent);
      navigate(`/events/${id}`);
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.response?.data?.error || err.message || 'Failed to update event. Please check your form and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading event data...</div>;
  }

  if (error && !formData.title) {
    return (
      <div className="event-edit-container">
        <div className="error-message">{error}</div>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="event-edit-container">
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
        
        {/* Event Images Section */}
        <div className="form-section">
          <h2>Event Images</h2>
          {imageError && <div className="error-message">{imageError}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <div className="images-gallery">
            {images.length > 0 ? (
              images.map((image) => (
                <div key={image.id} className={`image-card ${image.is_primary ? 'primary-image' : ''}`}>
                  <div className="image-container">
                    <img src={image.image} alt={image.caption || 'Event image'} />
                    {image.is_primary && <span className="primary-badge">Primary</span>}
                  </div>
                  <div className="image-caption">
                    {image.caption || 'No caption'}
                  </div>
                  <div className="image-actions">
                    {!image.is_primary && (
                      <button 
                        type="button" 
                        className="btn-secondary btn-small"
                        onClick={() => handleSetPrimary(image.id)}
                        disabled={imageActionLoading[image.id]}
                      >
                        {imageActionLoading[image.id] ? 'Setting...' : 'Set as Primary'}
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn-danger btn-small"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={imageActionLoading[image.id]}
                    >
                      {imageActionLoading[image.id] ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-message">No images uploaded yet</p>
            )}
          </div>
          
          <div className="image-upload-form">
            <h3>Upload New Image</h3>
            <div className="form-group">
              <label htmlFor="new-image">Select Image*</label>
              <input
                type="file"
                id="new-image"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingImage}
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
                disabled={uploadingImage}
              />
            </div>
            
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleImageUpload}
              disabled={!newImage || uploadingImage}
            >
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate(`/events/${id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventEdit;