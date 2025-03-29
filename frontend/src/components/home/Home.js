import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Home.css';

function Home() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to UpNext</h1>
        <p>Discover and join local events, or create your own!</p>
        
        {isAuthenticated ? (
          <div className="button-group">
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
            <Link to="/events" className="btn-secondary">Explore Events</Link>
          </div>
        ) : (
          <div className="button-group">
            <Link to="/login" className="btn-primary">Login</Link>
            <Link to="/signup" className="btn-secondary">Sign Up</Link>
          </div>
        )}
      </div>
      
      <div className="features-section">
        <div className="feature">
          <h3>Find Events</h3>
          <p>Discover events that match your interests and schedule</p>
        </div>
        
        <div className="feature">
          <h3>Book Venues</h3>
          <p>Find and reserve the perfect space for your next event</p>
        </div>
        
        <div className="feature">
          <h3>Create Events</h3>
          <p>Organize and promote your own events to the community</p>
        </div>
      </div>
    </div>
  );
}

export default Home;