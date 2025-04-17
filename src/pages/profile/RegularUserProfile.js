import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt,
    FaHistory, FaEdit, FaSignOutAlt, FaLanguage, FaLock
} from 'react-icons/fa';
import './UserProfile.css';

export function RegularUserProfile({ profile, appointments, onProfileUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...profile, newPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [previewNyaySathi, setPreviewNyaySathi] = useState(null);
    const navigate = useNavigate();

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new Event('logout'));
        navigate('/');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication token is missing. Please log in again.');
                navigate('/auth');
                return;
            }

            const response = await fetch(`${BACKEND_URL}/api/users/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    profile_picture: formData.profile_picture,
                    location: formData.location,
                    preferred_language: formData.preferred_language,
                    password: formData.newPassword || undefined,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess('Profile updated successfully!');
                setError('');
                setIsEditing(false);

                if (formData.name) localStorage.setItem('name', formData.name);
                if (formData.preferred_language) localStorage.setItem('preferred_language', formData.preferred_language);
                if (formData.location?.state) localStorage.setItem('state', formData.location.state);
                if (formData.location?.city) localStorage.setItem('city', formData.location.city);
                if (formData.newPassword) localStorage.setItem('password', formData.newPassword); // Note: Avoid storing passwords

                onProfileUpdate?.();
            } else {
                setError(data.error || 'Failed to update profile.');
                setSuccess('');
            }
        } catch (err) {
            console.error('[ERROR] Profile update error:', err);
            setError('An error occurred. Please try again.');
        }
    };

    useEffect(() => {
        setFormData({ ...profile, newPassword: '' });
    }, [profile]);

    const fetchNyaySathiPreview = async (nyaysathi_id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('[ERROR] No token for NyaySathi preview');
                return;
            }

            const response = await fetch(`${BACKEND_URL}/api/nyaysathi/${nyaysathi_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPreviewNyaySathi(data);
            } else {
                console.error('[ERROR] Failed to fetch NyaySathi preview:', await response.json());
            }
        } catch (err) {
            console.error('[ERROR] NyaySathi preview fetch error:', err);
        }
    };

    const handleStartChat = async (appt) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in again.');
                navigate('/auth');
                return;
            }

            // First, check for existing chat
            const checkResponse = await fetch(`${BACKEND_URL}/api/chats/details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ appointment_id: appt.appointment_id }),
            });

            const checkData = await checkResponse.json();
            if (checkResponse.ok && checkData.chat_id) {
                console.log('[INFO] Existing chat found:', checkData.chat_id);
                navigate(`/chat/${checkData.chat_id}`);
                return;
            }

            // If no existing chat, create a new one
            const payload = {
                user_id: localStorage.getItem('userId'),
                nyaysathi_id: appt.nyaysathi_id,
                appointment_id: appt.appointment_id,
                appointment_date: appt.appointment_date,
                is_ai_chat: false,
            };

            console.log('[DEBUG] Creating chat with payload:', payload);

            const createResponse = await fetch(`${BACKEND_URL}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const createData = await createResponse.json();
            if (createResponse.ok && createData.chat_id) {
                console.log('[INFO] Chat created:', createData);
                navigate(`/chat/${createData.chat_id}`);
            } else {
                console.error('[ERROR] Chat creation failed:', createData);
                setError(createData.error || 'Unable to start chat. Please try again.');
            }
        } catch (err) {
            console.error('[ERROR] Server error in handleStartChat:', err);
            setError('Server error. Please try again later.');
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile.profile_picture ? (
                            <img src={profile.profile_picture} alt={profile.name} />
                        ) : (
                            <span>{profile.name.charAt(0)}</span>
                        )}
                    </div>
                    <div className="profile-actions">
                        <button className="edit-button" onClick={() => setIsEditing(!isEditing)}>
                            <FaEdit /> {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                        <button className="logout-button" onClick={handleLogout}>
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                </div>

                <form className="profile-form" onSubmit={handleSave}>
                    <div className="form-group">
                        <label><FaUser /> Name:</label>
                        <span>{profile.name}</span>
                    </div>
                    <div className="form-group">
                        <label><FaEnvelope /> Email:</label>
                        <span>{profile.email}</span>
                    </div>
                    <div className="form-group">
                        <label><FaPhone /> Phone:</label>
                        <span>{profile.phone}</span>
                    </div>

                    <div className="form-group">
                        <label><FaMapMarkerAlt /> State:</label>
                        {isEditing ? (
                            <input
                                value={formData.location?.state || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        location: { ...formData.location, state: e.target.value },
                                    })
                                }
                                required
                            />
                        ) : (
                            <span>{profile.location?.state || 'N/A'}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label><FaMapMarkerAlt /> District:</label>
                        {isEditing ? (
                            <input
                                value={formData.location?.city || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        location: { ...formData.location, city: e.target.value },
                                    })
                                }
                                required
                            />
                        ) : (
                            <span>{profile.location?.city || 'N/A'}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label><FaLanguage /> Preferred Language:</label>
                        {isEditing ? (
                            <input
                                value={formData.preferred_language || ''}
                                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                                required
                            />
                        ) : (
                            <span>{profile.preferred_language || 'N/A'}</span>
                        )}
                    </div>

                    {isEditing && (
                        <div className="form-group">
                            <label><FaLock /> New Password:</label>
                            <input
                                type="password"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                placeholder="Enter new password (optional)"
                            />
                        </div>
                    )}

                    {isEditing && <button type="submit" className="save-button">Save</button>}
                </form>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="case-history">
                    <h2><FaHistory /> Case History</h2>
                    <ul>
                        {profile.case_history?.length > 0 ? (
                            profile.case_history.map((item, i) => (
                                <li key={i}>
                                    <strong>{item.type}</strong> - {item.status} (Date: {item.date})
                                </li>
                            ))
                        ) : (
                            <p>No case history available.</p>
                        )}
                    </ul>
                </div>

                <div className="appointments">
                    <h2>Appointments</h2>
                    <ul>
                        {appointments.length > 0 ? (
                            appointments.map((appt, i) => (
                                <li
                                    key={i}
                                    className={appt.status === 'Accepted' ? 'clickable-appointment' : ''}
                                    onMouseEnter={() => appt.status === 'Accepted' && fetchNyaySathiPreview(appt.nyaysathi_id)}
                                    onMouseLeave={() => setPreviewNyaySathi(null)}
                                    onClick={() => {
                                        if (appt.status === 'Accepted') {
                                            handleStartChat(appt);
                                        }
                                    }}
                                >
                                    <div className="appointment-info">
                                        <strong>{appt.appointment_date}</strong> - {appt.status}
                                        {appt.status === 'Accepted' && (
                                            <span style={{ marginLeft: '8px', color: '#007bff' }}>→ Chat</span>
                                        )}
                                    </div>
                                    {previewNyaySathi && previewNyaySathi.nyaysathi_id === appt.nyaysathi_id && (
                                        <div className="nyaysathi-preview">
                                            <div className="preview-avatar">
                                                {previewNyaySathi.profile_picture ? (
                                                    <img src={previewNyaySathi.profile_picture} alt={previewNyaySathi.name} />
                                                ) : (
                                                    <span>{previewNyaySathi.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="preview-details">
                                                <p><strong>{previewNyaySathi.name}</strong></p>
                                                <p>{previewNyaySathi.specialization || 'N/A'}</p>
                                                <p>{previewNyaySathi.location?.city || 'N/A'}, {previewNyaySathi.location?.state || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))
                        ) : (
                            <p>No appointments available.</p>
                        )}
                    </ul>
                </div>

                <div className="saved-lawyers">
                    <h2>Saved Lawyers</h2>
                    <ul>
                        {profile.saved_lawyers?.length > 0 ? (
                            profile.saved_lawyers.map((lawyer, i) => <li key={i}>{lawyer.name}</li>)
                        ) : (
                            <p>No saved lawyers available.</p>
                        )}
                    </ul>
                </div>

                <div className="reported-cases">
                    <h2>Reported Cases</h2>
                    <ul>
                        {profile.reported_cases?.length > 0 ? (
                            profile.reported_cases.map((caseItem, i) => <li key={i}>{caseItem}</li>)
                        ) : (
                            <p>No reported cases available.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}