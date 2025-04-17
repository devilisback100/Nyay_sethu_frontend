import React from 'react';
import { FaFacebook, FaTwitter, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

export function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <h2 className="brand-name">NyaySathi</h2>
                    <p className="brand-tagline">Your trusted legal companion</p>
                </div>

                <div className="social-icons">
                    <button className="social-icon-button">
                        <FaFacebook className="social-icon" />
                    </button>
                    <button className="social-icon-button">
                        <FaTwitter className="social-icon" />
                    </button>
                    <button className="social-icon-button">
                        <FaLinkedin className="social-icon" />
                    </button>
                </div>

                <div className="copyright">
                    <p>© 2024 NyaySathi. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}