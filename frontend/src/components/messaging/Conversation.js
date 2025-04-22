import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import messagingService from '../../services/messagingService';
import authService from '../../services/authService';
import ChatInput from './ChatInput';
import './Messaging.css';

function Conversation() {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const connectionRetryRef = useRef(null);
  
  const currentUser = authService.getCurrentUserSync();

  // Initialize and manage WebSocket connection
  const connectWebSocket = () => {
    try {
      messagingService.disconnectWebSockets(); // Ensure no existing connections
      messagingService.webSocket.connectToChat(id);
      setSocketConnected(true);
      console.log('WebSocket connected to conversation:', id);
      
      // Setup listeners
      setupWebSocketListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setSocketConnected(false);
      
      // Try to reconnect after 3 seconds
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
      }
      connectionRetryRef.current = setTimeout(connectWebSocket, 3000);
    }
  };

  useEffect(() => {
    // Fetch conversation and messages when component mounts or conversation ID changes
    fetchConversation();
    fetchMessages();

    // Connect to WebSocket for real-time messaging
    connectWebSocket();

    // Clean up WebSocket connection when component unmounts
    return () => {
      messagingService.disconnectWebSockets();
      if (connectionRetryRef.current) {
        clearTimeout(connectionRetryRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const setupWebSocketListeners = () => {
    // Listen for new messages
    messagingService.webSocket.onMessage((data) => {
      console.log("Received message data:", data);
      setMessages(prevMessages => {
        // Check if message already exists
        if (prevMessages.some(msg => msg.id === data.message_id)) {
          return prevMessages;
        }
        
        // Add new message
        const newMsg = {
          id: data.message_id,
          content: data.content,
          created_at: data.timestamp,
          sender: {
            id: data.user_id,
            username: data.username
          },
          reply_to: data.reply_to,
          reactions: [],
          read_by: []
        };
        
        return [...prevMessages, newMsg];
      });
      
      // Mark message as read
      messagingService.webSocket.sendReadReceipt(data.message_id);
    });
    
    // Listen for typing indicators
    messagingService.webSocket.onTyping((data) => {
      if (data.is_typing) {
            scrollToBottom();
      
        setTypingUsers(prev => {
          if (!prev.some(user => user.id === data.user_id)) {
            return [...prev, { id: data.user_id, username: data.username }];
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(user => user.id !== data.user_id));
      }
    });
    
    // Listen for read receipts
    messagingService.webSocket.onReadReceipt((data) => {
      console.log("Received read receipt:", data);
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === data.message_id) {
            // Check if this user already has a read receipt
            const alreadyRead = msg.read_by?.some(receipt => receipt.user.id === data.user_id);
            if (alreadyRead) {
              return msg;
            }
            
            return {
              ...msg,
              read_by: [
                ...(msg.read_by || []),
                { user: { id: data.user_id, username: data.username }, timestamp: data.timestamp }
              ]
            };
          }
          return msg;
        });
      });
    });
    
    // Listen for edited messages
    messagingService.webSocket.onEditMessage((data) => {
      console.log("Received edited message:", data);
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === data.message_id) {
            return {
              ...msg,
              content: data.content,
              edited_at: data.timestamp
            };
          }
          return msg;
        });
      });
    });
    
    // Listen for reactions
    messagingService.webSocket.onReaction((data) => {
      console.log("Received reaction:", data);
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === data.message_id) {
            // Remove existing reaction from this user if any
            const filteredReactions = (msg.reactions || []).filter(r => r.user.id !== data.user_id);
            
            return {
              ...msg,
              reactions: [
                ...filteredReactions,
                { 
                  user: { id: data.user_id, username: data.username },
                  reaction: data.reaction
                }
              ]
            };
          }
          return msg;
        });
      });
    });
    
    // Listen for removed reactions
    messagingService.webSocket.onRemoveReaction((data) => {
      console.log("Received removed reaction:", data);
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.id === data.message_id) {
            return {
              ...msg,
              reactions: (msg.reactions || []).filter(r => r.user.id !== data.user_id)
            };
          }
          return msg;
        });
      });
    });
    
    // Listen for user status changes
    messagingService.webSocket.onUserStatus((data) => {
      console.log("User status changed:", data);
      // You can implement user online/offline status handling here
    });
  };

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getConversation(id);
      setConversation(data);
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching conversation ${id}:`, error);
      setError('Failed to load conversation. Please try again.');
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await messagingService.getMessages(id, page);
      setMessages(prevMessages => {
        // Combine existing messages with new ones, removing duplicates
        const newMessages = [...(data.results || [])];
        const combinedMessages = [...prevMessages, ...newMessages];
        const uniqueMessages = Array.from(new Map(combinedMessages.map(msg => [msg.id, msg])).values());
        
        // Sort by timestamp
        return uniqueMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      
      
      setHasMore(!!data.next);
      setLoading(false);
      
      // Mark all messages as read
      if (data.results && data.results.length > 0) {
        data.results.forEach(msg => {
          if (msg.sender.id !== currentUser?.id) {
            messagingService.webSocket.sendReadReceipt(msg.id);
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching messages for conversation ${id}:`, error);
      setError('Failed to load messages. Please try again.');
      setLoading(false);
    }
  };

  const handleSendMessage = (content, replyToId = null) => {
    if (!socketConnected) {
      console.error('WebSocket is not connected');
      setError('Connection lost. Trying to reconnect...');
      connectWebSocket();
      return;
    }
    
    // Send message via WebSocket
    try {
      messagingService.webSocket.sendMessage(content, replyToId);
      
      // Clear reply
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleTyping = (isTyping) => {
    if (!socketConnected) {
      return;
    }
    
    // Send typing indicator
    try {
      messagingService.webSocket.sendTypingIndicator(isTyping);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  const handleEditMessage = (message) => {
    // Cancel any ongoing replies first
    setReplyTo(null);
    setEditingMessage(message);
  };

  const handleSaveEdit = (content) => {
    if (!socketConnected || !editingMessage) {
      return;
    }
    
    try {
      messagingService.webSocket.editMessage(editingMessage.id, content);
      setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleReply = (message) => {
    // Cancel any ongoing edits first
    setEditingMessage(null);
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleReaction = (message, reaction) => {
    if (!socketConnected) {
      return;
    }
    
    try {
      // Check if user already has this reaction
      const existingReaction = message.reactions?.find(r => 
        r.user.id === currentUser?.id && r.reaction === reaction
      );
      
      if (existingReaction) {
        // Remove reaction if already exists
        messagingService.webSocket.removeReaction(message.id);
      } else {
        // Add or update reaction
        messagingService.webSocket.addReaction(message.id, reaction);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      setError('Failed to add reaction. Please try again.');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
      fetchMessages();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
      ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get conversation name for display
  const getConversationName = () => {
    if (!conversation || !conversation.participants) {
      return 'Loading...';
    }
    
    // Filter out current user from participants
    const otherParticipants = conversation.participants.filter(
      participant => participant.id !== currentUser?.id
    );
    
    if (otherParticipants.length === 0) {
      return 'Just you';
    } else if (otherParticipants.length === 1) {
      return otherParticipants[0].username;
    } else {
      return `${otherParticipants[0].username} and ${otherParticipants.length - 1} others`;
    }
  };

  // Helper function to get emoji for reaction type
  const getReactionEmoji = (reaction) => {
    const reactions = {
      'like': '👍',
      'love': '❤️',
      'laugh': '😂',
      'wow': '😮',
      'sad': '😢',
      'angry': '😡'
    };
    
    return reactions[reaction] || '👍';
  };

  if (loading && messages.length === 0) {
    return <div className="loading">Loading conversation...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => {
          setError(null);
          fetchConversation();
          fetchMessages();
          connectWebSocket();
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="conversation-container">
      <div className="conversation-header">
        <Link to="/messages" className="back-button">
          <i className="fas fa-arrow-left"></i> Back
        </Link>
        <h2>{getConversationName()}</h2>
        {!socketConnected && (
          <div className="connection-status">
            <span className="offline-indicator">Offline</span>
          </div>
        )}
      </div>

      <div className="messages-wrapper" ref={messagesContainerRef}>
        {hasMore && (
          <div className="load-more-container">
            <button 
              className="load-more-button" 
              onClick={loadMoreMessages}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        <div className="messages-list">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message-item ${message.sender.id === currentUser?.id ? 'own-message' : 'other-message'}`}
            >
              {/* Reply indicator */}
              {message.reply_to && (
                <div className="reply-indicator">
                  <div className="reply-line"></div>
                  <div className="reply-content">
                    {messages.find(msg => msg.id === message.reply_to)?.content || 'Original message not found'}
                  </div>
                </div>
              )}
              
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">{message.sender.username}</span>
                  <span className="message-time">{formatTimestamp(message.created_at)}</span>
                </div>
                
                <div className="message-body">
                  {message.content}
                  {message.edited_at && <span className="edited-indicator"> (edited)</span>}
                </div>
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="message-reactions">
                    {Array.from(new Set(message.reactions.map(r => r.reaction))).map(reaction => {
                      const count = message.reactions.filter(r => r.reaction === reaction).length;
                      const hasReacted = message.reactions.some(r => 
                        r.user.id === currentUser?.id && r.reaction === reaction
                      );
                      
                      return (
                        <button 
                          key={reaction} 
                          className={`reaction-button ${hasReacted ? 'has-reacted' : ''}`}
                          onClick={() => handleReaction(message, reaction)}
                        >
                          {getReactionEmoji(reaction)} {count}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {message.sender.id === currentUser?.id && (
                <div className="read-receipts">
                    {message.read_by && message.read_by.some(receipt => 
                    receipt.user.id !== currentUser.id) ? (
                    <span className="read-indicator double-tick" title={`Read by ${message.read_by
                        .filter(receipt => receipt.user.id !== currentUser.id)
                        .map(receipt => receipt.user.username)
                        .join(', ')}`}>
                        ✓✓
                    </span>
                    ) : (
       
                    <span className="read-indicator single-tick" title="Sent">
                        ✓
                    </span>
                    )}
                </div>
                )}

              </div>
              
              <div className="message-actions">
                <button 
                  className="action-button reply-button" 
                  onClick={() => handleReply(message)}
                  title="Reply"
                >
                  ↩️
                </button>
                
                {message.sender.id === currentUser?.id && (
                  <button 
                    className="action-button edit-button" 
                    onClick={() => handleEditMessage(message)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                )}
                
                <div className="reaction-menu">
                  <button className="action-button react-button" title="React">
                    😊
                  </button>
                  <div className="reaction-options">
                    <button onClick={() => handleReaction(message, 'like')}>👍</button>
                    <button onClick={() => handleReaction(message, 'love')}>❤️</button>
                    <button onClick={() => handleReaction(message, 'laugh')}>😂</button>
                    <button onClick={() => handleReaction(message, 'wow')}>😮</button>
                    <button onClick={() => handleReaction(message, 'sad')}>😢</button>
                    <button onClick={() => handleReaction(message, 'angry')}>😡</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef}></div>
        </div>
        
        {typingUsers.length > 0 && typingUsers.every(user => user.id !== currentUser?.id) && (
          <div className="typing-indicator">
            {typingUsers.length === 1 
              ? `${typingUsers[0].username} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </div>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        editingMessage={editingMessage}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
}

export default Conversation;