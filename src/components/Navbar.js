import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userType, setUserType] = useState(null);

    const checkAuthStatus = () => {
        const email = localStorage.getItem('email');
        const password = localStorage.getItem('password');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (isLoggedIn && email && password) {
            setIsLoggedIn(true);
            setUserType(localStorage.getItem('userType'));
        } else {
            setIsLoggedIn(false);
            setUserType(null);
        }
    };

    useEffect(() => {
        // Check auth status on mount
        checkAuthStatus();

        // Listen for custom auth events
        const handleAuthChange = () => {
            checkAuthStatus();
        };

        window.addEventListener('authStateChanged', handleAuthChange);

        // Cleanup listener on unmount
        return () => {
            window.removeEventListener('authStateChanged', handleAuthChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setUserType(null);
        window.location.href = '/auth';
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        document.body.classList.toggle('menu-open');
    };

    const handleNavClick = () => {
        setIsMenuOpen(false);
        document.body.classList.remove('menu-open');
    };

    return (
        <nav className={`navbar ${isMenuOpen ? 'menu-open' : ''}`}>
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={handleNavClick}>
                    <h1>
                        <span className="brand-nyay">न्याय</span>
                        <span className="brand-sathi">Setu</span>
                    </h1>
                </Link>
                <button
                    className={`hamburger ${isMenuOpen ? 'active' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
                <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                    <NavLink to="/legal-help" onClick={handleNavClick}>Chatbot</NavLink>
                    <NavLink to="/nearby-help" onClick={handleNavClick}>Find Help</NavLink>
                    <NavLink to="/nyaysathi" onClick={handleNavClick}>NyaySathi</NavLink>
                    <NavLink to="/about" onClick={handleNavClick}>About Us</NavLink>
                    <NavLink to="/services" onClick={handleNavClick}>Services</NavLink>
                    <NavLink to="/resources" onClick={handleNavClick}>Resources</NavLink>
                    <NavLink to="/success-stories" onClick={handleNavClick}>Success Stories</NavLink>
                    {isLoggedIn ? (
                        <>
                            <NavLink to="/profile" className="nav-profile" onClick={handleNavClick}>
                                {userType === 'nyaysathi' ? 'NyaySathi Profile' : 'Profile'}
                            </NavLink>
                            <button className="logout-button" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <NavLink to="/auth" className="nav-cta" onClick={handleNavClick}>Get Started</NavLink>
                    )}
                </div>
            </div>
        </nav>
    );
}

const NavLink = ({ to, children, onClick, className }) => (
    <Link to={to} className={`nav-link ${className || ''}`} onClick={onClick}>
        {children}
    </Link>
);