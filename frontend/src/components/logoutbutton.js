import React from 'react'
import authService from '../services/auth.js'
import {    useNavigate     } from 'react-router-dom'

function LogoutButton({ onLogout }) {
    const navigate = useNavigate();


    const handleLogout = () => {
        authService.logout();
        onLogout();
        navigate('/login');
    };

    return <button onClick={handleLogout}>Logout</button>;
}

export default LogoutButton;