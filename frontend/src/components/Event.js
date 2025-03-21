import React from 'react';
import './Event.css';

function Event({ event }) {
    return (
        <div className="event-card">
            <h3>{event.title}</h3>
            <p>{event.date} • {event.venue}</p>
            <p>{event.description}</p>
            </div>
    );
}

export default Event;