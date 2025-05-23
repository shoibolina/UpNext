import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Home.css';

const ButtonGroup = ({ isAuthenticated }) => {
  return isAuthenticated ? (
    <div className="home-button-group">
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      <Link to="/events" className="btn-secondary">Explore Events</Link>
    </div>
  ) : (
    <div className="home-button-group">
      <Link to="/login" className="btn-primary">Login</Link>
      <Link to="/signup" className="btn-secondary">Sign Up</Link>
    </div>
  );
};

const Feature = ({ title, description }) => {
  return (
    <div className="feature">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

function Home() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to UpNext</h1>
        <p>Discover and join local events, or create your own!</p>
        <ButtonGroup isAuthenticated={isAuthenticated} />
      </div>

      <div className="features-section">
        <Feature title="Find Events" description="Discover events that match your interests and schedule" />
        <Feature title="Book Venues" description="Find and reserve the perfect space for your next event" />
        <Feature title="Create Events" description="Organize and promote your own events to the community" />
      </div>
    </div>
  );
}

export default Home;
