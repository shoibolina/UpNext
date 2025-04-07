import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as eventServices from '../../services/eventServices';
import * as ticketService from '../../services/ticketService';
import authService from '../../services/authService';
import './TicketVerification.css';

// Import HTML5QrcodeScanner directly
// This will only be used for type checking, actual import happens dynamically
let Html5QrcodeScanner;

function TicketVerification() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [verificationLocation, setVerificationLocation] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Scanner ref
  const scannerRef = useRef(null);
  const qrBoxRef = useRef(null);
  
  // Check if current user is authorized to verify tickets
  const currentUser = authService.getCurrentUserSync();
  const isOrganizer = event && currentUser && event.organizer && event.organizer.id === currentUser.id;
  const isAdmin = currentUser && (currentUser.is_staff || currentUser.is_superuser);

  // Load event data on component mount
  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Fetch event and ticket data
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch event details
        const eventData = await eventServices.getEventById(id);
        setEvent(eventData);
        
        // Check if user is organizer or admin
        const user = authService.getCurrentUserSync();
        if (!user || (eventData.organizer.id !== user.id && !user.is_staff && !user.is_superuser)) {
          setError('You do not have permission to verify tickets for this event');
          setLoading(false);
          return;
        }
        
        // Fetch tickets for the event
        const eventTickets = await ticketService.getEventTickets(id);
        setTickets(eventTickets);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  // Function to clean up the scanner
  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        console.log("Scanner cleared");
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      scannerRef.current = null;
    }
    
    // Clean up the HTML element manually
    if (qrBoxRef.current) {
      qrBoxRef.current.innerHTML = '';
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupScanner();
    };
  }, []);

  // Handle scanner visibility
  useEffect(() => {
    const setupScanner = async () => {
      // If we need to show the scanner and it's not already initialized
      if (showQrScanner && !scannerRef.current && !isProcessing) {
        try {
          // Save reference to QR box element
          qrBoxRef.current = document.getElementById('qr-reader');
          
          // Clear any existing content
          if (qrBoxRef.current) {
            qrBoxRef.current.innerHTML = '';
          }
          
          // Dynamically import the scanner library
          const Html5QrCodeScanner = (await import('html5-qrcode')).Html5QrcodeScanner;
          
          // Create a new scanner
          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { 
              fps: 5, 
              qrbox: { width: 250, height: 250 }, 
              rememberLastUsedCamera: true,
              aspectRatio: 1
            },
            false
          );
          
          // Store scanner in ref
          scannerRef.current = scanner;
          
          // Render the scanner with callback functions
          scanner.render(onScanSuccess, onScanFailure);
          console.log("Scanner initialized");
        } catch (error) {
          console.error("Error setting up scanner:", error);
          setError("Could not initialize camera scanner");
        }
      } else if (!showQrScanner && scannerRef.current) {
        // Clean up scanner when hiding
        cleanupScanner();
      }
    };
    
    setupScanner();
  }, [showQrScanner, isProcessing]);

  // QR scan success handler
  const onScanSuccess = async (decodedText) => {
    // Prevent multiple scans
    if (isProcessing) {
      return;
    }
    
    // Set processing flag to prevent multiple submissions
    setIsProcessing(true);
    console.log("QR Code detected:", decodedText);
    
    try {
      // Hide scanner and show loading
      setShowQrScanner(false);
      setLoading(true);
      
      // Process the scanned QR code
      const result = await ticketService.verifyTicketByQR(decodedText, verificationLocation);
      
      // Clean up scanner
      cleanupScanner();
      
      // Refresh ticket list
      const updatedTickets = await ticketService.getEventTickets(id);
      setTickets(updatedTickets);
      
      // Show success
      setVerificationResult({
        success: true,
        message: 'Ticket successfully verified!',
        ticket: result.ticket
      });
      
      // Set verification in progress to prevent new scans
      setVerificationInProgress(true);
      
    } catch (error) {
      console.error("Verification error:", error);
      
      // Show failure
      setVerificationResult({
        success: false,
        message: error.message || 'Failed to verify ticket'
      });
      
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // QR scan failure handler - normal during scanning
  const onScanFailure = (error) => {
    // We don't need to handle this, it's called when no QR is in view
    if (error !== "No QR code found.") {
      console.log("QR scan error:", error);
    }
  };

  // Handle manual verification form submission
  const handleManualVerification = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      setLoading(true);
      
      // Verify ticket
      const result = await ticketService.verifyTicket(ticketNumber, verificationLocation);
      
      // Refresh ticket list
      const updatedTickets = await ticketService.getEventTickets(id);
      setTickets(updatedTickets);
      
      // Show success
      setVerificationResult({
        success: true,
        message: 'Ticket successfully verified!',
        ticket: result.ticket
      });
      
      // Clear form and set verification in progress
      setTicketNumber('');
      setVerificationInProgress(true);
      
    } catch (error) {
      console.error("Manual verification error:", error);
      
      // Show failure
      setVerificationResult({
        success: false,
        message: error.message || 'Failed to verify ticket'
      });
      
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Fix for scanner not showing camera view
const toggleQrScanner = async () => {
    if (verificationInProgress || isProcessing) {
      return;
    }
    
    // If we're trying to show the scanner
    if (!showQrScanner) {
      // First update state to show scanner
      setShowQrScanner(true);
      
      // Give time for the DOM to update with the qr-reader div
      setTimeout(async () => {
        try {
          // Make sure we have the element
          qrBoxRef.current = document.getElementById('qr-reader');
          
          if (qrBoxRef.current) {
            // Ensure it's empty
            qrBoxRef.current.innerHTML = '';
            
            // Import the scanner library
            const { Html5QrcodeScanner } = await import('html5-qrcode');
            
            // Create and render scanner
            const scanner = new Html5QrcodeScanner(
              "qr-reader",
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 }, 
                rememberLastUsedCamera: true,
                aspectRatio: 1
              },
              false
            );
            
            scannerRef.current = scanner;
            scanner.render(onScanSuccess, onScanFailure);
            console.log("Scanner initialized with direct approach");
          }
        } catch (error) {
          console.error("Error initializing scanner:", error);
          setError("Could not access camera. Please check permissions.");
        }
      }, 100);
    } else {
      // Hide scanner and clean up
      cleanupScanner();
      setShowQrScanner(false);
    }
  };    

  // Reset verification to check another ticket
  const handleResetVerification = () => {
    setVerificationResult(null);
    setVerificationInProgress(false);
    setIsProcessing(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      return timeString.substring(0, 5);
    } catch {
      return timeString;
    }
  };

  // Permission denied view
  if (error === 'You do not have permission to verify tickets for this event') {
    return (
      <div className="ticket-verification-container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate(`/events/${id}`)}>
            Back to Event
          </button>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading && !event) {
    return <div className="loading">Loading verification system...</div>;
  }

  // Event not found view
  if (!event) {
    return <div className="error-message">Event not found</div>;
  }

  // Main ticket verification view
  return (
    <div className="ticket-verification-container">
      <div className="verification-header">
        <h1>Ticket Verification</h1>
        <h2>{event.title}</h2>
        <p className="event-datetime">
          {formatDate(event.start_date)} at {formatTime(event.start_time)}
        </p>
      </div>

      <div className="verification-options">
        <div className="verification-option-card">
          <h3>Scan QR Code</h3>
          <p>Use the camera to scan attendee ticket QR codes</p>
          <button 
            className={`btn-primary ${showQrScanner ? 'active' : ''}`} 
            onClick={toggleQrScanner}
            disabled={verificationInProgress || isProcessing}
          >
            {showQrScanner ? 'Hide Scanner' : 'Open Scanner'}
          </button>
        </div>

        <div className="verification-option-card">
          <h3>Enter Ticket Number</h3>
          <form onSubmit={handleManualVerification}>
            <div className="form-group">
              <label htmlFor="ticket-number">Ticket Number</label>
              <input
                id="ticket-number"
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="e.g. EVENT-000123-abc123"
                disabled={verificationInProgress || isProcessing}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="verification-location">Location (Optional)</label>
              <input
                id="verification-location"
                type="text"
                value={verificationLocation}
                onChange={(e) => setVerificationLocation(e.target.value)}
                placeholder="e.g. Main Entrance"
                disabled={verificationInProgress || isProcessing}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !ticketNumber.trim() || verificationInProgress || isProcessing}
            >
              Verify Ticket
            </button>
          </form>
        </div>
      </div>

      {showQrScanner && (
        <div className="qr-scanner-container">
          <div id="qr-reader"></div>
          <p className="scanner-instructions">
            Position the QR code in front of your camera
          </p>
        </div>
      )}

{verificationResult && (
  <div className={`verification-result ${verificationResult.success ? 'success' : 'failure'}`}>
    <h3>{verificationResult.success ? 'Ticket Verified!' : 'Verification Failed'}</h3>
    <p>{verificationResult.message}</p>
    {verificationResult.ticket && (
      <div className="verified-ticket-info">
        <div className="ticket-detail">
          <span className="label">Ticket Number:</span>
          <span className="value">{verificationResult.ticket.ticket_number || 'N/A'}</span>
        </div>
        <div className="ticket-detail">
          <span className="label">Type:</span>
          <span className="value">{verificationResult.ticket.ticket_type || 'Standard'}</span>
        </div>
        {verificationResult.ticket.attendee && (
          <>
            <div className="ticket-detail">
              <span className="label">Attendee Name:</span>
              <span className="value">
                {verificationResult.ticket.attendee_name || 
                 (verificationResult.ticket.attendee.user && 
                  `${verificationResult.ticket.attendee.user.first_name || ''} ${verificationResult.ticket.attendee.user.last_name || ''}`.trim()) || 
                 'Unknown'}
              </span>
            </div>
            <div className="ticket-detail">
              <span className="label">Email:</span>
              <span className="value">
                {verificationResult.ticket.attendee.user?.email || 'Not provided'}
              </span>
            </div>
            {verificationResult.ticket.attendee.user?.profile?.phone_number && (
              <div className="ticket-detail">
                <span className="label">Phone:</span>
                <span className="value">
                  {verificationResult.ticket.attendee.user.profile.phone_number}
                </span>
              </div>
            )}
          </>
        )}
        <div className="ticket-detail">
          <span className="label">Event:</span>
          <span className="value">
            {verificationResult.ticket.event_details?.title || 'Unknown Event'}
          </span>
        </div>
        <div className="ticket-detail">
          <span className="label">Issued:</span>
          <span className="value">
            {verificationResult.ticket.issue_date ? 
              new Date(verificationResult.ticket.issue_date).toLocaleString() : 
              'N/A'}
          </span>
        </div>
        <div className="ticket-detail">
          <span className="label">Status:</span>
          <span className="value status-badge">
            {verificationResult.ticket.status || 'Unknown'}
          </span>
        </div>
      </div>
    )}
    <button 
      className="btn-primary mt-4"
      onClick={handleResetVerification}
      disabled={isProcessing}
    >
      Verify Another Ticket
    </button>
  </div>
)}

      <div className="recent-verifications">
        <h3>Recent Ticket Verifications</h3>
        {tickets.filter(ticket => ticket.status === 'used').length > 0 ? (
          <div className="verifications-list">
            {tickets
              .filter(ticket => ticket.status === 'used')
              .sort((a, b) => new Date(b.used_date) - new Date(a.used_date))
              .slice(0, 10)
              .map(ticket => (
                <div key={ticket.id} className="verification-item">
                  <div className="verification-status success">✓</div>
                  <div className="verification-details">
                    <div className="ticket-number">{ticket.ticket_number}</div>
                    <div className="attendee-name">
                      {ticket.attendee_name || 'Unknown Attendee'}
                    </div>
                    <div className="verification-time">
                      {new Date(ticket.used_date).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="no-verifications">No tickets have been verified yet</p>
        )}
      </div>

      <div className="tickets-summary">
        <h3>Tickets Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-value">{tickets.length}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {tickets.filter(ticket => ticket.status === 'active').length}
            </div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {tickets.filter(ticket => ticket.status === 'used').length}
            </div>
            <div className="stat-label">Used</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {tickets.filter(ticket => ticket.status === 'cancelled').length}
            </div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>
      </div>

      <div className="verification-actions">
        <button className="btn-secondary" onClick={() => navigate(`/events/${id}`)}>
          Back to Event
        </button>
      </div>
    </div>
  );
}

export default TicketVerification;