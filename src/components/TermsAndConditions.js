import React from 'react';
import './TermsAndConditions.css';

export function TermsAndConditions({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="terms-modal">
            <div className="terms-content">
                <h2>Terms and Conditions – NyaySetu</h2>
                <p className="terms-date">Effective Date: February 1, 2024</p>
                <p className="terms-date">Last Updated: February 1, 2024</p>

                <div className="terms-body">
                    <h3>1. Overview of Services</h3>
                    <ul>
                        <li>Offers a chatbot assistant to provide general legal guidance.</li>
                        <li>Connects users with independent, verified advocates for legal consultations.</li>
                        <li>Allows users and advocates to chat within the app through secure channels.</li>
                        <li>NyaySetu acts solely as a facilitator and does not provide legal advice or representation.</li>
                    </ul>

                    <h3>2. Chatbot Guidance Disclaimer</h3>
                    <ul>
                        <li>Provides non-binding, automated legal information based on public data and logic.</li>
                        <li>Not a substitute for professional legal advice.</li>
                        <li>Use of chatbot guidance is at the user's own risk.</li>
                        <li>No guarantee of accuracy, legality, or completeness of chatbot responses.</li>
                    </ul>

                    <h3>3. Advocate Services</h3>
                    <ul>
                        <li>Advocates are independent third parties using the platform.</li>
                        <li>NyaySetu does not guarantee outcomes, enforce agreements, or verify success rates.</li>
                        <li>All consultations, fee discussions, and services are between the user and advocate.</li>
                        <li>NyaySetu is not liable for misconduct, incorrect advice, or service quality.</li>
                    </ul>

                    <h3>4. User Responsibilities</h3>
                    <ul>
                        <li>Use the platform lawfully and respectfully.</li>
                        <li>Do not abuse the chatbot or advocate chat.</li>
                        <li>Avoid spreading misinformation or harmful content.</li>
                        <li>Verify advocate credentials before relying on advice.</li>
                    </ul>

                    <h3>5. Payments and Fees</h3>
                    <ul>
                        <li>Basic chatbot use may be free; advanced features or advocate services may involve fees.</li>
                        <li>NyaySetu may charge a service/facilitation fee.</li>
                        <li>Payment issues are to be resolved between user and advocate. NyaySetu is not liable.</li>
                    </ul>

                    <h3>6. Privacy and Data Protection</h3>
                    <ul>
                        <li>Your data is protected. See our Privacy Policy for full details.</li>
                        <li>All conversations may be recorded for compliance and quality purposes.</li>
                        <li>No data is sold or shared unless required by law.</li>
                    </ul>

                    <h3>7. Confidentiality</h3>
                    <ul>
                        <li>NyaySetu cannot guarantee confidentiality of shared information.</li>
                        <li>Avoid sharing sensitive data unless necessary and with caution.</li>
                    </ul>

                    <h3>8. Intellectual Property</h3>
                    <ul>
                        <li>App, logo, design, chatbot, and content are intellectual property of NyaySetu or licensors.</li>
                        <li>Unauthorized use, reproduction, or distribution is prohibited.</li>
                    </ul>

                    <h3>9. Limitation of Liability</h3>
                    <ul>
                        <li>NyaySetu is not liable for any loss, damages, or decisions made through the platform.</li>
                        <li>NyaySetu only facilitates connections and is not responsible for user actions.</li>
                    </ul>

                    <h3>10. Termination and Suspension</h3>
                    <ul>
                        <li>We may suspend or terminate accounts for violations or misuse.</li>
                        <li>Access may be restricted for fraud, abuse, or suspected activity.</li>
                    </ul>

                    <h3>11. Dispute Resolution</h3>
                    <ul>
                        <li>Governed by laws of [Insert Country/State Jurisdiction].</li>
                        <li>Initial resolution via support or mediation is required before court/arbitration.</li>
                        <li>Unresolved matters will be referred to courts/arbitration in [Insert Location].</li>
                    </ul>

                    <h3>12. Changes to Terms</h3>
                    <ul>
                        <li>Terms may be updated any time, with new dates reflected above.</li>
                        <li>Continued use implies agreement to updated terms.</li>
                    </ul>

                    <h3>13. Contact Us</h3>
                    <ul>
                        <li>📧 Email: [Insert Support Email]</li>
                        <li>📞 Phone: [Insert Support Number]</li>
                        <li>🌐 Website: [Insert Website]</li>
                    </ul>

                    <h3>14. Acceptance and Popup Disclaimer</h3>
                    <ul>
                        <li>The chatbot is for informational purposes only.</li>
                        <li>Legal decisions are made at your own risk.</li>
                        <li>Advocates are not employed by NyaySetu.</li>
                        <li>By continuing, you accept these Terms and Conditions.</li>
                    </ul>
                </div>

                <div className="terms-actions">
                    <button className="decline-button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
