import React from 'react';
import './Ticket.css';

function Ticket({ ticket, event }) {
  if (!ticket) return <div className="error">Ticket not found</div>;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // Convert 24-hour time to 12-hour format with AM/PM
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${period}`;
    } catch {
      return timeString;
    }
  };

  // Get API URL from environment or use default
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  // Helper to ensure QR code URL is absolute
  const getQrCodeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${API_URL}${url}`;
    return `${API_URL}/${url}`;
  };

  console.log("Original QR code URL:", ticket.qr_code_url);
  const fullQrCodeUrl = getQrCodeUrl(ticket.qr_code_url);
  console.log("Full QR code URL:", fullQrCodeUrl);

  return (
    <div className="ticket-container">
      <div className="ticket-header">
        <h2>Event Ticket</h2>
        <span className={`ticket-status status-${ticket.status}`}>{ticket.status}</span>
      </div>
      
      <div className="ticket-content">
        <div className="ticket-event-info">
          <h3>{event?.title || ticket.event_details?.title || 'Event'}</h3>
          <p className="ticket-date">
            {formatDate(event?.start_date || ticket.event_details?.start_date)} at {formatTime(event?.start_time || ticket.event_details?.start_time)}
          </p>
          <p className="ticket-location">
            {event?.venue?.name || ticket.event_details?.venue?.name || event?.address || ticket.event_details?.address || 'Location TBD'}
          </p>
        </div>
        
        <div className="ticket-details">
          <div className="ticket-info-row">
            <span className="ticket-label">Ticket #:</span>
            <span className="ticket-value">{ticket.ticket_number}</span>
          </div>
          <div className="ticket-info-row">
            <span className="ticket-label">Type:</span>
            <span className="ticket-value">{ticket.ticket_type || 'Standard'}</span>
          </div>
          {ticket.seat_info && (
            <div className="ticket-info-row">
              <span className="ticket-label">Seat:</span>
              <span className="ticket-value">{ticket.seat_info}</span>
            </div>
          )}
          <div className="ticket-info-row">
            <span className="ticket-label">Issued:</span>
            <span className="ticket-value">{formatDate(ticket.issue_date)}</span>
          </div>
        </div>

        <div className="ticket-qr-section">
          {fullQrCodeUrl ? (
            <img 
              src={fullQrCodeUrl} 
              alt="Ticket QR Code" 
              className="ticket-qr-code" 
              onError={(e) => {
                console.error("Error loading QR code image:", e);
                e.target.style.display = 'none'; 
                e.target.parentNode.innerHTML = '<div class="qr-placeholder">QR Code Loading Error</div>';
              }}
            />
          ) : (
            <div className="qr-placeholder">QR Code Unavailable</div>
          )}
          <p className="qr-instructions">Present this QR code at the event entrance</p>
        </div>
      </div>
      
      <div className="ticket-footer">
        <p className="ticket-terms">This ticket is non-transferable and valid only for the registered attendee.</p>
      </div>
    </div>
  );
}

export default Ticket;