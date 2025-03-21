import React from 'react';
import Event from './Event';

function Home() {
    const mockEvents = [
        {
          id: 1,
          title: "Tech Conference 2025",
          date: "April 15, 2025",
          venue: "Atlanta Convention Center",
          description: "A gathering of tech leaders discussing AI, Web3, and more."
        },
        {
          id: 2,
          title: "Live Music Night",
          date: "March 29, 2025",
          venue: "The Tabernacle",
          description: "Enjoy an evening with local bands and artists."
        },
        {
          id: 3,
          title: "Startup Pitch Fest",
          date: "May 3, 2025",
          venue: "Emory Goizueta Auditorium",
          description: "Students and entrepreneurs pitch their startup ideas to VCs."
        },
    ];

    return (
        <div style={{ padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Upcoming Events</h1>
          {mockEvents.map(event => (
            <Event key={event.id} event={event} />
          ))}
        </div>
      );
      
}

export default Home;