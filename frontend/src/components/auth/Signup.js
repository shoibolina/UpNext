import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    bio: '',
    is_event_organizer: false,
    is_venue_owner: false,
    profile: {
      phone_number: '',
      address: '',
      city: '',
      state: '',
      zip_code: ''
    }
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('profile_')) {
      const field = name.replace('profile_', '');
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();

    if (!formData.username) return setError('Username is required');
    if (!formData.email) return setError('Email is required');
    if (!formData.password || formData.password.length < 8)
      return setError('Password must be at least 8 characters');
    if (formData.password !== formData.password2)
      return setError('Passwords do not match');

    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.register(formData);
      if (result.access) {
        localStorage.setItem('token', result.access);
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        navigate('/dashboard');
      } else {
        setError('Registration succeeded but no token returned.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Create an Account</h2>
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleNextStep}>
            <div className="form-group">
              <label htmlFor="username">Username*</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
              />
              <small>Must be at least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="password2">Confirm Password*</label>
              <input
                type="password"
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-button">
              Next Step
            </button>

            <p className="login-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Complete Your Profile</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>I want to:</label>
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_event_organizer"
                  checked={formData.is_event_organizer}
                  onChange={handleChange}
                />
                Organize Events
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_venue_owner"
                  checked={formData.is_venue_owner}
                  onChange={handleChange}
                />
                List Venues
              </label>
            </div>
          </div>

          <h3>Contact Information</h3>

          <div className="form-group">
            <label htmlFor="profile_phone_number">Phone Number</label>
            <input
              type="tel"
              id="profile_phone_number"
              name="profile_phone_number"
              value={formData.profile.phone_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile_address">Address</label>
            <input
              type="text"
              id="profile_address"
              name="profile_address"
              value={formData.profile.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile_city">City</label>
              <input
                type="text"
                id="profile_city"
                name="profile_city"
                value={formData.profile.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile_state">State</label>
              <input
                type="text"
                id="profile_state"
                name="profile_state"
                value={formData.profile.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile_zip_code">ZIP Code</label>
              <input
                type="text"
                id="profile_zip_code"
                name="profile_zip_code"
                value={formData.profile.zip_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="submit"
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
