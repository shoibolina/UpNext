import React from 'react';
import Event, { mockEvents } from '../components/Event';

function Home() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>Upcoming Events</h1>
        <div>
          <button className="btn btn-primary" onClick={() => window.location.href = '/search'}>Search</button>
          <button className="btn btn-secondary ml-2" onClick={() => window.location.href = '/profile'}>My Profile</button>
        </div>
      </div>
      {mockEvents.map(event => (
        <Event key={event.id} event={event} />
      ))}
    </div>
  );
}

export default Home;
