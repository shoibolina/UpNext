import React from 'react';
import './privacy.css';

function Privacy() {
    return (
        <div className="privacy-container">
            <h1 className="privacy-header">Privacy Policy</h1>
            <p className="privacy-intro">
                At UpNext, we respect your privacy and are committed to protecting your personal information.
            </p>

            <div className="privacy-section">
                <h2>1. Information We Collect</h2>
                <p>
                    We collect information that you provide directly to us, such as when you sign up for an account,
                    create events, or contact support. This may include your name, email, and any other details you provide.
                </p>
            </div>

            <div className="privacy-section">
                <h2>2. How We Use Your Information</h2>
                <p>
                    We use your information to provide, maintain, and improve our services. This includes event discovery,
                    personalized recommendations, and communication regarding your account.
                </p>
            </div>

            <div className="privacy-section">
                <h2>3. Sharing Your Information</h2>
                <p>
                    We do not sell or rent your personal information. We may share information with trusted third parties
                    who help us operate our platform, provided they follow strict data protection guidelines.
                </p>
            </div>

            <div className="privacy-section">
                <h2>4. Your Rights</h2>
                <p>
                    You can access, update, or delete your personal data at any time by contacting us. You can also
                    request a copy of your data or restrict how we use it.
                </p>
            </div>

            <div className="privacy-section">
                <h2>5. Cookies</h2>
                <p>
                    We use cookies to enhance your experience on our site. You can control cookies through your browser settings.
                </p>
            </div>

            <div className="privacy-section">
                <h2>6. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy occasionally. When we do, we will notify you by updating the date at the top of this page.
                </p>
            </div>

            <div className="privacy-footer">
                <p>If you have questions or concerns about this Privacy Policy, please <a href="/contact">contact us</a>.</p>
            </div>
        </div>
    );
}

export default Privacy;
