import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegularUserProfile } from './RegularUserProfile';
import { NyaySathiProfile } from './NyaySathiProfile';

export function UserProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [internalUserType, setInternalUserType] = useState(null);

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    // Utility function to determine the correct user type
    const determineUserType = useCallback(() => {
        // Read from token first, as it's the most authoritative source
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No token found in localStorage");
            return null;
        }

        try {
            // Simple decode function - not full verification
            const base64Url = token.split('.')[1];
            if (!base64Url) {
                console.error("Invalid token format - missing payload segment");
                return null;
            }

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c =>
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            const decoded = JSON.parse(jsonPayload);
            console.log("Decoded token payload:", decoded);

            // Return the user type from token if available
            if (decoded.userType) {
                console.log("Found userType in token:", decoded.userType);
                return decoded.userType;
            }

            // If we have specific IDs, we can infer the type
            if (decoded.nyaysathi_id) {
                console.log("Found nyaysathi_id in token, assuming nyaysathi type");
                return 'nyaysathi';
            }

            if (decoded.user_id) {
                // This is ambiguous, could be either type
                console.log("Found user_id in token, checking localStorage for clarification");
                const storedType = localStorage.getItem('userType');
                if (storedType) {
                    return storedType;
                }
                // Default to regular user if we can't determine
                console.log("Defaulting to 'user' type");
                return 'user';
            }

        } catch (e) {
            console.error("Error decoding token:", e);
        }

        // Fallback to localStorage if token decode fails
        const storedType = localStorage.getItem('userType');
        console.log("Falling back to localStorage userType:", storedType);
        return storedType || null;
    }, []);

    // Only fetch profile after user type is set
    useEffect(() => {
        if (!internalUserType) {
            const detectedType = determineUserType();
            if (detectedType) {
                setInternalUserType(detectedType);
            } else {
                setError("Could not determine user type. Please log in again.");
                localStorage.clear();
                navigate('/auth');
            }
        }
    }, [determineUserType, internalUserType, navigate]);

    useEffect(() => {
        if (internalUserType) {
            fetchProfileAndAppointments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [internalUserType]);

    const fetchProfileAndAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const storedType = localStorage.getItem('userType');
            if (!token || !internalUserType) {
                setError('Authentication required. Please login.');
                localStorage.clear();
                setLoading(false);
                navigate('/auth');
                return;
            }

            // Only use the correct endpoint for the user type
            let endpoint;
            if (internalUserType === 'nyaysathi') {
                endpoint = `${BACKEND_URL}/api/auth/user/details`;
            } else if (internalUserType === 'user') {
                endpoint = `${BACKEND_URL}/api/users/details`;
            } else {
                setError('Unknown user type. Please login again.');
                localStorage.clear();
                setLoading(false);
                navigate('/auth');
                return;
            }

            const profileResponse = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            // Handle user type mismatch or not found
            if (profileResponse.status === 401 || profileResponse.status === 403) {
                setError('Session expired, user not found, or user type mismatch. Please login again.');
                localStorage.clear();
                setLoading(false);
                navigate('/auth');
                return;
            }

            if (!profileResponse.ok) {
                setLoading(false);
                throw new Error('Profile fetch failed: ' + profileResponse.status);
            }

            const profileData = await profileResponse.json();
            setProfile(profileData);

            const appointmentsResponse = await fetch(`${BACKEND_URL}/api/appointments/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!appointmentsResponse.ok) {
                setLoading(false);
                throw new Error('Appointments fetch failed: ' + appointmentsResponse.status);
            }

            const appointmentsData = await appointmentsResponse.json();
            setAppointments(appointmentsData);
            setLoading(false); // <-- Set loading to false after all data is fetched
        } catch (err) {
            setError(err.message || 'Failed to load profile and appointments.');
            localStorage.clear();
            setLoading(false); // <-- Set loading to false on error
            navigate('/auth');
        }
    };

    // Handle loading and error states
    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
                <button
                    onClick={() => navigate('/auth')}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">Warning:</strong>
                    <span className="block sm:inline"> Could not load profile data. Please try logging in again.</span>
                </div>
                <button
                    onClick={() => navigate('/auth')}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <>
            {(internalUserType === 'user') ? (
                <RegularUserProfile
                    profile={profile}
                    appointments={appointments}
                    onProfileUpdate={() => fetchProfileAndAppointments(internalUserType)}
                />
            ) : (
                <NyaySathiProfile
                    profile={profile}
                    appointments={appointments}
                    onProfileUpdate={() => fetchProfileAndAppointments(internalUserType)}
                />
            )}
        </>
    );
}