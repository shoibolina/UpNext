import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="main-footer">
      <div className="container footer-container">
        <div className="footer-section">
          <h3>UpNext</h3>
          <p>Discover and join local events, or create your own!</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/venues">Venues</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Help & Support</h3>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} UpNext. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;