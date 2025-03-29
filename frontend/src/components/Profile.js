import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
    const [user, setUser] = useState({ name: '', email: '', password: '' });
    const [myEvents, setMyEvents] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/profile', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setUser({
                    name: response.data.name,
                    email: response.data.email,
                    password: ''
                });
                setMyEvents(response.data.events || []);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('http://localhost:5000/profile', user, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Error updating profile. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-gray-800">My Profile</h2>
                <a
                    href="/"
                    className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 shadow"
                >
                    Home
                </a>
            </div>

            {message && <p className="text-green-600 mb-4">{message}</p>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 mb-6">
                <div>
                    <label className="block mb-1 font-medium">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
                        disabled
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">New Password</label>
                    <input
                        type="password"
                        name="password"
                        value={user.password}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
                >
                    Update Profile
                </button>
            </form>

            <div className="bg-white p-6 rounded shadow">
                <h3 className="text-xl font-semibold mb-4">My Registered Events</h3>
                {myEvents.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-1">
                        {myEvents.map((event, index) => (
                            <li key={index}>
                                {event.title} - {event.date} @ {event.venue}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">You haven't registered for any events yet.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;