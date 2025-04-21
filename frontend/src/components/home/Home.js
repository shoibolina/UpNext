import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Home.css';

import { FaCalendarAlt, FaMapMarkerAlt, FaPlusCircle } from 'react-icons/fa';

// Button group component based on login state
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

// Icon mapping by title
const featureIcons = {
  "Find Events": <FaCalendarAlt />,
  "Book Venues": <FaMapMarkerAlt />,
  "Create Events": <FaPlusCircle />
};

// Feature card with icon, title, description
const Feature = ({ title, description, index }) => {
  const icon = featureIcons[title] || null;
  const animationDelay = `${index * 0.1}s`; // Staggered fade-in

  return (
    <div className="feature" style={{ animationDelay }}>
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

// Main home component
function Home() {
  const isAuthenticated = authService.isAuthenticated();

  const features = [
    { title: "Find Events", description: "Discover events that match your interests and schedule" },
    { title: "Book Venues", description: "Find and reserve the perfect space for your next event" },
    { title: "Create Events", description: "Organize and promote your own events to the community" }
  ];

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to UpNext</h1>
        <p>Discover and join local events, or create your own!</p>
        <ButtonGroup isAuthenticated={isAuthenticated} />
      </div>

      <div className="features-section">
        {features.map((feature, index) => (
          <Feature
            key={index}
            index={index}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
}

export default Home;
