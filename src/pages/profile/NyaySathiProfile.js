import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaClock, FaMoneyBillWave, FaStar, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import './NyaySathiProfile.css';

export function NyaySathiProfile({ profile, appointments, onProfileUpdate }) {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');
    const [requestedAppointments, setRequestedAppointments] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [userMap, setUserMap] = useState({});
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const fetchUserDetails = useCallback(async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/users/public/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return {
                    name: "User " + userId.substring(0, 6),
                    email: "user@example.com",
                };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            return {
                name: "Unknown User",
                email: "No email available",
            };
        }
    }, [BACKEND_URL]);

    const categorizedAppointments = useMemo(() => {
        if (!Array.isArray(appointments)) {
            return {
                requested: [],
                upcoming: [],
                pending: [],
            };
        }

        return {
            requested: appointments.filter((app) => app.status === 'Scheduled'),
            upcoming: appointments.filter((app) => app.status === 'Accepted'),
            pending: appointments.filter(
                (app) =>
                    app.status !== 'Accepted' &&
                    app.status !== 'Scheduled' &&
                    app.status !== 'Declined'
            ),
        };
    }, [appointments]);

    useEffect(() => {
        setRequestedAppointments(categorizedAppointments.requested);
        setUpcomingAppointments(categorizedAppointments.upcoming);
        setPendingAppointments(categorizedAppointments.pending);
    }, [categorizedAppointments]);

    useEffect(() => {
        const loadUserDetails = async () => {
            if (!Array.isArray(appointments) || appointments.length === 0) return;

            const userIds = new Set(appointments.map((app) => app.user_id));
            const newUserMap = { ...userMap };
            let hasNewUsers = false;

            for (const userId of userIds) {
                if (!newUserMap[userId]) {
                    const userDetails = await fetchUserDetails(userId);
                    if (userDetails) {
                        newUserMap[userId] = userDetails;
                        hasNewUsers = true;
                    }
                }
            }

            if (hasNewUsers) {
                setUserMap(newUserMap);
            }
        };

        loadUserDetails();
    }, [appointments, fetchUserDetails]);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${BACKEND_URL}/api/nyaysathi/available`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const handleLogout = () => {
        localStorage.clear();
        window.dispatchEvent(new Event('logout'));
        navigate('/');
    };

    const handleAppointmentAction = async (appointmentId, action) => {
        try {
            const token = localStorage.getItem('token');
            console.log(`[DEBUG] Sending ${action} request for appointment_id: ${appointmentId}`);
            const response = await fetch(`${BACKEND_URL}/api/appointments/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointment_id: appointmentId,
                }),
            });

            if (response.ok) {
                console.log(`[DEBUG] ${action} request successful for appointment_id: ${appointmentId}`);
                setError('');
                onProfileUpdate();
            } else {
                const errorData = await response.json();
                console.error(`[DEBUG] ${action} request failed:`, errorData);
                setError(`Failed to ${action} appointment. ${errorData.error || 'Please try again.'}`);
            }
        } catch (err) {
            console.error(`[DEBUG] Network error during ${action}:`, err);
            setError(`Failed to ${action} appointment. Please check your connection and try again.`);
        }
    };
    const handleAppointmentClick = (appointment) => {
        setSelectedAppointment(appointment);
    };

    const closeAppointmentDetails = () => {
        setSelectedAppointment(null);
    };
    const handleStartChat = async (appt) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required. Please log in again.');
                navigate('/auth');
                return;
            }

            console.log('[DEBUG] Appointment object:', appt); // Log the entire appt object

            const payload = {
                user_id: appt.user_id,
                nyaysathi_id: appt.nyaysathi_id,
                appointment_id: appt.appointment_id, // Assuming appt.id is the appointment ID
                appointment_date: appt.appointment_date, // Add this line
                is_ai_chat: false,
            };

            console.log('[DEBUG] Starting chat with payload:', payload);

            const response = await fetch(`${BACKEND_URL}/api/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok && data.chat_id) {
                console.log('[INFO] Chat created:', data);
                navigate(`/chat/${data.chat_id}`);
            } else {
                console.error('[ERROR] Chat creation failed:', data);
                setError(data.error || 'Unable to start chat. Please try again.');
            }
        } catch (err) {
            console.error('[ERROR] Server error in handleStartChat:', err);
            setError('Server error. Please try again later.');
        }
    };

    const renderAppointmentCard = (app) => {
        const user = userMap[app.user_id];

        return (
            <div key={app.appointment_id} className="appointment-request-card">
                <p><strong>User:</strong> {user ? `${user.name} (${user.email})` : 'Loading...'}</p>
                <p><strong>Requested Date:</strong> {formatDateTime(app.appointment_date)}</p>
                <p><strong>Duration:</strong> {app.duration} minutes</p>
                <p><strong>Mode:</strong> {app.mode}</p>
                <p><strong>Type:</strong> {app.consultation_type}</p>
                <p><strong>Case Type:</strong> {app.case_type}</p>
                <p><strong>Description:</strong> {app.case_description || 'N/A'}</p>
                <p><strong>Payment Status:</strong> {app.payment_status}</p>
                <div className="appointment-actions">
                    <button className="accept-btn" onClick={() => handleAppointmentAction(app.appointment_id, 'accept')}>
                        Accept
                    </button>
                    <button className="decline-btn" onClick={() => handleAppointmentAction(app.appointment_id, 'decline')}>
                        Decline
                    </button>
                </div>
            </div>
        );
    };

    const renderAppointmentDetails = () => {
        if (!selectedAppointment) return null;

        const user = userMap[selectedAppointment.user_id];

        return (
            <div className="appointment-details-overlay">
                <div className="appointment-details-box">
                    <div className="appointment-details-header">
                        <h3>Appointment Details</h3>
                        <button className="close-details-btn" onClick={closeAppointmentDetails}>
                            <FaTimes />
                        </button>
                    </div>
                    <div className="appointment-details-content">
                        <p><strong>User:</strong> {user ? `${user.name} (${user.email})` : 'Loading...'}</p>
                        <p><strong>Date and Time:</strong> {formatDateTime(selectedAppointment.appointment_date)}</p>
                        <p><strong>Duration:</strong> {selectedAppointment.duration} minutes</p>
                        <p><strong>Mode:</strong> {selectedAppointment.mode}</p>
                        <p><strong>Type:</strong> {selectedAppointment.consultation_type}</p>
                        <p><strong>Case Type:</strong> {selectedAppointment.case_type}</p>
                        <p><strong>Description:</strong> {selectedAppointment.case_description || 'N/A'}</p>
                        <p><strong>Payment Status:</strong> {selectedAppointment.payment_status}</p>
                        <p><strong>Status:</strong> {selectedAppointment.status}</p>

                        {selectedAppointment.status === 'Accepted' && (
                            <button
                                className="start-chat-btn"
                                onClick={() => handleStartChat(selectedAppointment)}
                            >
                                Start Chat
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div>
                        <h2>Overview</h2>
                        <p><strong>Name:</strong> {profile.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
                        <p><strong>Location:</strong> {`${profile.location?.city || ''}, ${profile.location?.state || ''}, ${profile.location?.country || ''}`}</p>
                    </div>
                );
            case 'details':
                return (
                    <div>
                        <h2>Details</h2>
                        <p><strong>Type:</strong> {profile.type || 'N/A'}</p>
                        <p><strong>Experience:</strong> {profile.experience || 'N/A'} years</p>
                        <p><strong>Bar Council ID:</strong> {profile.bar_council_id || 'N/A'}</p>
                        <p><strong>Languages:</strong> {profile.languages?.join(', ') || 'N/A'}</p>
                        <p><strong>Specializations:</strong> {profile.specializations?.join(', ') || 'N/A'}</p>
                    </div>
                );
            case 'timings':
                return (
                    <div>
                        <h2>Available Timings</h2>
                        {profile.available_timings?.length ? (
                            <ul>
                                {profile.available_timings.map((time, idx) => (
                                    <li key={idx}>
                                        <FaClock /> {time}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No available timings provided.</p>
                        )}
                    </div>
                );
            case 'ratings':
                return (
                    <div>
                        <h2>Ratings</h2>
                        <p>
                            <FaStar /> Average Rating: {profile.ratings?.average_rating || 'N/A'}
                        </p>
                        <p>Total Reviews: {profile.ratings?.total_reviews || 0}</p>
                        <ul>
                            {profile.ratings?.reviews?.length ? (
                                profile.ratings.reviews.map((r, idx) => (
                                    <li key={idx}>
                                        <strong>{r.user}</strong>: {r.comment} ({r.rating}⭐)
                                    </li>
                                ))
                            ) : (
                                <li>No reviews yet.</li>
                            )}
                        </ul>
                    </div>
                );
            case 'appointments':
                return (
                    <div>
                        <h2>Consultation Fee</h2>
                        <p>
                            <FaMoneyBillWave /> ₹{profile.consultation_fee || 'N/A'}
                        </p>

                        {error && <div className="error-message">{error}</div>}

                        <h3>Appointment Requests</h3>
                        {requestedAppointments.length > 0 ? (
                            requestedAppointments.map(renderAppointmentCard)
                        ) : (
                            <p>No new appointment requests at the moment.</p>
                        )}

                        <h3>Upcoming Appointments</h3>
                        <ul className="upcoming-appointments-list">
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map((app) => (
                                    <li
                                        key={app.appointment_id}
                                        className="clickable-appointment"
                                        onClick={() => handleAppointmentClick(app)}
                                    >
                                        <FaCalendarAlt /> {formatDateTime(app.appointment_date)} with{' '}
                                        {userMap[app.user_id]?.name || 'Loading...'}
                                        <button
                                            className="start-chat-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartChat(app);
                                            }}
                                        >
                                            Start Chat
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li>No upcoming appointments.</li>
                            )}
                        </ul>

                        <h3>Pending Appointments</h3>
                        <ul className="pending-appointments-list">
                            {pendingAppointments.length > 0 ? (
                                pendingAppointments.map((app) => (
                                    <li
                                        key={app.appointment_id}
                                        className="clickable-appointment"
                                        onClick={() => handleAppointmentClick(app)}
                                    >
                                        <FaCalendarAlt /> {formatDateTime(app.appointment_date)} - Status:{' '}
                                        {app.status || 'Pending'}
                                    </li>
                                ))
                            ) : (
                                <li>No pending appointments.</li>
                            )}
                        </ul>
                    </div>
                );
            default:
                return <p>Select a section to view details.</p>;
        }
    };

    return (
        <div className="nyaysathi-dashboard">
            <div className="dashboard-sidebar">
                <div className="profile-brief">
                    <div className="profile-avatar">
                        {profile.profile_picture ? (
                            <img src={profile.profile_picture} alt={profile.name} />
                        ) : (
                            <div className="default-avatar">{profile.name?.charAt(0)}</div>
                        )}
                    </div>
                    <h3>{profile.name || 'Name not available'}</h3>
                    <p>{profile.type || 'Type not provided'}</p>
                </div>
                <nav className="dashboard-nav">
                    {['overview', 'details', 'timings', 'ratings', 'appointments'].map((section) => (
                        <button
                            key={section}
                            className={activeSection === section ? 'active' : ''}
                            onClick={() => setActiveSection(section)}
                        >
                            {section.charAt(0).toUpperCase() + section.slice(1)}
                        </button>
                    ))}
                    <button className="logout-button" onClick={handleLogout}>
                        <FaSignOutAlt /> Logout
                    </button>
                </nav>
            </div>
            <div className="dashboard-content">
                {renderActiveSection()}
                {loading && <p>Loading users...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && users.length > 0 && (
                    <div>
                        <h3>Available Users</h3>
                        <ul>
                            {users.map((user) => (
                                <li key={user.nyaysathi_id}>{user.name}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {selectedAppointment && renderAppointmentDetails()}
        </div>
    );
}