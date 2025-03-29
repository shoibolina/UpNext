import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Profile.css';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    is_event_organizer: false,
    is_venue_owner: false,
    profile: {
      phone_number: '',
      address: '',
      city: '',
      state: '',
      zip_code: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }
        
        const user = await authService.getCurrentUser();
        setUserData(user);
        
        // Initialize form data with user data
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          bio: user.bio || '',
          is_event_organizer: user.is_event_organizer || false,
          is_venue_owner: user.is_venue_owner || false,
          profile: {
            phone_number: user.profile?.phone_number || '',
            address: user.profile?.address || '',
            city: user.profile?.city || '',
            state: user.profile?.state || '',
            zip_code: user.profile?.zip_code || ''
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('profile_')) {
      const profileField = name.replace('profile_', '');
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Update user profile
      await authService.updateProfile(formData);
      
      // Refresh user data
      const updatedUser = await authService.getCurrentUser();
      setUserData(updatedUser);
      
      // Exit edit mode
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!userData) {
    return <div className="error">Unable to load user data. Please login again.</div>;
  }

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="profile-card">
        {!isEditing ? (
          // View mode
          <>
            <div className="profile-header">
              <h2>{userData.username}</h2>
              <p>{userData.email}</p>
            </div>
            
            <div className="profile-details">
              <h3>Personal Information</h3>
              <div className="detail-item">
                <strong>First Name:</strong> {userData.first_name || 'Not set'}
              </div>
              <div className="detail-item">
                <strong>Last Name:</strong> {userData.last_name || 'Not set'}
              </div>
              <div className="detail-item">
                <strong>Bio:</strong> {userData.bio || 'No bio available'}
              </div>
              <div className="detail-item">
                <strong>User Type:</strong> 
                {userData.is_event_organizer && 'Event Organizer'} 
                {userData.is_event_organizer && userData.is_venue_owner && ' & '} 
                {userData.is_venue_owner && 'Venue Owner'}
                {!userData.is_event_organizer && !userData.is_venue_owner && 'Standard User'}
              </div>
              
              <h3>Contact Information</h3>
              <div className="detail-item">
                <strong>Phone:</strong> {userData.profile?.phone_number || 'Not provided'}
              </div>
              <div className="detail-item">
                <strong>Address:</strong> {userData.profile?.address || 'Not provided'}
              </div>
              <div className="detail-item">
                <strong>City:</strong> {userData.profile?.city || 'Not provided'}
              </div>
              <div className="detail-item">
                <strong>State:</strong> {userData.profile?.state || 'Not provided'}
              </div>
              <div className="detail-item">
                <strong>ZIP Code:</strong> {userData.profile?.zip_code || 'Not provided'}
              </div>
              
              <div className="detail-item">
                <strong>Member Since:</strong> {new Date(userData.date_joined).toLocaleDateString()}
              </div>
            </div>
            
            <div className="profile-actions">
              <button 
                className="btn-secondary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          // Edit mode
          <form onSubmit={handleSubmit} className="profile-form">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>User Type</label>
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_event_organizer"
                    checked={formData.is_event_organizer}
                    onChange={handleChange}
                  />
                  I want to organize events
                </label>
                
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_venue_owner"
                    checked={formData.is_venue_owner}
                    onChange={handleChange}
                  />
                  I want to list venues
                </label>
              </div>
            </div>
            
            <h3>Contact Information</h3>
            <div className="form-group">
              <label htmlFor="profile_phone_number">Phone Number</label>
              <input
                type="tel"
                id="profile_phone_number"
                name="profile_phone_number"
                value={formData.profile.phone_number}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="profile_address">Address</label>
              <input
                type="text"
                id="profile_address"
                name="profile_address"
                value={formData.profile.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile_city">City</label>
                <input
                  type="text"
                  id="profile_city"
                  name="profile_city"
                  value={formData.profile.city}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="profile_state">State</label>
                <input
                  type="text"
                  id="profile_state"
                  name="profile_state"
                  value={formData.profile.state}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="profile_zip_code">ZIP Code</label>
                <input
                  type="text"
                  id="profile_zip_code"
                  name="profile_zip_code"
                  value={formData.profile.zip_code}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;