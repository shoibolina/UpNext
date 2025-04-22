import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import messagingService from '../../services/messagingService';
import './AttendeeList.css';

function AttendeeList({ eventId, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  // Fetch attendees for the event
  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        setLoading(true);
        const response = await eventServices.getEventAttendees(eventId);
        setAttendees(response);
      } catch (err) {
        console.error('Error fetching attendees:', err);
        setError(err.message || 'Failed to load attendees. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendees();
  }, [eventId]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (searchTerm && document.activeElement === searchInputRef.current) {
          // Clear search if search is active and has content
          setSearchTerm('');
        } else {
          // Close modal if search is not focused or is empty
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, searchTerm]);

  // Focus search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleRemoveAttendee = async (attendeeId) => {
    if (window.confirm('Are you sure you want to remove this attendee? Their registration and ticket will be cancelled.')) {
      try {
        setIsRemoving(true);
        await eventServices.removeAttendee(eventId, attendeeId);
        // Update the attendee list
        setAttendees(attendees.filter(attendee => attendee.id !== attendeeId));
      } catch (err) {
        console.error('Error removing attendee:', err);
        alert(err.message || 'Failed to remove attendee. Please try again.');
      } finally {
        setIsRemoving(false);
      }
    }
  };

  const handleMessageUser = async (userId) => {
    try {
      const response = await messagingService.getDirectChat(userId);
      // Navigate to chat
      navigate(`/messages/${response.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Could not start chat. Please try again.');
    }
  };

  // Filter attendees based on search term
  const filteredAttendees = searchTerm 
    ? attendees.filter(attendee => 
        (attendee.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (attendee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (attendee.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (attendee.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      ) 
    : attendees;

  return (
    <div className="attendee-list-modal">
      <div className="attendee-list-content" ref={modalRef}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>Event Attendees</h2>
        
        <div className="search-container">
          <input 
            type="text" 
            ref={searchInputRef}
            placeholder="Search attendees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="loading-indicator">Loading attendees...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="attendees-count">
              {filteredAttendees.length} {filteredAttendees.length === 1 ? 'attendee' : 'attendees'} found
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            
            {filteredAttendees.length > 0 ? (
              <ul className="attendees-list">
                {filteredAttendees.map(attendee => (
                  <li key={attendee.id} className="attendee-item">
                    <div className="attendee-info">
                      <Link to={`/profile/${attendee.user.id}`} className="attendee-name">
                        {attendee.user.username || attendee.user.email || 'Unknown'}
                      </Link>
                      <span className={`attendee-status ${attendee.status}`}>
                        {attendee.status}
                      </span>
                      {attendee.ticket && (
                        <span className="attendee-ticket-status">
                          Ticket: {attendee.ticket.status}
                        </span>
                      )}
                    </div>
                    <div className="attendee-actions">
                      <button 
                        className="btn-message" 
                        onClick={() => handleMessageUser(attendee.user.id)}
                        title="Message attendee"
                      >
                        <i className="icon-message"></i> Message
                      </button>
                      <button 
                        className="btn-remove" 
                        onClick={() => handleRemoveAttendee(attendee.id)}
                        disabled={isRemoving}
                        title="Remove attendee"
                      >
                        <i className="icon-remove"></i> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-attendees">
                {searchTerm ? 'No attendees found matching your search.' : 'No attendees registered for this event yet.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AttendeeList;