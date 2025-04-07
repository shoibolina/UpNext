import React from 'react';
import './about.css';

function About() {
    return (
        <div className="about-container">
            <h1 className="about-header">About UpNext</h1>
            <p className="about-intro">
                UpNext is your go-to platform for discovering, creating, and managing events that bring communities together.
            </p>

            <div className="about-section">
                <h2>Our Mission</h2>
                <p>
                    Many community events struggle with limited visibility and reach, while potential attendees face difficulties discovering relevant local activities. Current solutions are fragmented across social media platforms, specialized websites, or physical bulletin boards, creating barriers to effective event discovery and management. Additionally, finding and booking suitable venues for events often involves a cumbersome process of researching, contacting, and negotiating with venue owners separately from the event planning process. UpNext addresses these challenges by providing a dedicated platform that integrates event creation, discovery, and venue booking in one cohesive ecosystem.
                </p>
            </div>

            <div className="about-section">
                <h2>What We Offer</h2>
                <ul>
                    <li>Discover local events tailored to your interests.</li>
                    <li>Plan and promote your own events with ease.</li>
                    <li>Book venues and manage event logistics efficiently.</li>
                    <li>Connect with attendees and build your community.</li>
                </ul>
            </div>

            <div className="about-section">
                <h2>Meet the Team</h2>
                <p>
                    We’re a passionate group of developers, designers, and community builders who believe in the power of shared experiences.
                </p>
            </div>

            <div className="about-footer">
                <p>Want to get in touch? Head over to our <a href="/contact">Contact Us</a> page.</p>
            </div>
        </div>
    );
}

export default About;
