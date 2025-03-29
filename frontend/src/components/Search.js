import React, { useState } from 'react';
import Event, { mockEvents } from '../components/Event';

const Search = () => {
    const [query, setQuery] = useState('');

    const filteredEvents = mockEvents.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase()) ||
        event.venue.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Search Events</h2>
                <button
                    className="btn btn-secondary"
                    onClick={() => window.location.href = '/'}
                >
                    Home
                </button>
            </div>
            <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: '0.5rem', marginBottom: '1rem', width: '100%' }}
            />
            {filteredEvents.length > 0 ? (
                filteredEvents.map(event => <Event key={event.id} event={event} />)
            ) : (
                <p>No events found.</p>
            )}
        </div>
    );
};

export default Search;
