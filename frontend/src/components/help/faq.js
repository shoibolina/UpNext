import React, { useState } from 'react';
import './faq.css';

const faqs = [
    {
        question: "What is UpNext?",
        answer: "UpNext is a platform that helps users discover, create, and manage local events seamlessly.",
    },
    {
        question: "How do I create an event?",
        answer: "Once you're logged in, go to the Dashboard and click on 'Create Event' to fill out the event details and publish it.",
    },
    {
        question: "Can I edit or cancel my event?",
        answer: "Yes, go to your Dashboard, select your event, and you'll find options to edit or cancel it.",
    },
    {
        question: "Is it free to join events?",
        answer: "Most events are free, but some may have ticketing or entry fees depending on the organizer.",
    },
    {
        question: "How do I book a venue?",
        answer: "Navigate to the Venues section in your dashboard, select a venue, and follow the booking steps provided.",
    },
    {
        question: "Can I see who is attending my event?",
        answer: "Yes, the attendee list is available for event organizers on the event details page in the dashboard.",
    },
    {
        question: "What if I forget my password?",
        answer: "Click on 'Forgot Password' on the login page, and follow the instructions to reset your password.",
    },
    {
        question: "How do I contact support?",
        answer: "You can reach out through the Contact Us page or email us directly at support@upnext.com.",
    }
];

function FAQs() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAnswer = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="faq-container">
            <h1 className="faq-header">Frequently Asked Questions</h1>
            <div className="faq-list">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <div
                            className={`faq-question ${openIndex === index ? 'active' : ''}`}
                            onClick={() => toggleAnswer(index)}
                        >
                            {faq.question}
                        </div>
                        {openIndex === index && <div className="faq-answer">{faq.answer}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FAQs;
