import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../../services/authService';
import messagingService from '../../services/messagingService';
import './Profile.css';

// Helper function to get API URL
const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
};

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

// Enhanced error message component
const ErrorMessage = ({ message, onDismiss }) => 
  message ? (
    <div className="error-message">
      <p>{message}</p>
      {onDismiss && <button onClick={onDismiss} className="error-dismiss">×</button>}
    </div>
  ) : null;

// Modal component for followers/following
const ConnectionsModal = ({ 
  isOpen, 
  onClose, 
  connectionType, 
  connections, 
  loadConnections, 
  searchTerm, 
  setSearchTerm, 
  loadingConnections, 
  currentUserId, 
  navigateToProfile, 
  handleDirectMessage, 
  userId,
  followersCount,
  followingCount
}) => {
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Focus search input when modal opens
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // Add ESC key handler
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Handler for search with debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);
  
  useEffect(() => {
    if (isOpen) {
      loadConnections(connectionType);
    }
  }, [debouncedSearchTerm, connectionType, isOpen, loadConnections]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClickOutside}>
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <h3>{connectionType === 'followers' ? 'Followers' : 'Following'} 
            <span className="connection-count">
              {connectionType === 'followers' ? followersCount : followingCount}
            </span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-search">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={`Search ${connectionType}`}
            value={searchTerm}
            onChange={handleSearchChange}
            className="connections-search-input"
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={handleClearSearch}>
              ×
            </button>
          )}
        </div>
        
        <div className="modal-content">
          {loadingConnections ? (
            <div className="loading-connections">
              <div className="loading-spinner"></div>
              <p>Loading {connectionType}...</p>
            </div>
          ) : connections.length === 0 ? (
            <div className="empty-connections">
              <p>No {connectionType} found{searchTerm ? ' matching your search' : ''}.</p>
            </div>
          ) : (
            <div className="connections-list">
              {connections.map(user => (
                <div key={user.id} className="connection-card">
                  <div 
                    className="connection-info"
                    onClick={() => {
                      navigateToProfile(user.id);
                      onClose();
                    }}
                  >
                    <div className="connection-avatar">
                      {user.profile_picture_url ? (
                        <img src={user.profile_picture_url} alt={`${user.username}'s avatar`} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.first_name && user.last_name 
                            ? `${user.first_name[0]}${user.last_name[0]}` 
                            : user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="connection-details">
                      <h4>
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`
                          : user.username}
                      </h4>
                      <div className="connection-actions">
                        {parseInt(user.id) !== currentUserId && (
                          user.is_following ? (
                            <button 
                              className="btn-unfollow" 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await authService.unfollowUser(user.id);
                                  await loadConnections(connectionType);
                                } catch (err) {
                                  console.error(`Error unfollowing user in ${connectionType} list:`, err);
                                }
                              }}
                            >
                              Unfollow
                            </button>
                          ) : (
                            <button 
                              className="btn-follow" 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await authService.followUser(user.id);
                                  await loadConnections(connectionType);
                                } catch (err) {
                                  console.error(`Error following user in ${connectionType} list:`, err);
                                }
                              }}
                            >
                              Follow
                            </button>
                          )
                        )}
                        {parseInt(user.id) !== currentUserId && (
                          <button 
                            className="btn-message" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectMessage(user.id);
                              onClose();
                            }}
                          >
                            Message
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Image Viewer Modal
const ImageViewerModal = ({ isOpen, onClose, imageUrl, imageType }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Add ESC key handler
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="image-viewer-overlay" onClick={handleClickOutside}>
      <div className="image-viewer-container" ref={modalRef}>
        <button className="image-viewer-close" onClick={onClose}>×</button>
        <div className="image-viewer-content">
          <img
            src={imageUrl}
            alt={imageType === 'profile' ? 'Profile Photo' : 'Cover Photo'}
            className={`image-viewer-img ${imageType === 'profile' ? 'profile-viewer' : 'cover-viewer'}`}
          />
        </div>
      </div>
    </div>
  );
};

function Profile() {
  const { userId } = useParams();
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
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [followActionLoading, setFollowActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // State for modals
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [viewImageModal, setViewImageModal] = useState({
    isOpen: false,
    imageUrl: null,
    imageType: null // 'profile' or 'cover'
  });
  
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const navigate = useNavigate();

  // Error handling function
  const handleApiError = (error, setErrorFunction) => {
    console.error('API error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    setErrorFunction(errorMessage);
    
    // Clear error after 5 seconds
    setTimeout(() => {
      setErrorFunction(null);
    }, 5000);
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        // Get current user's ID for self-follow check
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }

        let user;
        
        // If userId is provided, we're viewing someone else's profile
        if (userId) {
          setIsOwnProfile(false);
          
          // Fetch the user by ID
          const response = await fetch(`${getBaseUrl()}/api/v1/users/${userId}/`, {
            headers: {
              'Authorization': `Bearer ${authService.getToken()}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          
          user = await response.json();
          setIsFollowing(user.is_following || false);
          setFollowersCount(user.followers_count || 0);
          setFollowingCount(user.following_count || 0);
        } else {
          // Fetch the current user's data
          setIsOwnProfile(true);
          user = currentUser;
          
          // Fetch followers/following counts
          try {
            const followersCount = await authService.getFollowersCount();
            const followingCount = await authService.getFollowingCount();
            setFollowersCount(followersCount);
            setFollowingCount(followingCount);
          } catch (countErr) {
            console.error('Error fetching counts:', countErr);
          }
        }
        
        setUserData(user);
        
        // Only set form data if it's the user's own profile
        if (!userId) {
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
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        handleApiError(err, setError);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, userId]);

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
      handleApiError(err, setError);
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
      handleApiError(err, setError);
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
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  }, [formData, profileImage, coverImage, handleImageUpload, handleCoverUpload]);

  // Handle follow action
  const handleFollow = async () => {
    if (followActionLoading || isFollowing || parseInt(userId) === currentUserId) {
      if (parseInt(userId) === currentUserId) {
        setError('You cannot follow yourself');
        setTimeout(() => setError(null), 5000);
      }
      if (isFollowing) {
        setError('You are already following this user');
        setTimeout(() => setError(null), 5000);
      }
      return;
    }
    
    try {
      setFollowActionLoading(true);
      console.log("Following user with ID:", userId);
      const result = await authService.followUser(userId);
      console.log("Follow result:", result);
      
      // Update state with the response data
      setIsFollowing(result.user.is_following || true);
      setFollowersCount(result.user.followers_count);
      setError(null);
    } catch (err) {
      console.error('Error following user:', err);
      handleApiError(err, setError);
    } finally {
      setFollowActionLoading(false);
    }
  };

  // Handle unfollow action
  const handleUnfollow = async () => {
    if (followActionLoading) return;
    
    try {
      setFollowActionLoading(true);
      console.log("Unfollowing user with ID:", userId);
      const result = await authService.unfollowUser(userId);
      console.log("Unfollow result:", result);
      
      // Update state with the response data
      setIsFollowing(result.user.is_following || false);
      setFollowersCount(result.user.followers_count);
      setError(null);
    } catch (err) {
      console.error('Error unfollowing user:', err);
      handleApiError(err, setError);
    } finally {
      setFollowActionLoading(false);
    }
  };
  
  // Handle direct messaging
  const handleDirectMessage = async (targetUserId) => {
    try {
      // Use the messaging service to get or create a direct chat
      const response = await messagingService.getDirectChat(targetUserId);
      // Navigate directly to the conversation
      navigate(`/messages/${response.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      handleApiError(err, setError);
    }
  };
  
  // Open image viewer modal
  const openImageViewer = (imageUrl, imageType) => {
    if (imageUrl) {
      setViewImageModal({
        isOpen: true,
        imageUrl,
        imageType
      });
    }
  };

  // Close image viewer modal
  const closeImageViewer = () => {
    setViewImageModal({
      isOpen: false,
      imageUrl: null,
      imageType: null
    });
  };
  
  // Open followers modal
  const openFollowersModal = () => {
    setSearchTerm('');
    setIsFollowersModalOpen(true);
    loadConnections('followers');
  };

  // Open following modal
  const openFollowingModal = () => {
    setSearchTerm('');
    setIsFollowingModalOpen(true);
    loadConnections('following');
  };

  // Load connections when modal is opened
  const loadConnections = useCallback(async (type) => {
    if (type !== 'followers' && type !== 'following') return;
    
    setLoadingConnections(true);
    try {
      let data;
      
      if (isOwnProfile) {
        // For the current user's profile
        if (type === 'followers') {
          data = await authService.getFollowers(searchTerm);
          console.log("Fetched followers:", data);
        } else {
          data = await authService.getFollowing(searchTerm);
          console.log("Fetched following:", data);
        }
      } else {
        // For other users' profiles, use the specific user ID
        const endpoint = type === 'followers' ? 'user_followers' : 'user_following';
        console.log(`Loading ${type} for user ID ${userId} using endpoint: ${endpoint}`);
        
        const url = `${getBaseUrl()}/api/v1/users/${userId}/${endpoint}/${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
        console.log("Request URL:", url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load ${type}`);
        }
        
        data = await response.json();
        console.log(`${type} data:`, data);
      }
      
      // Handle paginated response
      const users = data.results ? data.results : Array.isArray(data) ? data : [];
      
      if (type === 'followers') {
        setFollowers(users);
      } else {
        setFollowing(users);
      }
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      // Set empty array on error to prevent map issues
      if (type === 'followers') {
        setFollowers([]);
      } else {
        setFollowing([]);
      }
      handleApiError(err, setError);
    } finally {
      setLoadingConnections(false);
    }
  }, [isOwnProfile, userId, searchTerm]);
  
  // Handle navigation to a user's profile
  const navigateToProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>;
  }

  if (!userData) {
    return <div className="error">Unable to load user data. Please login again.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header-section">
        <div 
          className="profile-cover" 
          style={
            previewCoverImage || userData.cover_photo_url 
            ? {backgroundImage: `url(${previewCoverImage || userData.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center'} 
            : {}
          }
          onClick={() => userData.cover_photo_url && !isEditing && openImageViewer(userData.cover_photo_url, 'cover')}
        >
          {isEditing && (
            <div className="cover-photo-overlay" onClick={triggerCoverInput}>
              <div className="cover-upload-button">
                <span className="camera-icon">📷</span>
                <span>{userData.cover_photo_url ? 'Change Cover Photo' : 'Add Cover Photo'}</span>
              </div>
            </div>
          )}
          {userData.cover_photo_url && !isEditing && (
            <div className="view-cover-overlay">
              <div className="view-cover-button">
                <span className="view-icon">👁️</span>
                <span>View Cover Photo</span>
              </div>
            </div>
          )}
          <div className="profile-actions-top">
            {!isEditing && isOwnProfile && (
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
            <div 
              className="profile-image-wrapper"
              onClick={() => userData.profile_picture_url && !isEditing && openImageViewer(userData.profile_picture_url, 'profile')}
            >
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
              
              {userData.profile_picture_url && !isEditing && (
                <div className="view-profile-image-overlay">
                  <span className="view-icon">👁️</span>
                  <span>View</span>
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
          <div className="user-name-actions">
            <h2 className="user-name">
              {userData.first_name || userData.last_name 
                ? `${userData.first_name || ''} ${userData.last_name || ''}`
                : userData.username}
            </h2>
            {!isOwnProfile && !isEditing && parseInt(userId) !== currentUserId && (
              <div className="user-actions">
                {isFollowing ? (
                  <button 
                    className="btn-unfollow" 
                    onClick={handleUnfollow}
                    disabled={followActionLoading}
                  >
                    {followActionLoading ? 'Processing...' : 'Unfollow'}
                  </button>
                ) : (
                  <button 
                    className="btn-follow" 
                    onClick={handleFollow}
                    disabled={followActionLoading}
                  >
                    {followActionLoading ? 'Processing...' : 'Follow'}
                  </button>
                )}
                <button 
                  className="btn-message" 
                  onClick={() => handleDirectMessage(userId)}
                >
                  Message
                </button>
              </div>
            )}
          </div>
          <div className="user-badges">
            {userData.is_event_organizer && <span className="user-badge organizer">Event Organizer</span>}
            {userData.is_venue_owner && <span className="user-badge venue-owner">Venue Owner</span>}
            {!userData.is_event_organizer && !userData.is_venue_owner && 
              <span className="user-badge standard">Standard User</span>}
          </div>
          {(isOwnProfile || (!isOwnProfile && (followersCount !== undefined || followingCount !== undefined))) && (
            <div className="user-stats">
              <div className="stat-item" onClick={openFollowersModal}>
                <span className="stat-count">{followersCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item" onClick={openFollowingModal}>
                <span className="stat-count">{followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content-section">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="error-dismiss">×</button>
          </div>
        )}
        
        {isEditing ? (
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
        ) : (
          <div className="profile-about-content">
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
        )}
      </div>
      
      {/* Followers Modal */}
      <ConnectionsModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        connectionType="followers"
        connections={followers}
        loadConnections={loadConnections}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loadingConnections={loadingConnections}
        currentUserId={currentUserId}
        navigateToProfile={navigateToProfile}
        handleDirectMessage={handleDirectMessage}
        userId={userId}
        followersCount={followersCount}
        followingCount={followingCount}
      />
      
      {/* Following Modal */}
      <ConnectionsModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
        connectionType="following"
        connections={following}
        loadConnections={loadConnections}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loadingConnections={loadingConnections}
        currentUserId={currentUserId}
        navigateToProfile={navigateToProfile}
        handleDirectMessage={handleDirectMessage}
        userId={userId}
        followersCount={followersCount}
        followingCount={followingCount}
      />
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewImageModal.isOpen}
        onClose={closeImageViewer}
        imageUrl={viewImageModal.imageUrl}
        imageType={viewImageModal.imageType}
      />
    </div>
  );
}

export default Profile;