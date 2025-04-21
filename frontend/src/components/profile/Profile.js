import React, { useState, useEffect, useCallback, useRef } from 'react';
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
      className="form-input"
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
      className="form-textarea"
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
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setProfileImage(file);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewCoverImage(reader.result);
      };
      reader.readAsDataURL(file);
      setCoverImage(file);
    }
  };

  const handleImageUpload = useCallback(async () => {
    if (!profileImage) return;

    setImageUploading(true);
    try {
      await authService.uploadProfileImage(profileImage);
      const updatedUser = await authService.getCurrentUser();
      setUserData(updatedUser);
      setError(null);
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError('Failed to upload profile image');
    } finally {
      setImageUploading(false);
      setProfileImage(null);
    }
  }, [profileImage]);

  const handleCoverUpload = useCallback(async () => {
    if (!coverImage) return;

    setCoverUploading(true);
    try {
      await authService.uploadCoverImage(coverImage);
      const updatedUser = await authService.getCurrentUser();
      setUserData(updatedUser);
      setError(null);
    } catch (err) {
      console.error('Error uploading cover image:', err);
      setError('Failed to upload cover image');
    } finally {
      setCoverUploading(false);
      setCoverImage(null);
    }
  }, [coverImage]);

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const triggerCoverInput = () => {
    coverInputRef.current.click();
  };

  const cancelImageUpload = () => {
    setProfileImage(null);
    setPreviewImage(userData.profile_picture_url || null);
  };

  const cancelCoverUpload = () => {
    setCoverImage(null);
    setPreviewCoverImage(userData.cover_photo_url || null);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(formData);

      // Upload profile image if one was selected
      if (profileImage) {
        await handleImageUpload();
      }

      // Upload cover image if one was selected
      if (coverImage) {
        await handleCoverUpload();
      }

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
  }, [formData, profileImage, coverImage, handleImageUpload, handleCoverUpload]);

  if (loading) {
    return <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>;
  }

  if (!userData) {
    return <div className="error">Unable to load user data. Please login again.</div>;
  }

  const renderTab = () => {
    if (isEditing) {
      return (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
              <InputField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
            </div>
            <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange} />
          </div>

          <div className="form-section">
            <h3>User Type</h3>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_event_organizer"
                  checked={formData.is_event_organizer}
                  onChange={handleChange}
                />
                <span className="checkbox-text">I want to organize events</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_venue_owner"
                  checked={formData.is_venue_owner}
                  onChange={handleChange}
                />
                <span className="checkbox-text">I want to list venues</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            <InputField
              label="Phone Number"
              name="profile_phone_number"
              value={formData.profile.phone_number}
              onChange={handleChange}
              type="tel"
            />
            <InputField
              label="Address"
              name="profile_address"
              value={formData.profile.address}
              onChange={handleChange}
            />

            <div className="form-row">
              <InputField
                label="City"
                name="profile_city"
                value={formData.profile.city}
                onChange={handleChange}
              />
              <InputField
                label="State"
                name="profile_state"
                value={formData.profile.state}
                onChange={handleChange}
              />
              <InputField
                label="ZIP Code"
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
              onClick={() => {
                setIsEditing(false);
                // Reset any image changes
                setProfileImage(null);
                setCoverImage(null);
                setPreviewImage(userData.profile_picture_url || null);
                setPreviewCoverImage(userData.cover_photo_url || null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }

    switch (activeTab) {
      case 'about':
        return (
          <div className="profile-about-tab">
            <div className="profile-card-section">
              <h3>Personal Information</h3>
              <div className="profile-info-table">
                <div className="info-row">
                  <div className="info-label">Full Name</div>
                  <div className="info-value">
                    {userData.first_name || userData.last_name
                      ? `${userData.first_name || ''} ${userData.last_name || ''}`
                      : 'Not provided'}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">Username</div>
                  <div className="info-value">{userData.username}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Email</div>
                  <div className="info-value">{userData.email}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Account Type</div>
                  <div className="info-value">
                    {userData.is_event_organizer && <span className="user-badge organizer">Event Organizer</span>}
                    {userData.is_venue_owner && <span className="user-badge venue-owner">Venue Owner</span>}
                    {!userData.is_event_organizer && !userData.is_venue_owner &&
                      <span className="user-badge standard">Standard User</span>}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">Member Since</div>
                  <div className="info-value">{new Date(userData.date_joined).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="profile-card-section">
              <h3>Bio</h3>
              <div className="profile-bio">
                {userData.bio || 'No bio provided yet.'}
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="profile-contact-tab">
            <div className="profile-card-section">
              <h3>Contact Information</h3>
              <div className="profile-info-table">
                <div className="info-row">
                  <div className="info-label">Phone</div>
                  <div className="info-value">{userData.profile?.phone_number || 'Not provided'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Address</div>
                  <div className="info-value">{userData.profile?.address || 'Not provided'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">City</div>
                  <div className="info-value">{userData.profile?.city || 'Not provided'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">State</div>
                  <div className="info-value">{userData.profile?.state || 'Not provided'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">ZIP Code</div>
                  <div className="info-value">{userData.profile?.zip_code || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view information</div>;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div className="profile-cover" style={
          previewCoverImage || userData.cover_photo_url
            ? { backgroundImage: `url(${previewCoverImage || userData.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}
        }>
          {isEditing && (
            <div className="cover-photo-overlay" onClick={triggerCoverInput}>
              <div className="cover-upload-button">
                <span className="camera-icon">📷</span>
                <span>{userData.cover_photo_url ? 'Change Cover Photo' : 'Add Cover Photo'}</span>
              </div>
            </div>
          )}
          <div className="profile-actions-top">
            {!isEditing && (
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverImageChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
          {isEditing && coverImage && (
            <div className="cover-upload-actions">
              <button
                type="button"
                className="btn-icon"
                onClick={handleCoverUpload}
                disabled={coverUploading}
              >
                ✓ {coverUploading ? 'Uploading...' : 'Save Cover'}
              </button>
              <button
                type="button"
                className="btn-icon btn-cancel"
                onClick={cancelCoverUpload}
              >
                ✕ Cancel
              </button>
            </div>
          )}
        </div>

        <div className="profile-main-info">
          <div className="profile-image-container">
            <div className="profile-image-wrapper">
              {previewImage || userData.profile_picture_url ? (
                <img
                  src={previewImage || userData.profile_picture_url}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span className="avatar-text">
                    {userData.first_name && userData.last_name
                      ? `${userData.first_name[0]}${userData.last_name[0]}`
                      : userData.username ? userData.username[0].toUpperCase()
                        : 'U'}
                  </span>
                </div>
              )}

              {isEditing && (
                <div className="profile-image-overlay" onClick={triggerFileInput}>
                  <span className="camera-icon">📷</span>
                  <span>Change Photo</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              style={{ display: 'none' }}
              accept="image/*"
            />
            {isEditing && profileImage && (
              <div className="image-upload-actions">
                <button
                  type="button"
                  className="btn-icon"
                  onClick={handleImageUpload}
                  disabled={imageUploading}
                >
                  ✓ {imageUploading ? 'Uploading...' : 'Save Photo'}
                </button>
                <button
                  type="button"
                  className="btn-icon btn-cancel"
                  onClick={cancelImageUpload}
                >
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-user-info">
          <h2 className="user-name">
            {userData.first_name || userData.last_name
              ? `${userData.first_name || ''} ${userData.last_name || ''}`
              : userData.username}
          </h2>
          <div className="user-badges">
            {userData.is_event_organizer && <span className="user-badge organizer">Event Organizer</span>}
            {userData.is_venue_owner && <span className="user-badge venue-owner">Venue Owner</span>}
            {!userData.is_event_organizer && !userData.is_venue_owner &&
              <span className="user-badge standard">Standard User</span>}
          </div>
        </div>

        {!isEditing && (
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              Contact
            </button>
          </div>
        )}
      </div>

      <div className="profile-content-section">
        <ErrorMessage message={error} />
        {renderTab()}
      </div>
    </div>
  );
}

export default Profile;