import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import messagingService from '../../services/messagingService';
import authService from '../../services/authService';
import './Messaging.css';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const currentUser = authService.getCurrentUserSync();

  const setupWebSocketHandler = useCallback(() => {
    console.log("Setting up WebSocket handler");
    messagingService.webSocket.onChatList((data) => {
      console.log("WebSocket received data:", data);
      
      // Safety checks
      if (!data) {
        console.error("Received null/undefined data from WebSocket");
        return;
      }
      
      // Make sure we have a proper array
      if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error("Expected array, received:", typeof data);
        // Try to handle different data formats
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else if (data.results && Array.isArray(data.results)) {
          setConversations(data.results);
        }
      }
    });
    
    // Add connection status handlers
    const originalOnOpen = messagingService.webSocket.chatListSocket.onopen;
    messagingService.webSocket.chatListSocket.onopen = (event) => {
      console.log("WebSocket connected!", event);
      setWsStatus('connected');
      if (originalOnOpen) originalOnOpen(event);
    };
    
    const originalOnClose = messagingService.webSocket.chatListSocket.onclose;
    messagingService.webSocket.chatListSocket.onclose = (event) => {
      console.log("WebSocket disconnected:", event);
      setWsStatus('disconnected');
      if (originalOnClose) originalOnClose(event);
    };
    
    const originalOnError = messagingService.webSocket.chatListSocket.onerror;
    messagingService.webSocket.chatListSocket.onerror = (event) => {
      console.error("WebSocket error:", event);
      setWsStatus('error');
      if (originalOnError) originalOnError(event);
    };
  }, []);

  useEffect(() => {
    // Fetch conversations when component mounts
    fetchConversations();

    // Connect to WebSocket and set up handler
    try {
      messagingService.webSocket.connectToChatList();
      setupWebSocketHandler();
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      setError(`WebSocket connection failed: ${error.message}`);
    }

    return () => {
      console.log("Unmounting, disconnecting WebSockets");
      messagingService.disconnectWebSockets();
    };
  }, [setupWebSocketHandler]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversations();
      console.log("API returned conversations:", data);
      
      if (data && data.results && Array.isArray(data.results)) {
        setConversations(data.results);
      } else if (Array.isArray(data)) {
        setConversations(data);
      } else {
        console.error("Unexpected data format:", data);
        setConversations([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Please try again.');
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
      }
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return '';
    }
  };

  const getConversationName = (conversation) => {
    if (!conversation) return 'Unknown';
    
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return 'Unknown';
    }
    
    if (!currentUser) return 'Loading...';
    
    const otherParticipants = conversation.participants.filter(
      participant => participant && participant.id !== currentUser.id
    );

    if (!otherParticipants || otherParticipants.length === 0) {
      return 'Just you';
    } else if (otherParticipants.length === 1) {
      return otherParticipants[0].username || 'Unknown user';
    } else {
      const firstUser = otherParticipants[0].username || 'Unknown user';
      return `${firstUser} and ${otherParticipants.length - 1} others`;
    }
  };

  if (loading) {
    return <div className="loading">Loading conversations...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <p className="status">WebSocket status: {wsStatus}</p>
        <button onClick={() => {
          setError(null);
          fetchConversations();
          messagingService.disconnectWebSockets();
          messagingService.webSocket.connectToChatList();
          setupWebSocketHandler();
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
        <div className="status-container">
          <span className={`websocket-status ${wsStatus}`}>
            {wsStatus === 'connected' ? 'Online' : 'Offline'}
          </span>
          <Link to="/messages/new" className="new-message-button">
            New Message
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="no-conversations">
          <p>You don't have any conversations yet.</p>
          <Link to="/messages/new" className="start-conversation-button">
            Start a conversation
          </Link>
        </div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => {
            // Skip rendering if conversation doesn't have an id
            if (!conversation || !conversation.id) {
              console.warn("Invalid conversation object:", conversation);
              return null;
            }
            
            return (
              <Link
                to={`/messages/${conversation.id}`}
                key={conversation.id}
                className={`conversation-item ${conversation.unread_count > 0 ? 'unread' : ''}`}
              >
                <div className="conversation-avatar">
                  <div className="avatar-placeholder">
                    {getConversationName(conversation).charAt(0) || '?'}
                  </div>
                </div>
                <div className="conversation-content">
                  <div className="conversation-header">
                    <span className="conversation-name">
                      {getConversationName(conversation)}
                    </span>
                    <span className="conversation-time">
                      {conversation.last_message 
                        ? formatTimestamp(conversation.last_message.created_at) 
                        : ''}
                    </span>
                  </div>
                  <div className="conversation-preview">
                    {conversation.last_message ? (
                      <span className="message-preview">
                        {conversation.last_message.sender &&
                         currentUser &&
                         conversation.last_message.sender.id === currentUser.id ? (
                          <span className="message-sender">You: </span>
                        ) : null}
                        {conversation.last_message.content && 
                         conversation.last_message.content.length > 50
                          ? `${conversation.last_message.content.substring(0, 50)}...`
                          : conversation.last_message.content || ''}
                      </span>
                    ) : (
                      <span className="no-messages">No messages yet</span>
                    )}
                    {conversation.unread_count > 0 && (
                      <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Messages;