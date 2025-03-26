import React, { useState } from 'react';
import PropTypes from 'prop-types';

function Signup({ onSignupSuccess, onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
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

