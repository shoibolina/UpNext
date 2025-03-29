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

export const mockEvents = [
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
    {
        id: 4,
        title: "Art & Wine Festival",
        date: "April 20, 2025",
        venue: "Piedmont Park",
        description: "An outdoor celebration of local art and wine tastings."
    },
    {
        id: 5,
        title: "Fitness Bootcamp",
        date: "April 2, 2025",
        venue: "Centennial Olympic Park",
        description: "Morning high-energy workout sessions for all levels."
    }
];

export default Event;
