import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import messagingService from '../../services/messagingService';
import authService from '../../services/authService';
import './Messaging.css';

function NewConversation() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const navigate = useNavigate();
  const currentUser = authService.getCurrentUserSync();

  // Debounced fetch function
  const fetchUsers = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `http://127.0.0.1:8000/api/v1/users/search/?q=${encodeURIComponent(term.trim())}`;
      console.log('Fetching users from:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const otherUsers = data.filter((user) => user.id !== currentUser?.id);
      setUsers(otherUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  }, [currentUser]);

  // Handle input changes with proper debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout (500ms is a good debounce delay)
    const timeoutId = setTimeout(() => {
      // Only search if the term is at least 2 characters
      if (value.trim().length >= 2) {
        fetchUsers(value);
      } else {
        setUsers([]);
      }
    }, 500);
    
    setSearchTimeout(timeoutId);
  };

  // Clear search timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle ESC key to go back
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate('/messages');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.some((selected) => selected.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((selected) => selected.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateConversation = async () => {
    try {
      if (selectedUsers.length === 0) {
        setError('Please select at least one user to message');
        return;
      }
      
      // Check if initial message is required
      if (selectedUsers.length > 0 && !initialMessage.trim()) {
        const confirmed = window.confirm('You haven\'t written an initial message. Are you sure you want to create this conversation?');
        if (!confirmed) {
          return;
        }
      }
      
      const participantIds = selectedUsers.map((user) => user.id);
      const response = await messagingService.createConversation(
        participantIds,
        initialMessage.trim() || null
      );
      navigate(`/messages/${response.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation. Please try again.');
    }
  };

  const handleStartDirectChat = async (user) => {
    try {
      // Only start direct chat if there's an initial message
      if (!initialMessage.trim()) {
        setSelectedUsers([user]);
        document.getElementById('initial-message').focus();
        return;
      }
      
      const response = await messagingService.getDirectChat(user.id);
      
      // Send initial message if provided
      if (initialMessage.trim()) {
        // Navigate to the conversation and send message
        navigate(`/messages/${response.id}`);
        // The message will be sent after navigation
      } else {
        navigate(`/messages/${response.id}`);
      }
    } catch (error) {
      console.error('Error starting direct chat:', error);
      setError('Failed to start chat. Please try again.');
    }
  };
  
  // Handle cancel/back button
  const handleCancel = () => {
    navigate('/messages');
  };

  return (
    <div className="new-conversation-container">
      <div className="new-conversation-header">
        <h1>New Message</h1>
        <button onClick={handleCancel} className="cancel-button">
          Cancel
        </button>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users... (press ESC to go back)"
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="search-input"
          autoFocus
        />
      </div>
      
      <div className="selected-users">
        {selectedUsers.map((user) => (
          <div key={user.id} className="selected-user-tag">
            <span>{user.username}</span>
            <button
              className="remove-user-button"
              onClick={() => handleUserSelect(user)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <div className="user-list">
        {loading ? (
          <div className="loading">Searching users...</div>
        ) : error ? (
          <div className="error-message">
            {error}
            <button onClick={() => fetchUsers(searchTerm)}>Retry</button>
          </div>
        ) : users.length === 0 && searchTerm && searchTerm.length >= 2 ? (
          <div className="no-users">No users found</div>
        ) : users.length === 0 ? (
          <div className="no-users">
            {searchTerm.length < 2 ? 
              "Type at least 2 characters to search for users" : 
              "Start typing to search for users"}
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className={`user-item ${
                selectedUsers.some((selected) => selected.id === user.id)
                  ? 'selected'
                  : ''
              }`}
            >
              <div className="user-info" onClick={() => handleUserSelect(user)}>
                <div className="user-avatar">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt={user.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              <button
                className="direct-chat-button"
                onClick={() => handleStartDirectChat(user)}
                title="Start direct chat"
              >
                <i className="fas fa-comment"></i>
              </button>
            </div>
          ))
        )}
      </div>
      
      {selectedUsers.length > 0 && (
        <div className="initial-message-container">
          <textarea
            id="initial-message"
            placeholder="Write initial message (required)..."
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            className="initial-message-input"
          />
          <div className="button-container">
            <button
              className="cancel-conversation-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="create-conversation-button"
              onClick={handleCreateConversation}
              disabled={!initialMessage.trim()}
            >
              {selectedUsers.length === 1 ? 'Start Chat' : 'Create Group Chat'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewConversation;