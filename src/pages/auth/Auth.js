import { useState } from 'react';
import { FaUser, FaBalanceScale } from 'react-icons/fa';
import { UserSignup } from './UserSignup';
import { NyaySathiSignup } from './NyaySathiSignup';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Auth.css';

export function Auth() {
    const [authMode, setAuthMode] = useState('signin');
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [showRecovery, setShowRecovery] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryOtpSent, setRecoveryOtpSent] = useState(false);
    const [recoveryOtp, setRecoveryOtp] = useState('');
    const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
    const [recoveryStep, setRecoveryStep] = useState(1);
    const [recoveryError, setRecoveryError] = useState('');
    const [recoverySuccess, setRecoverySuccess] = useState('');

    const navigate = useNavigate();
    const triggerAuthStateChange = () => {
        const event = new CustomEvent('authStateChanged');
        window.dispatchEvent(event);
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginData.email,
                    password: loginData.password
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;
                const decoded = jwtDecode(token);


                const userType = decoded.user_type || (decoded.nyaysathi_id ? 'nyaysathi' : 'user');

                // Update localStorage immediately
                localStorage.setItem('token', token);
                localStorage.setItem('userId', decoded.user_id || decoded.nyaysathi_id);
                localStorage.setItem('email', loginData.email);
                localStorage.setItem('password', loginData.password);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userType', userType);
                localStorage.setItem('preferred_language', decoded.preferred_language || 'english');
                localStorage.setItem('location', decoded.location?.city || 'unknown');
                triggerAuthStateChange();


                navigate('/legal-help');
            } else {
                const err = await response.text();
                alert('Invalid email or password.');
            }
        } catch (error) {
            alert('An error occurred during login.');
        }
    };

    // Password recovery handlers
    const handleRecoveryRequest = async (e) => {
        e.preventDefault();
        setRecoveryError('');
        setRecoverySuccess('');
        if (!recoveryEmail) {
            setRecoveryError('Please enter your email.');
            return;
        }
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const res = await fetch(`${BACKEND_URL}/api/auth/password-reset/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: recoveryEmail }),
            });
            const data = await res.json();
            if (res.ok) {
                setRecoveryOtpSent(true);
                setRecoveryStep(2);
                setRecoverySuccess('OTP sent to your email.');
            } else {
                setRecoveryError(data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            setRecoveryError('Failed to send OTP.');
        }
    };

    // Password strength check
    const isStrongPassword = (password) => {
        return (
            password.length >= 8 &&
            /[A-Za-z]/.test(password) &&
            /[0-9]/.test(password)
        );
    };

    const handleRecoveryConfirm = async (e) => {
        e.preventDefault();
        setRecoveryError('');
        setRecoverySuccess('');
        if (!recoveryEmail || !recoveryOtp || !recoveryNewPassword) {
            setRecoveryError('Please fill all fields.');
            return;
        }
        if (!isStrongPassword(recoveryNewPassword)) {
            setRecoveryError('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
            const res = await fetch(`${BACKEND_URL}/api/auth/password-reset/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: recoveryEmail,
                    token: recoveryOtp,
                    new_password: recoveryNewPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setRecoverySuccess('Password reset successful! Redirecting to login...');
                setRecoveryStep(3);
                setTimeout(() => {
                    setShowRecovery(false);
                    setRecoveryEmail('');
                    setRecoveryOtp('');
                    setRecoveryNewPassword('');
                    setRecoveryStep(1);
                    setRecoveryError('');
                    setRecoverySuccess('');
                    setAuthMode('signin');
                }, 2000);
            } else {
                setRecoveryError(data.error || 'Failed to reset password.');
            }
        } catch (err) {
            setRecoveryError('Failed to reset password.');
        }
    };

    return (
        <div className="auth-page">
            {authMode === 'signin' ? (
                <div className="auth-container">
                    <h1>Welcome to <span className="highlight">न्यायSathi</span></h1>
                    <div className="signin-section">
                        <form className="signin-form" onSubmit={handleLogin}>
                            <input
                                type="email"
                                placeholder="Email"
                                value={loginData.email}
                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                required
                            />
                            <button type="submit" className="signin-button">Sign In</button>
                            <button
                                type="button"
                                className="forgot-password-link"
                                style={{ background: 'none', border: 'none', color: '#1976d2', marginTop: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => setShowRecovery(true)}
                            >
                                Forgot Password?
                            </button>
                        </form>
                        {/* Password Recovery Modal/Form */}
                        {showRecovery && (
                            <div className="password-recovery-modal" style={{
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                                padding: '2rem',
                                maxWidth: '400px',
                                margin: '2rem auto'
                            }}>
                                <h2>Password Recovery</h2>
                                {recoveryStep === 1 && (
                                    <form onSubmit={handleRecoveryRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="signin-button">Send OTP</button>
                                    </form>
                                )}
                                {recoveryStep === 2 && (
                                    <form onSubmit={handleRecoveryConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Enter OTP"
                                            value={recoveryOtp}
                                            onChange={(e) => setRecoveryOtp(e.target.value)}
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={recoveryNewPassword}
                                            onChange={(e) => setRecoveryNewPassword(e.target.value)}
                                            required
                                        />
                                        {!isStrongPassword(recoveryNewPassword) && recoveryNewPassword.length > 0 && (
                                            <div style={{ color: "#d32f2f", fontSize: "0.95rem" }}>
                                                Password must be at least 8 characters long and contain at least one letter and one number.
                                            </div>
                                        )}
                                        <button type="submit" className="signin-button">Reset Password</button>
                                    </form>
                                )}
                                {recoveryStep === 3 && (
                                    <div style={{ color: '#388e3c', marginTop: '1rem' }}>
                                        {recoverySuccess}
                                    </div>
                                )}
                                {recoveryError && (
                                    <div style={{ color: '#d32f2f', marginTop: '1rem' }}>
                                        {recoveryError}
                                    </div>
                                )}
                                {recoverySuccess && recoveryStep !== 3 && (
                                    <div style={{ color: '#388e3c', marginTop: '1rem' }}>
                                        {recoverySuccess}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="back-button"
                                    style={{ marginTop: '1rem' }}
                                    onClick={() => {
                                        setShowRecovery(false);
                                        setRecoveryEmail('');
                                        setRecoveryOtp('');
                                        setRecoveryNewPassword('');
                                        setRecoveryStep(1);
                                        setRecoveryError('');
                                        setRecoverySuccess('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <div className="auth-options">
                            <button className="auth-option" onClick={() => setAuthMode('user-signup')}>
                                <FaUser />
                                <h3>Sign Up as User</h3>
                                <p>Get legal help and guidance</p>
                            </button>
                            <button className="auth-option" onClick={() => setAuthMode('nyaysathi-signup')}>
                                <FaBalanceScale />
                                <h3>Sign Up as NyaySathi</h3>
                                <p>Provide legal assistance</p>
                            </button>
                        </div>
                    </div>
                </div>
            ) : authMode === 'user-signup' ? (
                <UserSignup onBack={() => setAuthMode('signin')} />
            ) : (
                <NyaySathiSignup onBack={() => setAuthMode('signin')} />
            )}
        </div>
    );
}