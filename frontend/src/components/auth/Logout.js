import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function Logout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('user');
    
    navigate('/login');
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  );
}

export default Logout;