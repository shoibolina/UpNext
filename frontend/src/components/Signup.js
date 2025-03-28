import React, { useState } from 'react';
import PropTypes from 'prop-types';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const validateInputs = () => {
        const newErrors = {};
    
        // Username validation
        const usernameRegex = /^[a-zA-Z0-9_]+$/; //Ensure alphanumeric (no special symbols)
        if (!username.trim ()) {
          newErrors.username = 'Username is required.';
        } else if (username.length < 5) {
          newErrors.username = 'Username must be at least 5 characters long.';
        } else if (!usernameRegex.test (username)) {
          newErrors.username = 'Username can only contain letters, numbers, and underscores.';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim ()) {
        newErrors.email = 'An email is required.';
        } else if (!emailRegex.test (email)) {
        newErrors.email = 'Enter a valid email address.';
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!password) {
        newErrors.password = 'Password is required.';
        } else if (!passwordRegex.test (password)) {
        newErrors.password =
            'Password must be at least 6 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special character.';
        }

        // Confirm password validation
        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password.';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateInputs()) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });  

            const data = await response.json();
            if (response.ok) {
                onSignupSuccess(data.access_token, data.username);
            } else {

                alert(data.error || 'Registeration Failed');
            }
        } catch (error) {

            console.error('Error:', error);

            alert('Signup failed.');
        }
    };

    return (
        <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <br />
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <br />
                <button type="submit">Sign Up</button>
            </form>
            <p>
                Already have an account?
                {' '}
                <button type="button" onClick={onSwitchToLogin}>Log In</button>
            </p>
        </div>
    );
}

Signup.propTypes = {
    onSignupSuccess: PropTypes.func.isRequired,
    onSwitchToLogin: PropTypes.func.isRequired,
};

export default Signup;

