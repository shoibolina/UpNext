import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Messaging.css';

function ChatInput({ 
  onSendMessage, 
  onTyping, 
  replyTo, 
  onCancelReply, 
  editingMessage, 
  onSaveEdit, 
  onCancelEdit 
}) {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Set initial message when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);
  
  // Focus input when replying
  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);
  
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator
    onTyping(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    if (editingMessage) {
      onSaveEdit(message);
    } else {
      onSendMessage(message, replyTo?.id);
    }
    
    // Clear input and stop typing indicator
    setMessage('');
    onTyping(false);
    
    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
  
  return (
    <div className="message-input-container">
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-preview-content">
            <span className="reply-label">Replying to {replyTo.sender.username}:</span>
            <span className="reply-text">{replyTo.content}</span>
          </div>
          <button className="cancel-reply-button" onClick={onCancelReply} title="Cancel reply">
            ✕
          </button>
        </div>
      )}
      
      {editingMessage && (
        <div className="edit-preview">
          <div className="edit-preview-content">
            <span className="edit-label">Editing message</span>
          </div>
          <button className="cancel-edit-button" onClick={onCancelEdit} title="Cancel edit">
            ✕
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          ref={inputRef}
          className="message-input"
          value={message}
          onChange={handleInputChange}
          placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
        />
        <button type="submit" className="send-button">
          {editingMessage ? 'Save' : 'Send'}
        </button>
      </form>
    </div>
  );
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onTyping: PropTypes.func.isRequired,
  replyTo: PropTypes.object,
  onCancelReply: PropTypes.func,
  editingMessage: PropTypes.object,
  onSaveEdit: PropTypes.func,
  onCancelEdit: PropTypes.func
};

export default ChatInput;