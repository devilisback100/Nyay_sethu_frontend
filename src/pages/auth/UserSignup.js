import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaEnvelope, FaLock, FaMapMarkerAlt } from 'react-icons/fa';
import { TermsAndConditions } from '../../components/TermsAndConditions';

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
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [passwordWarning, setPasswordWarning] = useState('');
    const [otpRequestCooldown, setOtpRequestCooldown] = useState(0);
    const [otpVerifyCooldown, setOtpVerifyCooldown] = useState(0);
    const [transferChats, setTransferChats] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const guestId = location.state?.guestId;

    const API_KEY = process.env.REACT_APP_PLACES_API_KEY;
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        fetch('https://api.countrystatecity.in/v1/countries/IN/states', {
            headers: { 'X-CSCAPI-KEY': API_KEY }
        })
            .then(res => res.json())
            .then(data => setStates(data))
            .catch(() => setError('Failed to load states.'));
    }, [API_KEY]);

    useEffect(() => {
        if (formData.state) {
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

    const requestOtp = async () => {
        setOtpError('');
        setError('');
        if (!formData.email) {
            setOtpError('Please enter your email first.');
            return;
        }
        setOtpRequestCooldown(60);
        let interval = setInterval(() => {
            setOtpRequestCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpRequested(true);
                setOtpSent(true);
                setOtpError('');
            } else {
                setOtpError(data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setOtpError('Failed to send OTP.');
        }
    };

    const verifyOtp = async () => {
        setOtpError('');
        if (!otp) {
            setOtpError('Please enter the OTP.');
            return;
        }
        setOtpVerifyCooldown(60);
        let interval = setInterval(() => {
            setOtpVerifyCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/verify-email/otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp }),
            });
            const data = await res.json();
            if (res.ok) {
                setOtpVerified(true);
                setOtpError('');
            } else {
                setOtpError(data.error || 'Invalid OTP.');
            }
        } catch (err) {
            setOtpError('Failed to verify OTP.');
        }
    };

    const isStrongPassword = (password) => {
        return (
            password.length >= 8 &&
            /[A-Za-z]/.test(password) &&
            /[0-9]/.test(password)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!otpVerified) {
            setError('Please verify your email with OTP before signing up.');
            return;
        }
        if (!isStrongPassword(formData.password)) {
            setPasswordWarning('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }
        setPasswordWarning('');
        try {
            const response = await fetch(`${BACKEND_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    phone: '',
                    location: { state: formData.state, city: formData.district },
                }),
            });

            if (response.ok) {
                const userData = await response.json();
                const userId = userData.user_id;
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
                    localStorage.setItem('token', loginData.token);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('userType', 'user');
                    localStorage.setItem('email', formData.email);
                    localStorage.setItem('password', formData.password);
                    if (transferChats && guestId && userId) {
                        try {
                            const convertRes = await fetch(`${BACKEND_URL}/api/chats/guest/convert/${guestId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${loginData.token}`
                                },
                                body: JSON.stringify({ user_id: userId })
                            });
                            if (!convertRes.ok) {
                                setError('Failed to transfer guest chats. Please try again.');
                            } else {
                                localStorage.setItem('userId', userId);
                                setSuccess('Guest chats transferred successfully! Redirecting to your chatbot.');
                            }
                        } catch (err) {
                            setError('Error transferring guest chats. Please try again.');
                        }
                    } else {
                        setSuccess('Account created successfully! Redirecting to your chatbot.');
                    }
                    triggerAuthStateChange();
                    setTimeout(() => {
                        window.location.href = '/legal-help';
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
        setIsTermsOpen(true);
    };

    const handleTermsClose = () => {
        setIsTermsOpen(false);
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
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                setOtpRequested(false);
                                setOtpVerified(false);
                                setOtp('');
                            }}
                            required
                        />
                        {!otpRequested && (
                            <button
                                type="button"
                                className="otp-button"
                                onClick={requestOtp}
                                disabled={otpRequestCooldown > 0}
                            >
                                {otpRequestCooldown > 0 ? `Sending... (${otpRequestCooldown}s)` : 'Send OTP'}
                            </button>
                        )}
                        {otpRequested && !otpVerified && (
                            <div className="otp-verification">
                                <input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    className="verify-otp-button"
                                    onClick={verifyOtp}
                                    disabled={otpVerifyCooldown > 0}
                                >
                                    {otpVerifyCooldown > 0 ? 'Verifying...' : 'Verify OTP'}
                                </button>
                                {otpError && <span className="error-message">{otpError}</span>}
                            </div>
                        )}
                        {otpVerified && <span className="success-message">Email verified!</span>}
                    </div>
                    <div className="form-group">
                        <label><FaLock className="input-icon" /> Password</label>
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                if (!isStrongPassword(e.target.value)) {
                                    setPasswordWarning('Password must be at least 8 characters long and contain at least one letter and one number.');
                                } else {
                                    setPasswordWarning('');
                                }
                            }}
                            required
                        />
                        {passwordWarning && (
                            <div className="password-warning" style={{ color: "red", marginTop: "5px" }}>
                                {passwordWarning}
                            </div>
                        )}
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
                    {guestId && (
                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={transferChats}
                                    onChange={() => setTransferChats(!transferChats)}
                                />
                                <span>
                                    Transfer previous guest chats to this account
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group terms">
                    <label className="checkbox-label">
                        <input type="checkbox" required />
                        <span>
                            I agree to the{" "}
                            <span
                                className="terms-link"
                                style={{ color: "blue", textDecorationLine: "underline" }}
                                onClick={handleTermsClick}
                            >
                                Terms of Service and Privacy Policy
                            </span>
                        </span>
                    </label>
                </div>

                {!otpVerified && (
                    <div className="verify-email-warning" style={{ color: "red", marginBottom: "10px" }}>
                        Please verify your email with OTP before signing up.
                    </div>
                )}

                <button
                    type="submit"
                    className="submit-button"
                    disabled={!otpVerified || !isStrongPassword(formData.password)}
                >
                    Create Account
                </button>
            </form>

            <TermsAndConditions
                isOpen={isTermsOpen}
                onClose={handleTermsClose}
            />
        </div>
    );
}