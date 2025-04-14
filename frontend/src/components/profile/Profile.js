import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Profile.css';

const InputField = ({ label, name, value, onChange, type = 'text', required = false }) => (
  <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
    />
  </div>
);

const TextAreaField = ({ label, name, value, onChange, rows = 4 }) => (
  <div className="form-group">
    <label htmlFor={name}>{label}</label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
    />
  </div>
);

const ErrorMessage = ({ message }) => message && <div className="error-message">{message}</div>;

function Profile() {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    is_event_organizer: false,
    is_venue_owner: false,
    profile_picture: null,
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

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const user = await authService.getCurrentUser();
        setUserData(user);
        setFormData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          bio: user.bio || '',
          is_event_organizer: user.is_event_organizer || false,
          is_venue_owner: user.is_venue_owner || false,
          profile_picture: null,
          profile: {
            phone_number: user.profile?.phone_number || '',
            address: user.profile?.address || '',
            city: user.profile?.city || '',
            state: user.profile?.state || '',
            zip_code: user.profile?.zip_code || ''
          }
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files} = e.target;

    if (name === 'profile_picture') {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        profile_picture: files[0]
      }));
      return;
    }

    setFormData((prev) => {
      if (name.startsWith('profile_') && name !== 'profile_picture') {
        const field = name.replace('profile_', '');
        return {
          ...prev,
          profile: {
            ...prev.profile,
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(formData);
      const updatedUser = await authService.getCurrentUser();
      setUserData(updatedUser);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [formData]);

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!userData) {
    return <div className="error">Unable to load user data. Please login again.</div>;
  }

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <ErrorMessage message={error} />

      <div className="profile-card">
        {!isEditing && (
            <img
                src={userData.profile_picture || '/default-avatar.png'}
                alt="Profile"
                className="avatar"
            />
        )}

        {!isEditing ? (
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
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
            <form onSubmit={handleSubmit} className="profile-form">
              <h3>Personal Information</h3>
              <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange}/>
              <InputField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange}/>
              <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange}/>

              <h3>Profile Picture</h3>
              <div className="form-group">
                <label htmlFor="profile_picture">Upload Profile Picture</label>
                <input
                    type="file"
                    id="profile_picture"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleChange}
                />
              </div>

              <h3>User Type</h3>
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

              <h3>Contact Information</h3>
              <InputField
                  label="Phone Number"
                  name="profile_phone_number"
                  value={formData.profile.phone_number}
                  onChange={handleChange}
                  type="tel"
              />
              <InputField label="Address" name="profile_address" value={formData.profile.address}
                          onChange={handleChange}/>
              <InputField label="City" name="profile_city" value={formData.profile.city} onChange={handleChange}/>
              <InputField label="State" name="profile_state" value={formData.profile.state} onChange={handleChange}/>
              <InputField label="ZIP Code" name="profile_zip_code" value={formData.profile.zip_code}
                          onChange={handleChange}/>

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
