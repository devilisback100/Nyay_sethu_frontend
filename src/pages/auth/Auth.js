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
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

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

                console.log('[DEBUG] Decoded token:', decoded);

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

                console.log('[DEBUG] Local storage set after login:', {
                    userId: localStorage.getItem('userId'),
                    userType: localStorage.getItem('userType'),
                    email: localStorage.getItem('email')
                });

                navigate('/profile');
            } else {
                const err = await response.text();
                console.warn('[WARN] Login failed:', err);
                alert('Invalid email or password.');
            }
        } catch (error) {
            console.error('[ERROR] Login error:', error);
            alert('An error occurred during login.');
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
                        </form>
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