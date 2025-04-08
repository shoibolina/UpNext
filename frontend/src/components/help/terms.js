import React from 'react';
import './terms.css';

function Terms() {
    return (
        <div className="terms-container">
            <h1 className="terms-header">Terms of Service</h1>
            <p className="terms-intro">
                Welcome to UpNext! These terms govern your use of our platform. By using our service, you agree to abide by them.
            </p>

            <div className="terms-section">
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing or using UpNext, you agree to be bound by these Terms of Service and our Privacy Policy.
                    If you do not agree with any part, you may not use our services.
                </p>
            </div>

            <div className="terms-section">
                <h2>2. Account Registration</h2>
                <p>
                    You must provide accurate and complete information when creating an account. You are responsible
                    for safeguarding your password and activities under your account.
                </p>
            </div>

            <div className="terms-section">
                <h2>3. User Conduct</h2>
                <p>
                    You agree not to misuse the platform, post harmful content, or violate any laws. UpNext reserves
                    the right to suspend or terminate accounts for misconduct.
                </p>
            </div>

            <div className="terms-section">
                <h2>4. Event and Venue Rules</h2>
                <p>
                    All event listings must follow our community standards. Organizers are responsible for the
                    accuracy and conduct of their events.
                </p>
            </div>

            <div className="terms-section">
                <h2>5. Intellectual Property</h2>
                <p>
                    All content on UpNext, including logos, design, and features, are the property of UpNext.
                    You may not copy or distribute our content without permission.
                </p>
            </div>

            <div className="terms-section">
                <h2>6. Limitation of Liability</h2>
                <p>
                    UpNext is not liable for damages arising from your use of the platform. We do not guarantee
                    uninterrupted or error-free service.
                </p>
            </div>

            <div className="terms-section">
                <h2>7. Termination</h2>
                <p>
                    We reserve the right to suspend or terminate your access to the platform at our discretion,
                    without notice, for violations of these terms.
                </p>
            </div>

            <div className="terms-section">
                <h2>8. Changes to Terms</h2>
                <p>
                    We may update these Terms from time to time. Continued use of the platform after changes
                    implies your acceptance of the updated terms.
                </p>
            </div>

            <div className="terms-footer">
                <p>If you have any questions about these Terms, please <a href="/contact">contact us</a>.</p>
            </div>
        </div>
    );
}

export default Terms;
