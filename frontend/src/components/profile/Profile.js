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

const FollowButton = ({ userId, isFollowing, onFollowToggle }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const endpoint = isFollowing ? `unfollow` : `follow`;
    try {
      await fetch(`/api/users/${userId}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      onFollowToggle(userId);
    } catch (err) {
      console.error(`Error trying to ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-secondary"
      onClick={handleClick}
      disabled={loading}
      style={{ marginLeft: '10px' }}
    >
      {loading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
};

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
  // New states for friend suggestions.
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const user = await authService.getCurrentUser();
        console.log('Fetched user:', user);

        setUserData({
          ...user,
          followers: user.followers || [],
          following: user.following || []
        });

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
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Fetch friend suggestions based on the same city. Change the API endpoint as needed.
  useEffect(() => {
    const fetchFriendSuggestions = async () => {
      try {
        // const token = localStorage.getItem('token');
        // console.log('Token availableL;', token);
        // if (token) {
        //   console.log('Token starts with:', token.substring(0, 10) + '...');
        // }
        const response = await fetch('http://localhost:8000/api/v1/users/suggest_friends_by_city/', {
          method: 'GET',
          headers: {
            'Content-Type': 'utf-8',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch friend suggestions');
        }
        const data = await response.json();
        setFriendSuggestions(data.suggestions);
      } catch (err) {
        console.error('Error fetching friend suggestions:', err);
        setSuggestionsError(err.message);
      } finally {
        setSuggestionsLoading(false);
      }
    };
  
    if (userData && userData.profile?.city) {
      fetchFriendSuggestions();
    } else {
      // If no city is set, stop the loader.
      setSuggestionsLoading(false);
    }
  }, [userData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      if (name.startsWith('profile_')) {
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
        {!isEditing ? (
          <>
            <div className="profile-header">
              <h2>{userData.username}</h2>
              <p>{userData.email}</p>
            </div>

            <div className="profile-details">
              <h3>Personal Information</h3>
              <div className="detail-item"><strong>First Name:</strong> {userData.first_name || 'Not set'}</div>
              <div className="detail-item"><strong>Last Name:</strong> {userData.last_name || 'Not set'}</div>
              <div className="detail-item"><strong>Bio:</strong> {userData.bio || 'No bio available'}</div>
              <div className="detail-item"><strong>User Type:</strong>
                {userData.is_event_organizer && 'Event Organizer'}
                {userData.is_event_organizer && userData.is_venue_owner && ' & '}
                {userData.is_venue_owner && 'Venue Owner'}
                {!userData.is_event_organizer && !userData.is_venue_owner && 'Standard User'}
              </div>

              <h3>Contact Information</h3>
              <div className="detail-item"><strong>Phone:</strong> {userData.profile?.phone_number || 'Not provided'}</div>
              <div className="detail-item"><strong>Address:</strong> {userData.profile?.address || 'Not provided'}</div>
              <div className="detail-item"><strong>City:</strong> {userData.profile?.city || 'Not provided'}</div>
              <div className="detail-item"><strong>State:</strong> {userData.profile?.state || 'Not provided'}</div>
              <div className="detail-item"><strong>ZIP Code:</strong> {userData.profile?.zip_code || 'Not provided'}</div>
              <div className="detail-item"><strong>Member Since:</strong> {new Date(userData.date_joined).toLocaleDateString()}</div>

              <h3>Social</h3>
              <div className="detail-item"><strong>Following:</strong> {userData.following.length} user(s)</div>
              <div className="detail-item"><strong>Followers:</strong> {userData.followers.length} user(s)</div>

              {userData.following.length > 0 && (
                <div className="detail-item">
                  <strong>Following List:</strong>
                  <ul>
                    {userData.following.map((u, i) => (
                      <li key={i}>
                        {u.username}
                        <FollowButton
                          userId={u.id}
                          isFollowing={userData.following.some(f => f.id === u.id)}
                          onFollowToggle={(targetId) => {
                            setUserData(prev => ({
                              ...prev,
                              following: prev.following.some(f => f.id === targetId)
                                ? prev.following.filter(f => f.id !== targetId)
                                : [...prev.following, u]
                            }));
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {userData.followers.length > 0 && (
                <div className="detail-item">
                  <strong>Followers List:</strong>
                  <ul>
                    {userData.followers.map((u, i) => (
                      <li key={i}>
                        {u.username}
                        <FollowButton
                          userId={u.id}
                          isFollowing={userData.following.some(f => f.id === u.id)}
                          onFollowToggle={(targetId) => {
                            setUserData(prev => ({
                              ...prev,
                              following: prev.following.some(f => f.id === targetId)
                                ? prev.following.filter(f => f.id !== targetId)
                                : [...prev.following, u]
                            }));
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* NEW: Display Friend Suggestions */}
            <div className="profile-friend-suggestions">
              <h3>Friend Suggestions</h3>
              {suggestionsLoading ? (
                <div>Loading friend suggestions...</div>
              ) : suggestionsError ? (
                <div className="error">Error: {suggestionsError}</div>
              ) : friendSuggestions.length > 0 ? (
                <ul>
                  {friendSuggestions.map((suggestion, idx) => (
                    <li key={idx}>
                      {suggestion.user.username} {suggestion.city && `(City: ${suggestion.city})`}
                      <FollowButton
                        userId={suggestion.user.id}
                        // If you already follow the suggested user, check for that here:
                        isFollowing={userData.following.some(f => f.id === suggestion.user.id)}
                        onFollowToggle={(targetId) => {
                          // Update your userData state based on the follow action.
                          setUserData(prev => ({
                            ...prev,
                            following: prev.following.some(f => f.id === targetId)
                              ? prev.following.filter(f => f.id !== targetId)
                              : [...prev.following, suggestion.user]
                          }));
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div>No friend suggestions available.</div>
              )}
            </div>

            <div className="profile-actions">
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <h3>Personal Information</h3>
            <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
            <InputField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
            <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange} />

            <h3>User Type</h3>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input type="checkbox" name="is_event_organizer" checked={formData.is_event_organizer} onChange={handleChange} />
                I want to organize events
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="is_venue_owner" checked={formData.is_venue_owner} onChange={handleChange} />
                I want to list venues
              </label>
            </div>

            <h3>Contact Information</h3>
            <InputField label="Phone Number" name="profile_phone_number" value={formData.profile.phone_number} onChange={handleChange} type="tel" />
            <InputField label="Address" name="profile_address" value={formData.profile.address} onChange={handleChange} />
            <InputField label="City" name="profile_city" value={formData.profile.city} onChange={handleChange} />
            <InputField label="State" name="profile_state" value={formData.profile.state} onChange={handleChange} />
            <InputField label="ZIP Code" name="profile_zip_code" value={formData.profile.zip_code} onChange={handleChange} />

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
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
