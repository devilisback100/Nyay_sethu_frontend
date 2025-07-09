import { useParams, useNavigate } from 'react-router-dom';
import './NyaySathiDetails.css';
import { useState, useEffect } from 'react';

export function NyaySathiDetails() {
    // Use nyaysathi_id from the URL parameters
    const { nyaysathi_id } = useParams();
    const [nyaySathi, setNyaySathi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL ;

    useEffect(() => {
        const fetchNyaySathiDetails = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/nyaysathi/public/${nyaysathi_id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    setNyaySathi(data);
                } else {
                    const errorText = await response.text();
                    setError(`Failed to fetch NyaySathi details. Status: ${response.status}, Error: ${errorText}`);
                }
            } catch (error) {
                setError('Error fetching NyaySathi details: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNyaySathiDetails();
    }, [nyaysathi_id, BACKEND_URL]);

    const handleBookAppointment = () => {
        // Check if user is logged in before navigating
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
        } else {
            navigate(`/appointment/${nyaysathi_id}`);
        }
    };

    if (loading) return <div>Loading NyaySathi details...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!nyaySathi) {
        return (
            <div className="error-message">
                NyaySathi details not found. Please go back to the directory.
            </div>
        );
    }

    return (
        <div className="nyaysathi-details">
            {nyaySathi.profile_picture ? (
                <img
                    src={nyaySathi.profile_picture}
                    alt={nyaySathi.name}
                    className="details-image"
                />
            ) : (
                <div className="details-avatar">
                    {nyaySathi.name?.charAt(0).toUpperCase() || '?'}
                </div>
            )}
            <h1>{nyaySathi.name}</h1>
            <p>
                <strong>Type:</strong> {nyaySathi.type}
            </p>
            <p>
                <strong>Consultation Fee:</strong> ₹{nyaySathi.consultation_fee}
            </p>
            <p>
                <strong>Ratings:</strong> {nyaySathi.ratings?.average_rating || 0} ({nyaySathi.ratings?.total_reviews || 0} reviews)
            </p>
            <p>
                <strong>Location:</strong> {nyaySathi.location?.city}, {nyaySathi.location?.state}, {nyaySathi.location?.country}
            </p>
            <p>
                <strong>Available Timings:</strong> {nyaySathi.available_timings?.join(', ') || 'N/A'}
            </p>
            <p>
                <strong>Specialization:</strong> {nyaySathi.specialization?.join(', ') || 'N/A'}
            </p>

            <div className="appointment-section">
                <h2>Book an Appointment</h2>
                {nyaySathi.available_timings?.length > 0 ? (
                    <div className="booking-info">
                        <p>Consultation Fee: ₹{nyaySathi.consultation_fee}</p>
                        <ul className="timing-list">
                            {nyaySathi.available_timings.map((timing, index) => (
                                <li key={index}>{timing}</li>
                            ))}
                        </ul>
                        <button onClick={handleBookAppointment} className="book-appointment-btn">
                            Book Appointment
                        </button>
                    </div>
                ) : (
                    <p className="not-available">Currently not accepting appointments</p>
                )}
            </div>
        </div>
    );
}
