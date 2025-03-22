import React, { useState } from 'react';
import PropTypes from 'prop-types';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://127.0.0.1:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                onSignupSuccess(data.access_token, data.username); // Assuming backend returns username and token
            } else {
                // eslint-disable-next-line no-alert
                alert(data.error || 'Signup failed. Please check your details.');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error during signup:', error);
            // eslint-disable-next-line no-alert
            alert('Signup failed. Please try again later.');
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

