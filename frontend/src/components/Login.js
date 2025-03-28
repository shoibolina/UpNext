import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

function Login({ onLoginSuccess, onSwitchToSignup }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [errors, setErrors] = useState ({});

  const validateInputs = () => {
    const newErrors = {};
    
    if (!username.trim ()) {
      newErrors.username = 'Username is required.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors (newErrors);
    return Object.keys (newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: "include",
        body: JSON.stringify({ username, password }),

      });

      const data = await response.json();
      if (response.ok) {
        onLoginSuccess(data.access_token, data.username);
      } else {
        // eslint-disable-next-line no-alert
        alert(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error during login:', error);
      // eslint-disable-next-line no-alert
      alert('Login failed. Please try again later.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Log In</button>
      </form>
      <p>
        Don&apos;t have an account?
        {' '}
        <button type="button" onClick={() => navigate('/signup')}>Sign Up</button>
      </p>
    </div>
  );
}

Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
  onSwitchToSignup: PropTypes.func.isRequired,
};

export default Login;