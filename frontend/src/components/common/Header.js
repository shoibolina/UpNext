import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Header.css';

function Header() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">UpNext</Link>
        </div>
        
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/events">Events</Link></li>
            <li><Link to="/venues">Venues</Link></li>
          </ul>
        </nav>
        
        <div className="auth-nav">
          {isAuthenticated ? (
            <>
              <Link to="/messages" className="nav-link">Messages</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn-primary nav-button">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;