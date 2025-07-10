import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { TermsAndConditions } from '../../components/TermsAndConditions';

// eslint-disable-next-line no-unused-vars
export function UserSignup({ onBack }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        state: '',
        district: '',
    });
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isTermsOpen, setIsTermsOpen] = useState(false); // State to control the modal
    const navigate = useNavigate();

    const API_KEY = process.env.REACT_APP_PLACES_API_KEY;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        // Fetch Indian states on mount
        fetch('https://api.countrystatecity.in/v1/countries/IN/states', {
            headers: { 'X-CSCAPI-KEY': API_KEY }
        })
            .then(res => res.json())
            .then(data => setStates(data))
            .catch(() => setError('Failed to load states.'));
    }, [API_KEY]);

    useEffect(() => {
        if (formData.state) {
            // Fetch cities when state is selected
            fetch(`https://api.countrystatecity.in/v1/countries/IN/states/${formData.state}/cities`, {
                headers: { 'X-CSCAPI-KEY': API_KEY }
            })
                .then(res => res.json())
                .then(data => setCities(data))
                .catch(() => setError('Failed to load cities.'));
        } else {
            setCities([]);
        }
    }, [formData.state, API_KEY]);

    const triggerAuthStateChange = () => {
        const event = new CustomEvent('authStateChanged');
        window.dispatchEvent(event);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${BACKEND_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    location: { state: formData.state, city: formData.district },
                }),
            });

            if (response.ok) {
                // Signup successful, now log the user in to get the token
                const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                    }),
                });

                if (loginRes.ok) {
                    const loginData = await loginRes.json();
                    // Store token and user info
                    localStorage.setItem('token', loginData.token);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userType', 'user');
                    localStorage.setItem('email', formData.email);
                    localStorage.setItem('password', formData.password);
                    triggerAuthStateChange(); // Trigger auth state change event
                    setSuccess('Account created successfully! Redirecting to your chatbot');
                    setError('');
                    setTimeout(() => {
                        window.location.href = '/legal-help'; // Redirect to the legal help page
                    }, 2000);
                } else {
                    setError('Account created, but failed to log in. Please sign in manually.');
                    setSuccess('');
                }
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create account.');
                setSuccess('');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setSuccess('');
        }
    };

    const handleTermsClick = () => {
        setIsTermsOpen(true); // Open the modal
    };

    const handleTermsClose = () => {
        setIsTermsOpen(false); // Close the modal
    };

    return (
        <div className="signup-container">
            <button className="back-button" onClick={onBack}>
                <FaArrowLeft /> Back to Sign In
            </button>
            <div className="signup-header">
                <div className="signup-title">
                    <h2>Create Your Account</h2>
                    <p>Join NyaySathi to get legal assistance</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label><FaUser className="input-icon" /> Full Name</label>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><FaEnvelope className="input-icon" /> Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><FaLock className="input-icon" /> Password</label>
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><FaPhone className="input-icon" /> Phone Number</label>
                        <input
                            type="tel"
                            placeholder="Enter your phone number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label><FaMapMarkerAlt className="input-icon" /> State</label>
                        <select
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value, district: '' })}
                            required
                        >
                            <option value="">Select your state</option>
                            {states.map((state) => (
                                <option key={state.iso2} value={state.iso2}>{state.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label><FaMapMarkerAlt className="input-icon" /> District / City</label>
                        <select
                            value={formData.district}
                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            required
                        >
                            <option value="">Select your city</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.name}>{city.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <div className="form-group terms">
                    <label className="checkbox-label">
                        <input type="checkbox" required />
                        <span>I agree to the <span className="terms-link" style={{ color: "blue", textDecorationLine: "underline" }} onClick={handleTermsClick}>Terms of Service and Privacy Policy</span></span>
                    </label>
                </div>
                <button type="submit" className="submit-button">Create Account</button>
            </form>
            <TermsAndConditions
                isOpen={isTermsOpen}
                onClose={handleTermsClose}
            />
        </div>
    );
}
