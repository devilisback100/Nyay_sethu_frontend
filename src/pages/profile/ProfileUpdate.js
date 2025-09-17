// frontend: src/components/ProfileUpdate.js
import { useState } from 'react';
import './ProfileUpdate.css'; // We'll create this file next

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const SPECIALIZATIONS = ['Family Law', 'Criminal Law', 'Civil Law', 'Corporate Law', 'Other'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export function ProfileUpdate({ profile, onProfileUpdate }) {
    // State for general details form
    const [formData, setFormData] = useState({
        name: profile.name || '',
        phone: profile.phone || '',
        consultation_fee: profile.consultation_fee || 100,
        specialization: SPECIALIZATIONS.includes(profile.specialization) ? profile.specialization : 'Other',
        languages: profile.languages?.join(', ') || '',
        experience_years: profile.experience_years || '',
        available_timings: profile.available_timings || [],
    });
    const [otherSpecialization, setOtherSpecialization] = useState(
        SPECIALIZATIONS.includes(profile.specialization) ? '' : profile.specialization || ''
    );
    const [newTiming, setNewTiming] = useState({ day: 'Monday', time: '' });

    // State for password change form
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleAddTiming = () => {
        if (newTiming.time.trim() === '') {
            setError('Please enter a time slot.');
            return;
        }
        const timingString = `${newTiming.day}: ${newTiming.time.trim()}`;
        if (formData.available_timings.includes(timingString)) {
            setError('This timing slot already exists.');
            return;
        }
        setFormData(prev => ({
            ...prev,
            available_timings: [...prev.available_timings, timingString]
        }));
        setNewTiming({ ...newTiming, time: '' }); // Clear time input
        setError('');
    };
    const handleRemoveTiming = (timingToRemove) => {
        setFormData(prev => ({
            ...prev,
            available_timings: prev.available_timings.filter(t => t !== timingToRemove)
        }));
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

        const handleProfileSubmit = async (e) => {
            e.preventDefault();
            setMessage('');
            setError('');

            // Prepare payload, converting languages string to array and setting correct specialization
            const languagesArray = formData.languages.split(',').map(lang => lang.trim()).filter(Boolean);
            const finalSpecialization = formData.specialization === 'Other' ? otherSpecialization : formData.specialization;

            const payload = {
                ...formData,
                languages: languagesArray,
                specialization: finalSpecialization,
            };

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${BACKEND_URL}/api/nyaysathi/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Failed to update profile.');

                setMessage('Profile updated successfully!');
                onProfileUpdate();
            } catch (err) {
                setError(err.message);
            }
        };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('New passwords do not match.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/nyaysathi/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: passwordData.old_password,
                    new_password: passwordData.new_password,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to change password.');
            }

            setMessage('Password changed successfully!');
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' }); // Clear fields on success
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="profile-update-container">
            <h2>Update Profile & Settings</h2>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}

            <div className="update-section">
                <h3>General Information</h3>
                <form onSubmit={handleProfileSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="specialization">Specialization</label>
                        <select id="specialization" name="specialization" value={formData.specialization} onChange={handleFormChange}>
                            {SPECIALIZATIONS.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                        </select>
                    </div>
                    {formData.specialization === 'Other' && (
                        <div className="form-group">
                            <label htmlFor="otherSpecialization">Please Specify</label>
                            <input type="text" id="otherSpecialization" value={otherSpecialization} onChange={(e) => setOtherSpecialization(e.target.value)} placeholder="e.g., Intellectual Property Law" />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="experience_years">Years of Experience</label>
                        <input type="number" id="experience_years" name="experience_years" value={formData.experience_years} onChange={handleFormChange} disabled={profile.experience_years > 0} min="0" />
                        {profile.experience_years > 0 && <small className="form-hint">Years of experience can only be set once.</small>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="languages">Languages Spoken (comma-separated)</label>
                        <input type="text" id="languages" name="languages" value={formData.languages} onChange={handleFormChange} placeholder="e.g., English, Hindi, Kannada" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="consultation_fee">Consultation Fee (₹100 - ₹1000)</label>
                        <input type="number" id="consultation_fee" name="consultation_fee" value={formData.consultation_fee} onChange={handleFormChange} min="100" max="1000" />
                    </div>
                    <div className="form-group">
                        <label>General Availability</label>
                        <div className="timing-manager">
                            <select value={newTiming.day} onChange={e => setNewTiming({ ...newTiming, day: e.target.value })}>
                                {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                            </select>
                            <input type="text" value={newTiming.time} onChange={e => setNewTiming({ ...newTiming, time: e.target.value })} placeholder="e.g., 10:00 AM - 1:00 PM" />
                            <button type="button" onClick={handleAddTiming} className="add-btn">+</button>
                        </div>
                        <ul className="timings-list">
                            {formData.available_timings.map((timing, index) => (
                                <li key={index}>
                                    {timing}
                                    <button type="button" onClick={() => handleRemoveTiming(timing)} className="remove-btn">×</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button type="submit" className="update-btn">Update Information</button>
                </form>
            </div>

            <div className="update-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                        <label htmlFor="old_password">Old Password</label>
                        <input type="password" id="old_password" name="old_password" value={passwordData.old_password} onChange={handlePasswordChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password">New Password</label>
                        <input type="password" id="new_password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm_password">Confirm New Password</label>
                        <input type="password" id="confirm_password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} required />
                    </div>
                    <button type="submit" className="update-btn">Change Password</button>
                </form>
            </div>
        </div>
    );
}